import type { Restaurant } from "@/lib/restaurants/types";
import { clampOnboardingStep, mergeCompletedSteps } from "./progress";

export function detectCompletedSetupSteps(input: {
  restaurant: Restaurant | null;
  categoryCount: number;
  qrCount: number;
}): number[] {
  const detected: number[] = [];
  if (input.restaurant?.restaurant_name?.trim()) detected.push(1);
  if (input.categoryCount >= 1) detected.push(2);
  if (input.qrCount >= 1) detected.push(4);
  return detected;
}

export function mergeDetectedSteps(
  stored: number[],
  detected: number[],
): number[] {
  return detected.reduce((steps, step) => mergeCompletedSteps(steps, step), stored);
}

/**
 * Resume the first essential gap, then the stored step.
 * Name and at least one category are required; QR can be skipped.
 */
export function resolveSetupResumeStep(input: {
  storedStep: number;
  completedSteps: number[];
  hasName: boolean;
  categoryCount: number;
  qrCount: number;
}): number {
  if (!input.hasName) return 1;
  if (input.categoryCount < 1) return 2;

  const stored = clampOnboardingStep(input.storedStep);
  const completed = new Set(input.completedSteps);
  const qrDone = input.qrCount >= 1 || completed.has(4);

  if (stored <= 3) return Math.max(stored, 3);
  if (!qrDone) return 4;
  return 5;
}
