"use client";

import { motion } from "framer-motion";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: readonly string[];
}

export function WizardProgress({
  currentStep,
  totalSteps,
  labels,
}: WizardProgressProps) {
  const progress = (currentStep / totalSteps) * 100;
  const activeLabel = labels[currentStep - 1] ?? "";
  const remaining = Math.max(totalSteps - currentStep + 1, 1);
  const estimatedMinutes = Math.max(1, Math.ceil(remaining * 0.4));

  return (
    <div className="mb-8 sm:mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Step {currentStep} of {totalSteps}
          </p>
          <p className="mt-1 font-serif text-lg font-semibold text-white sm:text-xl">
            {activeLabel}
          </p>
        </div>
        <p className="rounded-full border border-gold/20 bg-black/40 px-3 py-1.5 text-xs text-white/50 backdrop-blur-md">
          ~{estimatedMinutes} min left
        </p>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`Onboarding progress: step ${currentStep} of ${totalSteps}`}
      >
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-[#b8942e] via-gold to-[#e8c547] shadow-[0_0_16px_rgba(212,175,55,0.45)]"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <ol className="mt-5 hidden gap-2 sm:flex">
        {labels.map((stepLabel, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <li
              key={stepLabel}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all duration-300 ${
                  isComplete
                    ? "bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-black shadow-md shadow-gold/30"
                    : isActive
                      ? "border border-gold bg-gold/15 text-gold ring-2 ring-gold/20"
                      : "border border-white/15 text-white/30"
                }`}
              >
                {isComplete ? "✓" : stepNumber}
              </span>
              <span
                className={`text-center text-[10px] leading-tight ${
                  isActive ? "font-medium text-white/80" : "text-white/30"
                }`}
              >
                {stepLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
