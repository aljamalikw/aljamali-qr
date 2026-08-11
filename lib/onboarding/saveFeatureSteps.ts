import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";
import { advanceOnboardingProgress } from "@/lib/onboarding/progress-actions";

const ERROR = "We couldn't update restaurant features. Please try again.";

export async function saveOnboardingReservations(input: {
  enabled: boolean;
  skipped?: boolean;
}): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  return advanceOnboardingProgress({
    nextStep: 8,
    completedStep: 7,
    skipped: input.skipped,
    extra: {
      reservations_enabled: input.enabled,
    },
  });
}

export async function saveOnboardingOnlineOrdering(input: {
  enabled: boolean;
  kitchenDisplayEnabled?: boolean;
  skipped?: boolean;
}): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  return advanceOnboardingProgress({
    nextStep: 9,
    completedStep: 8,
    skipped: input.skipped,
    extra: {
      online_ordering_enabled: input.enabled,
      kitchen_display_enabled:
        input.kitchenDisplayEnabled ?? input.enabled,
    },
  });
}

export async function saveOnboardingFeatureSkip(
  fromStep: number,
  toStep: number,
): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  return advanceOnboardingProgress({
    nextStep: toStep,
    completedStep: fromStep,
    skipped: true,
  });
}

/** Lightweight restaurant feature flag update outside step advance. */
export async function updateRestaurantFeatureFlags(input: {
  reservationsEnabled?: boolean;
  onlineOrderingEnabled?: boolean;
  kitchenDisplayEnabled?: boolean;
}): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  try {
    const restaurant = await fetchUserRestaurant();
    if (!restaurant?.id) return { ok: false, message: ERROR };

    const payload: Record<string, unknown> = {
      onboarding_last_updated: new Date().toISOString(),
    };
    if (input.reservationsEnabled !== undefined) {
      payload.reservations_enabled = input.reservationsEnabled;
    }
    if (input.onlineOrderingEnabled !== undefined) {
      payload.online_ordering_enabled = input.onlineOrderingEnabled;
    }
    if (input.kitchenDisplayEnabled !== undefined) {
      payload.kitchen_display_enabled = input.kitchenDisplayEnabled;
    }

    const { data, error } = await supabase
      .from("restaurants")
      .update(payload)
      .eq("id", restaurant.id)
      .select("*")
      .single();

    if (error || !data) return { ok: false, message: ERROR };
    return { ok: true, restaurant: data as Restaurant };
  } catch {
    return { ok: false, message: ERROR };
  }
}
