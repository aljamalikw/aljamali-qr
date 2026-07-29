"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
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
import {
  OnboardingPreview,
  previewFromRestaurant,
  type OnboardingPreviewData,
} from "./OnboardingPreview";
import { OnboardingSuccess } from "./OnboardingSuccess";
import { StepBranding } from "./StepBranding";
import { StepCategories } from "./StepCategories";
import { StepFirstQr } from "./StepFirstQr";
import { StepMenuItems } from "./StepMenuItems";
import { StepRestaurantInfo } from "./StepRestaurantInfo";
import { WelcomeStep } from "./WelcomeStep";
import { WizardProgress } from "./WizardProgress";

type WizardPhase = "loading" | "welcome" | "wizard" | "success";

const easeOut = [0.22, 1, 0.36, 1] as const;

export function OnboardingWizard() {
  const router = useRouter();
  const { showToast } = useToast();
  const [phase, setPhase] = useState<WizardPhase>("loading");
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [step, setStep] = useState(1);
  const [qrResult, setQrResult] = useState<OnboardingQrResult | null>(null);
  const [preview, setPreview] = useState<OnboardingPreviewData>(
    previewFromRestaurant(null),
  );

  useEffect(() => {
    let mounted = true;

    fetchUserRestaurant().then((data) => {
      if (!mounted) return;

      setRestaurant(data);
      setPreview(previewFromRestaurant(data));
      const initialStep = Math.min(
        Math.max(data?.onboarding_step ?? 1, 1),
        TOTAL_ONBOARDING_STEPS,
      );
      setStep(initialStep);
      // Returning users mid-flow skip welcome
      setPhase(initialStep > 1 ? "wizard" : "welcome");
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
      setPreview(previewFromRestaurant(result.restaurant));
      setStep(2);
      return null;
    },
    [],
  );

  const handleBranding = useCallback(async (values: BrandingFormData) => {
    const result = await saveBranding(values);
    if (!result.ok) return result.message;
    setRestaurant(result.restaurant);
    setPreview(previewFromRestaurant(result.restaurant));
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

  const handlePreviewChange = useCallback(
    (partial: Partial<OnboardingPreviewData>) => {
      setPreview((current) => ({ ...current, ...partial }));
    },
    [],
  );

  if (phase === "loading") {
    return (
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-gold/20 bg-black/50 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
        <div className="space-y-4 py-6">
          <div className="h-2 w-full animate-pulse rounded-full bg-white/10" />
          <div className="h-8 w-2/3 animate-pulse rounded-lg bg-white/5" />
          <div className="h-48 animate-pulse rounded-2xl bg-white/5" />
          <div className="h-12 animate-pulse rounded-xl bg-white/5" />
        </div>
      </div>
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

  if (phase === "welcome") {
    return (
      <div className="relative mx-auto w-full max-w-3xl overflow-hidden rounded-3xl border border-gold/20 bg-black/50 px-6 py-14 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-10 sm:py-16">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.1)_0%,transparent_55%)]"
          aria-hidden="true"
        />
        <WelcomeStep onBegin={() => setPhase("wizard")} />
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="mb-8 flex items-center justify-between gap-4">
        <Link href="/" className="group inline-flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 font-serif text-xs font-bold text-gold transition-colors group-hover:border-gold/45">
            AQ
          </span>
          <span className="font-serif text-lg font-bold text-white">
            Aljamali <span className="text-gold">QR</span>
          </span>
        </Link>
        <p className="hidden text-xs text-white/35 sm:block">
          Estimated time: ~2 minutes
        </p>
      </div>

      <div className="grid grid-cols-1 items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px] xl:gap-12">
        <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-black/55 p-5 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-8 lg:p-9">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(212,175,55,0.07)_0%,transparent_50%)]"
            aria-hidden="true"
          />

          <div className="relative z-10">
            <WizardProgress
              currentStep={step}
              totalSteps={TOTAL_ONBOARDING_STEPS}
              labels={ONBOARDING_STEP_LABELS}
            />

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 28, scale: 0.99 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.99 }}
                transition={{ duration: 0.35, ease: easeOut }}
              >
                {step === 1 && (
                  <StepRestaurantInfo
                    restaurant={restaurant}
                    onContinue={handleRestaurantInfo}
                    onPreviewChange={handlePreviewChange}
                  />
                )}
                {step === 2 && (
                  <StepBranding
                    restaurant={restaurant}
                    onBack={handleBack}
                    onContinue={handleBranding}
                    onPreviewChange={handlePreviewChange}
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
          </div>
        </div>

        <aside className="sticky top-8 hidden xl:block">
          <div className="rounded-3xl border border-gold/15 bg-black/40 p-6 backdrop-blur-xl">
            <p className="mb-5 text-center text-xs font-semibold uppercase tracking-[0.18em] text-gold/80">
              Live Preview
            </p>
            <OnboardingPreview data={preview} />
          </div>
        </aside>
      </div>

      {/* Mobile preview peek */}
      <div className="mt-8 xl:hidden">
        <details className="group rounded-3xl border border-gold/20 bg-black/40 backdrop-blur-xl">
          <summary className="cursor-pointer list-none px-5 py-4 text-sm font-medium text-white/70 marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center justify-between">
              <span>Show live preview</span>
              <span className="text-gold transition-transform group-open:rotate-180">
                ▾
              </span>
            </span>
          </summary>
          <div className="border-t border-white/[0.06] px-5 py-6">
            <OnboardingPreview data={preview} />
          </div>
        </details>
      </div>
    </div>
  );
}
