import type { Restaurant } from "@/lib/restaurants/types";
import {
  ONBOARDING_STEP_IDS,
  TOTAL_ONBOARDING_STEPS,
  type OnboardingStepId,
} from "@/lib/onboarding/constants";

export type OnboardingProgress = {
  completed: boolean;
  currentStep: number;
  completedSteps: number[];
  completedAt: string | null;
  lastUpdated: string | null;
  percent: number;
};

export function parseCompletedSteps(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<number>(ONBOARDING_STEP_IDS);
  const unique = new Set<number>();
  for (const entry of value) {
    const n = typeof entry === "number" ? entry : Number(entry);
    if (Number.isInteger(n) && allowed.has(n)) unique.add(n);
  }
  return Array.from(unique).sort((a, b) => a - b);
}

export function clampOnboardingStep(step: number | null | undefined): number {
  if (!Number.isFinite(step)) return 1;
  return Math.min(Math.max(Math.trunc(step as number), 1), TOTAL_ONBOARDING_STEPS);
}

export function getOnboardingProgress(
  restaurant: Pick<
    Restaurant,
    | "onboarding_completed"
    | "onboarding_step"
    | "onboarding_completed_steps"
    | "onboarding_completed_at"
    | "onboarding_last_updated"
  > | null,
): OnboardingProgress {
  if (!restaurant) {
    return {
      completed: false,
      currentStep: 1,
      completedSteps: [],
      completedAt: null,
      lastUpdated: null,
      percent: 0,
    };
  }

  const completed = Boolean(restaurant.onboarding_completed);
  const completedSteps = parseCompletedSteps(
    restaurant.onboarding_completed_steps,
  );
  const currentStep = completed
    ? TOTAL_ONBOARDING_STEPS
    : clampOnboardingStep(restaurant.onboarding_step);

  const percent = completed
    ? 100
    : Math.min(
        100,
        Math.round(
          (Math.max(completedSteps.length, currentStep - 1) /
            TOTAL_ONBOARDING_STEPS) *
            100,
        ),
      );

  return {
    completed,
    currentStep,
    completedSteps,
    completedAt: restaurant.onboarding_completed_at ?? null,
    lastUpdated: restaurant.onboarding_last_updated ?? null,
    percent,
  };
}

export function mergeCompletedSteps(
  existing: number[],
  step: OnboardingStepId | number,
): number[] {
  const next = new Set(parseCompletedSteps(existing));
  next.add(clampOnboardingStep(step));
  return Array.from(next).sort((a, b) => a - b);
}
