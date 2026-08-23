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

export function isLegacyOnboardingProgress(
  step: number | null | undefined,
  completedSteps: number[],
): boolean {
  return (step ?? 1) > TOTAL_ONBOARDING_STEPS || completedSteps.some((s) => s > TOTAL_ONBOARDING_STEPS);
}

/** Map a stored 11-step number onto the current 5-step wizard. */
export function remapLegacyOnboardingStep(step: number | null | undefined): number {
  const raw = Number.isFinite(step) ? Math.trunc(step as number) : 1;
  if (raw <= TOTAL_ONBOARDING_STEPS) {
    return clampOnboardingStep(raw);
  }
  if (raw <= 2) return 1;
  if (raw <= 4) return 2;
  if (raw <= 6) return 4;
  if (raw <= 10) return 3;
  return 5;
}

export function remapLegacyCompletedSteps(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const unique = new Set<number>();
  for (const entry of value) {
    const n = typeof entry === "number" ? entry : Number(entry);
    if (!Number.isInteger(n)) continue;
    if (n >= 1 && n <= TOTAL_ONBOARDING_STEPS) {
      unique.add(n);
      continue;
    }
    if (n <= 2) unique.add(1);
    else if (n <= 4) unique.add(2);
    else if (n <= 6) unique.add(4);
    else if (n <= 10) unique.add(3);
    else if (n === 11) unique.add(5);
  }
  return Array.from(unique).sort((a, b) => a - b);
}

export function parseCompletedSteps(value: unknown): number[] {
  return remapLegacyCompletedSteps(value).filter((n) =>
    (ONBOARDING_STEP_IDS as readonly number[]).includes(n),
  );
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
  const rawSteps = Array.isArray(restaurant.onboarding_completed_steps)
    ? restaurant.onboarding_completed_steps
    : [];
  const completedSteps = parseCompletedSteps(rawSteps);
  const currentStep = completed
    ? TOTAL_ONBOARDING_STEPS
    : isLegacyOnboardingProgress(restaurant.onboarding_step, rawSteps as number[])
      ? remapLegacyOnboardingStep(restaurant.onboarding_step)
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

export function resolveResumeStep(
  storedStep: number,
  completedSteps: number[],
): number {
  let step = clampOnboardingStep(storedStep);
  const done = new Set(completedSteps);
  while (done.has(step) && step < TOTAL_ONBOARDING_STEPS) {
    step += 1;
  }
  return step;
}
