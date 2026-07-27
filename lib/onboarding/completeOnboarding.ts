import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";

const ERROR = "We couldn't finish onboarding. Please try again.";

/** Marks the wizard as complete so AuthGuard / RestaurantSetupGuard route to the dashboard. */
export async function completeOnboarding(): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  try {
    const restaurant = await fetchUserRestaurant();

    if (!restaurant?.id) {
      return { ok: false, message: ERROR };
    }

    const { data, error } = await supabase
      .from("restaurants")
      .update({ onboarding_completed: true, onboarding_step: 5 })
      .eq("id", restaurant.id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: ERROR };
    }

    return { ok: true, restaurant: data as Restaurant };
  } catch {
    return { ok: false, message: ERROR };
  }
}
