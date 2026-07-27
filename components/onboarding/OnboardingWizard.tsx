"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { AuthCard } from "@/components/auth/AuthCard";
import { useToast } from "@/components/ui/ToastProvider";
import {
  ONBOARDING_STEP_LABELS,
  TOTAL_ONBOARDING_STEPS,
} from "@/lib/onboarding/constants";
import { completeOnboarding } from "@/lib/onboarding/completeOnboarding";
import { saveBranding } from "@/lib/onboarding/saveBranding";
import { saveRestaurantInfo } from "@/lib/onboarding/saveRestaurantInfo";
import type {
  BrandingFormData,
  OnboardingQrResult,
  RestaurantInfoFormData,
} from "@/lib/onboarding/types";
import { updateOnboardingStep } from "@/lib/onboarding/updateOnboardingStep";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { OnboardingSuccess } from "./OnboardingSuccess";
import { StepBranding } from "./StepBranding";
import { StepCategories } from "./StepCategories";
import { StepFirstQr } from "./StepFirstQr";
import { StepMenuItems } from "./StepMenuItems";
import { StepRestaurantInfo } from "./StepRestaurantInfo";
import { WizardProgress } from "./WizardProgress";

type WizardPhase = "loading" | "wizard" | "success";

export function OnboardingWizard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<WizardPhase>("loading");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [step, setStep] = useState(1);
  const [qrResult, setQrResult] = useState<OnboardingQrResult | null>(null);

  useEffect(() => {
    let mounted = true;

    fetchUserRestaurant().then((data) => {
      if (!mounted) return;

      setRestaurant(data);
      const initialStep = Math.min(
        Math.max(data?.onboarding_step ?? 1, 1),
        TOTAL_ONBOARDING_STEPS,
      );
      setStep(initialStep);
      setPhase("wizard");
    });

    return () => {
      mounted = false;
    };
  }, []);

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

  const handleBranding = useCallback(async (values: BrandingFormData) => {
    const result = await saveBranding(values);
    if (!result.ok) return result.message;
    setRestaurant(result.restaurant);
    setStep(3);
    return null;
  }, []);

  const handleCategoriesContinue = useCallback(async () => {
    const result = await updateOnboardingStep(4);
    if (!result.ok) showToast(result.message, "error");
    setStep(4);
  }, [showToast]);

  const handleMenuItemsContinue = useCallback(async () => {
    const result = await updateOnboardingStep(5);
    if (!result.ok) showToast(result.message, "error");
    setStep(5);
  }, [showToast]);

  const handleFinish = useCallback(
    async (qr: OnboardingQrResult | null) => {
      const result = await completeOnboarding();
      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      setRestaurant(result.restaurant);
      setQrResult(qr);
      setPhase("success");
    },
    [showToast],
  );

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

  if (phase === "success") {
    return (
      <OnboardingSuccess
        restaurant={restaurant}
        qrResult={qrResult}
        onGoToDashboard={() => {
          router.push("/dashboard");
          router.refresh();
        }}
      />
    );
  }

  return (
    <AuthCard className="max-w-2xl">
      <WizardProgress
        currentStep={step}
        totalSteps={TOTAL_ONBOARDING_STEPS}
        labels={ONBOARDING_STEP_LABELS}
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
              onContinue={handleBranding}
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
              onFinish={handleFinish}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </AuthCard>
  );
}
