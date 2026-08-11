"use client";

import { motion } from "framer-motion";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  labels: readonly string[];
  percent?: number;
  completedSteps?: number[];
  onSaveAndExit?: () => void;
}

export function WizardProgress({
  currentStep,
  totalSteps,
  labels,
  percent,
  completedSteps = [],
  onSaveAndExit,
}: WizardProgressProps) {
  const progress =
    typeof percent === "number"
      ? percent
      : (currentStep / totalSteps) * 100;
  const activeLabel = labels[currentStep - 1] ?? "";
  const completedSet = new Set(completedSteps);

  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-gold">
          Step {currentStep} of {totalSteps}
          <span className="ms-2 text-white/40">· {Math.round(progress)}%</span>
        </p>
        <div className="flex items-center gap-3">
          <p className="text-xs uppercase tracking-wider text-white/40">
            {activeLabel}
          </p>
          {onSaveAndExit ? (
            <button
              type="button"
              onClick={onSaveAndExit}
              className="text-xs text-white/45 underline-offset-2 transition hover:text-gold hover:underline"
            >
              Save & Exit
            </button>
          ) : null}
        </div>
      </div>

      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold/60 via-gold to-gold/80"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      <div className="mt-3 hidden gap-1 xl:flex">
        {labels.map((stepLabel, index) => {
          const stepNumber = index + 1;
          const isComplete =
            completedSet.has(stepNumber) || stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div
              key={stepLabel}
              className="flex min-w-0 flex-1 flex-col items-center gap-1.5"
              title={stepLabel}
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
                className={`truncate text-center text-[9px] leading-tight ${
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
