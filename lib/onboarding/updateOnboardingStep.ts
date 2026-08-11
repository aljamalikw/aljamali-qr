import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { supabase } from "@/lib/supabase";
import { advanceOnboardingProgress } from "@/lib/onboarding/progress-actions";

const ERROR = "We couldn't save your progress. Please try again.";

/**
 * Bumps `onboarding_step` and records the previous step as completed.
 * Prefer `advanceOnboardingProgress` for new call sites.
 */
export async function updateOnboardingStep(
  step: number,
  completedStep?: number,
  skipped = false,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const result = await advanceOnboardingProgress({
    nextStep: step,
    completedStep,
    skipped,
  });
  if (!result.ok) return { ok: false, message: result.message || ERROR };
  return { ok: true };
}

/** @deprecated Use advanceOnboardingProgress — kept for older imports. */
export async function bumpOnboardingStepOnly(
  step: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const restaurant = await fetchUserRestaurant();
    if (!restaurant?.id) return { ok: false, message: ERROR };
    const { error } = await supabase
      .from("restaurants")
      .update({
        onboarding_step: step,
        onboarding_last_updated: new Date().toISOString(),
      })
      .eq("id", restaurant.id);
    if (error) return { ok: false, message: ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}
