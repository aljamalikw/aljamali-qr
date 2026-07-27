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

  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-gold">
          Step {currentStep} of {totalSteps}
        </p>
        <p className="text-xs uppercase tracking-wider text-white/40">
          {activeLabel}
        </p>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold/60 via-gold to-gold/80"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="mt-3 hidden gap-1 sm:flex">
        {labels.map((stepLabel, index) => {
          const stepNumber = index + 1;
          const isComplete = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div
              key={stepLabel}
              className="flex flex-1 flex-col items-center gap-1.5"
            >
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition-colors duration-300 ${
                  isComplete
                    ? "bg-gold text-black"
                    : isActive
                      ? "border border-gold bg-gold/15 text-gold"
                      : "border border-white/15 text-white/30"
                }`}
              >
                {isComplete ? "✓" : stepNumber}
              </span>
              <span
                className={`text-center text-[10px] leading-tight ${
                  isActive ? "text-white/70" : "text-white/25"
                }`}
              >
                {stepLabel}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
