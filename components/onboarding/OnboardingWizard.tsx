"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthButton } from "@/components/auth/AuthButton";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchCategories } from "@/lib/categories/fetchCategories";
import {
  ONBOARDING_STEP_LABELS,
  TOTAL_ONBOARDING_STEPS,
} from "@/lib/onboarding/constants";
import {
  detectCompletedSetupSteps,
  mergeDetectedSteps,
  resolveSetupResumeStep,
} from "@/lib/onboarding/detect-progress";
import {
  completeOnboarding,
  logOnboardingStarted,
  restartOnboarding,
} from "@/lib/onboarding/progress-actions";
import { getOnboardingProgress } from "@/lib/onboarding/progress";
import { saveOnboardingPreferences } from "@/lib/onboarding/savePreferences";
import { saveRestaurantInfo } from "@/lib/onboarding/saveRestaurantInfo";
import type {
  OnboardingQrResult,
  PreferencesFormData,
  RestaurantInfoFormData,
} from "@/lib/onboarding/types";
import { updateOnboardingStep } from "@/lib/onboarding/updateOnboardingStep";
import { fetchQrCodes } from "@/lib/qr-codes/fetchQrCodes";
import {
  fetchUserRestaurant,
  isRestaurantSetupComplete,
} from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { OnboardingSuccess } from "./OnboardingSuccess";
import { StepFinish } from "./StepFinish";
import { StepFirstQr } from "./StepFirstQr";
import { StepMenuStructure } from "./StepMenuStructure";
import { StepPreferences } from "./StepPreferences";
import { StepRestaurantInfo } from "./StepRestaurantInfo";
import { WizardProgress } from "./WizardProgress";

type WizardPhase = "loading" | "wizard" | "success" | "already_complete";

export function OnboardingWizard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<WizardPhase>("loading");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [step, setStep] = useState(1);
  const [qrResult, setQrResult] = useState<OnboardingQrResult | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const data = await fetchUserRestaurant();
      if (!mounted) return;

      setRestaurant(data);

      if (data?.id) {
        void logOnboardingStarted(data);
      }

      if (isRestaurantSetupComplete(data)) {
        setPhase("already_complete");
        return;
      }

      const [categoriesResult, qrResultData] = await Promise.all([
        fetchCategories(),
        fetchQrCodes(data),
      ]);
      if (!mounted) return;

      const progress = getOnboardingProgress(data);
      const detected = detectCompletedSetupSteps({
        restaurant: data,
        categoryCount: categoriesResult.ok ? categoriesResult.data.length : 0,
        qrCount: qrResultData.ok ? qrResultData.data.length : 0,
      });
      const completedSteps = mergeDetectedSteps(
        progress.completedSteps,
        detected,
      );
      const resume = resolveSetupResumeStep({
        storedStep: progress.currentStep,
        completedSteps,
        hasName: Boolean(data?.restaurant_name?.trim()),
        categoryCount: categoriesResult.ok ? categoriesResult.data.length : 0,
        qrCount: qrResultData.ok ? qrResultData.data.length : 0,
      });

      if (qrResultData.ok && qrResultData.data[0]) {
        setQrResult({
          name: qrResultData.data[0].name,
          url: qrResultData.data[0].url,
        });
      }

      setStep(resume);
      setPhase("wizard");
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const goDashboard = useCallback(() => {
    router.push("/dashboard");
    router.refresh();
  }, [router]);

  const handleRestaurantInfo = useCallback(
    async (values: RestaurantInfoFormData) => {
      const result = await saveRestaurantInfo(values);
      if (!result.ok) return result.message;
      setRestaurant(result.restaurant);
      setStep(2);
      return null;
    },
    [],
  );

  const handleMenuContinue = useCallback(async () => {
    const result = await updateOnboardingStep(3, 2);
    if (!result.ok) showToast(result.message, "error");
    setStep(3);
  }, [showToast]);

  const handlePreferences = useCallback(async (values: PreferencesFormData) => {
    const result = await saveOnboardingPreferences(values);
    if (!result.ok) return result.message;
    setRestaurant(result.restaurant);
    setStep(4);
    return null;
  }, []);

  const handlePreferencesSkip = useCallback(async () => {
    const result = await saveOnboardingPreferences(
      {
        currency: restaurant?.currency || "KWD",
        timezone: restaurant?.timezone || "Asia/Kuwait",
        preferredLanguage: restaurant?.preferred_language || "en",
        bilingualMenu: restaurant?.bilingual_menu ?? true,
        reservationsEnabled: restaurant?.reservations_enabled ?? true,
      },
      { skipped: true },
    );
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setRestaurant(result.restaurant);
    setStep(4);
  }, [restaurant, showToast]);

  const handleQrContinue = useCallback(
    async (qr: OnboardingQrResult | null) => {
      setQrResult(qr);
      const result = await updateOnboardingStep(5, 4, !qr);
      if (!result.ok) showToast(result.message, "error");
      setStep(5);
    },
    [showToast],
  );

  const handleFinish = useCallback(async () => {
    const result = await completeOnboarding(restaurant?.id);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setRestaurant(result.restaurant);
    setPhase("success");
  }, [restaurant?.id, showToast]);

  const handleRestart = useCallback(async () => {
    const result = await restartOnboarding(restaurant?.id);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setRestaurant(result.restaurant);
    setStep(1);
    setQrResult(null);
    setPhase("wizard");
    showToast("Setup Wizard restarted");
  }, [restaurant?.id, showToast]);

  const handleBack = useCallback(() => {
    setStep((current) => Math.max(1, current - 1));
  }, []);

  if (phase === "loading") {
    return (
      <AuthCard className="max-w-2xl">
        <div className="space-y-4 py-6">
          <div className="h-1.5 w-full animate-pulse rounded-full bg-white/10" />
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-white/5" />
          <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-11 animate-pulse rounded-xl bg-white/5" />
        </div>
      </AuthCard>
    );
  }

  if (phase === "already_complete") {
    return (
      <AuthCard className="max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/80">
          Setup Wizard
        </p>
        <h1 className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">
          Restaurant setup is complete
        </h1>
        <p className="mt-3 text-sm text-white/55">
          {restaurant?.restaurant_name
            ? `${restaurant.restaurant_name} is live. Restart the wizard anytime to review setup steps.`
            : "Your restaurant is live. Restart the wizard anytime to review setup steps."}
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <AuthButton type="button" variant="secondary" onClick={() => void handleRestart()}>
            Restart Setup Wizard
          </AuthButton>
          <AuthButton type="button" onClick={goDashboard}>
            Go to Dashboard
          </AuthButton>
        </div>
      </AuthCard>
    );
  }

  if (phase === "success") {
    return (
      <OnboardingSuccess
        restaurant={restaurant}
        qrResult={qrResult}
        onGoToDashboard={goDashboard}
      />
    );
  }

  const progress = getOnboardingProgress(
    restaurant
      ? { ...restaurant, onboarding_step: step }
      : null,
  );

  return (
    <AuthCard className="max-w-2xl">
      <WizardProgress
        currentStep={step}
        totalSteps={TOTAL_ONBOARDING_STEPS}
        labels={ONBOARDING_STEP_LABELS}
        percent={progress.percent}
        completedSteps={progress.completedSteps}
        onSaveAndExit={goDashboard}
      />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          {step === 1 && (
            <StepRestaurantInfo
              restaurant={restaurant}
              onContinue={handleRestaurantInfo}
            />
          )}
          {step === 2 && (
            <StepMenuStructure
              onBack={handleBack}
              onContinue={handleMenuContinue}
            />
          )}
          {step === 3 && (
            <StepPreferences
              restaurant={restaurant}
              onBack={handleBack}
              onContinue={handlePreferences}
              onSkip={handlePreferencesSkip}
            />
          )}
          {step === 4 && (
            <StepFirstQr
              restaurant={restaurant}
              onBack={handleBack}
              onFinish={handleQrContinue}
            />
          )}
          {step === 5 && (
            <StepFinish
              restaurant={restaurant}
              onBack={handleBack}
              onFinish={handleFinish}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </AuthCard>
  );
}
