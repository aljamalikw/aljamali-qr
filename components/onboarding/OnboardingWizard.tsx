"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthButton } from "@/components/auth/AuthButton";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchOwnerSubscription } from "@/lib/admin/subscriptions";
import {
  ONBOARDING_STEP_LABELS,
  TOTAL_ONBOARDING_STEPS,
} from "@/lib/onboarding/constants";
import {
  completeOnboarding,
  logOnboardingStarted,
  restartOnboarding,
} from "@/lib/onboarding/progress-actions";
import { getOnboardingProgress } from "@/lib/onboarding/progress";
import { saveBranding } from "@/lib/onboarding/saveBranding";
import {
  saveOnboardingFeatureSkip,
  saveOnboardingOnlineOrdering,
  saveOnboardingReservations,
} from "@/lib/onboarding/saveFeatureSteps";
import { saveRestaurantInfo } from "@/lib/onboarding/saveRestaurantInfo";
import type {
  BrandingFormData,
  OnboardingQrResult,
  RestaurantInfoFormData,
} from "@/lib/onboarding/types";
import { updateOnboardingStep } from "@/lib/onboarding/updateOnboardingStep";
import {
  fetchUserRestaurant,
  isRestaurantSetupComplete,
} from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { OnboardingSuccess } from "./OnboardingSuccess";
import { StepBranding } from "./StepBranding";
import { StepCategories } from "./StepCategories";
import { StepFinish } from "./StepFinish";
import { StepFirstQr } from "./StepFirstQr";
import { StepLoyalty } from "./StepLoyalty";
import { StepMarketing } from "./StepMarketing";
import { StepMenuItems } from "./StepMenuItems";
import { StepMenuPreview } from "./StepMenuPreview";
import { StepOnlineOrdering } from "./StepOnlineOrdering";
import { StepReservations } from "./StepReservations";
import { StepRestaurantInfo } from "./StepRestaurantInfo";
import { WizardProgress } from "./WizardProgress";

type WizardPhase = "loading" | "wizard" | "success" | "already_complete";

export function OnboardingWizard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<WizardPhase>("loading");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [qrResult, setQrResult] = useState<OnboardingQrResult | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      const data = await fetchUserRestaurant();
      if (!mounted) return;

      setRestaurant(data);

      if (data?.id) {
        const sub = await fetchOwnerSubscription(data.id);
        if (mounted && sub.ok && sub.data?.plan) {
          setPlan(sub.data.plan);
        } else if (mounted) {
          setPlan(data.subscription_plan ?? "Starter");
        }
        void logOnboardingStarted(data);
      }

      if (isRestaurantSetupComplete(data)) {
        setPhase("already_complete");
        return;
      }

      const progress = getOnboardingProgress(data);
      setStep(progress.currentStep);
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

  const handleBranding = useCallback(
    async (values: BrandingFormData, skipped = false) => {
      const result = await saveBranding(values, { skipped });
      if (!result.ok) return result.message;
      setRestaurant(result.restaurant);
      setStep(3);
      return null;
    },
    [],
  );

  const handleCategoriesContinue = useCallback(async () => {
    const result = await updateOnboardingStep(4, 3);
    if (!result.ok) showToast(result.message, "error");
    setStep(4);
  }, [showToast]);

  const handleMenuItemsContinue = useCallback(async () => {
    const result = await updateOnboardingStep(5, 4);
    if (!result.ok) showToast(result.message, "error");
    setStep(5);
  }, [showToast]);

  const handleQrContinue = useCallback(
    async (qr: OnboardingQrResult | null) => {
      setQrResult(qr);
      const result = await updateOnboardingStep(6, 5);
      if (!result.ok) showToast(result.message, "error");
      setStep(6);
    },
    [showToast],
  );

  const handlePreviewContinue = useCallback(async () => {
    const result = await updateOnboardingStep(7, 6);
    if (!result.ok) showToast(result.message, "error");
    setStep(7);
  }, [showToast]);

  const handleReservations = useCallback(async (enabled: boolean) => {
    const result = await saveOnboardingReservations({ enabled });
    if (!result.ok) return result.message;
    setRestaurant(result.restaurant);
    setStep(8);
    return null;
  }, []);

  const handleOrdering = useCallback(async (enabled: boolean) => {
    const result = await saveOnboardingOnlineOrdering({ enabled });
    if (!result.ok) return result.message;
    setRestaurant(result.restaurant);
    setStep(9);
    return null;
  }, []);

  const skipTo = useCallback(
    async (fromStep: number, toStep: number) => {
      const result = await saveOnboardingFeatureSkip(fromStep, toStep);
      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      setRestaurant(result.restaurant);
      setStep(toStep);
    },
    [showToast],
  );

  const handleLoyaltyContinue = useCallback(async () => {
    const result = await updateOnboardingStep(10, 9);
    if (!result.ok) showToast(result.message, "error");
    setStep(10);
  }, [showToast]);

  const handleMarketingContinue = useCallback(async () => {
    const result = await updateOnboardingStep(11, 10);
    if (!result.ok) showToast(result.message, "error");
    setStep(11);
  }, [showToast]);

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
            <StepBranding
              restaurant={restaurant}
              onBack={handleBack}
              onContinue={(values) => handleBranding(values, false)}
              onSkip={() =>
                handleBranding(
                  {
                    logoUrl: restaurant?.logo_url ?? "",
                    coverUrl: restaurant?.cover_url ?? "",
                    faviconUrl: restaurant?.favicon_url ?? "",
                    themePrimaryColor:
                      restaurant?.theme_primary_color ?? "#d4af37",
                    menuAccentColor:
                      restaurant?.menu_accent_color ?? "#d4af37",
                    fontStyle: restaurant?.font_style ?? "serif",
                    darkModeDefault: restaurant?.dark_mode_default ?? true,
                  },
                  true,
                )
              }
            />
          )}
          {step === 3 && (
            <StepCategories
              onBack={handleBack}
              onContinue={handleCategoriesContinue}
            />
          )}
          {step === 4 && (
            <StepMenuItems
              onBack={handleBack}
              onContinue={handleMenuItemsContinue}
            />
          )}
          {step === 5 && (
            <StepFirstQr
              restaurant={restaurant}
              onBack={handleBack}
              onFinish={handleQrContinue}
            />
          )}
          {step === 6 && (
            <StepMenuPreview
              restaurant={restaurant}
              onBack={handleBack}
              onContinue={handlePreviewContinue}
            />
          )}
          {step === 7 && (
            <StepReservations
              restaurant={restaurant}
              onBack={handleBack}
              onContinue={handleReservations}
              onSkip={() => skipTo(7, 8)}
            />
          )}
          {step === 8 && (
            <StepOnlineOrdering
              restaurant={restaurant}
              plan={plan}
              onBack={handleBack}
              onContinue={handleOrdering}
              onSkip={() => skipTo(8, 9)}
            />
          )}
          {step === 9 && (
            <StepLoyalty
              plan={plan}
              onBack={handleBack}
              onContinue={handleLoyaltyContinue}
              onSkip={() => skipTo(9, 10)}
            />
          )}
          {step === 10 && (
            <StepMarketing
              restaurant={restaurant}
              plan={plan}
              onBack={handleBack}
              onContinue={handleMarketingContinue}
              onSkip={() => skipTo(10, 11)}
            />
          )}
          {step === 11 && (
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
