import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { supabase } from "@/lib/supabase";

const ERROR = "We couldn't save your progress. Please try again.";

/** Bumps `onboarding_step` without touching any other fields (used by Continue on steps 3–4). */
export async function updateOnboardingStep(
  step: number,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const restaurant = await fetchUserRestaurant();

    if (!restaurant?.id) {
      return { ok: false, message: ERROR };
    }

    const { error } = await supabase
      .from("restaurants")
      .update({ onboarding_step: step })
      .eq("id", restaurant.id);

    if (error) {
      return { ok: false, message: ERROR };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}
