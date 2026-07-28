import { isEmailVerified } from "@/lib/auth/errors";
import { fetchIsPlatformAdmin } from "@/lib/auth/get-user-role";
import { supabase } from "@/lib/supabase";
import { generateUniqueSlug } from "./slug";
import type { Restaurant } from "./types";

export function isRestaurantSetupComplete(
  restaurant: Pick<Restaurant, "onboarding_completed" | "restaurant_name"> | null,
): boolean {
  if (!restaurant) return false;
  // Prefer explicit wizard flag once the column exists.
  if (typeof restaurant.onboarding_completed === "boolean") {
    return restaurant.onboarding_completed;
  }
  // Fallback before the onboarding migration is applied.
  return Boolean(restaurant.restaurant_name?.trim());
}

export async function fetchUserRestaurant(): Promise<Restaurant | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return null;

  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("owner_id", session.user.id)
    .maybeSingle();

  if (error || !data) return null;
  return data as Restaurant;
}

export async function resolveAuthenticatedRedirect(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user) return "/login";
  if (!isEmailVerified(session.user)) return "/verify-email";

  if (await fetchIsPlatformAdmin(session.user)) {
    return "/admin/dashboard";
  }

  const restaurant = await fetchUserRestaurant();
  if (!isRestaurantSetupComplete(restaurant)) return "/restaurant/setup";

  return "/dashboard";
}

export type RestaurantSetupInput = {
  restaurantName: string;
  phone?: string;
  currency: string;
  timezone: string;
};

const SETUP_SAVE_ERROR =
  "We couldn't save your restaurant details. Please try again.";

/**
 * @deprecated Superseded by the multi-step onboarding wizard (see `lib/onboarding/`).
 * Kept for backward compatibility with any external callers.
 */
export async function saveRestaurantSetup(
  input: RestaurantSetupInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { ok: false, message: "You must be signed in to continue." };
    }

    const slug = await generateUniqueSlug(input.restaurantName);
    const { data: existing } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", session.user.id)
      .maybeSingle();

    const payload = {
      restaurant_name: input.restaurantName.trim(),
      phone: input.phone?.trim() || null,
      currency: input.currency,
      timezone: input.timezone,
      slug,
    };

    const { error } = existing
      ? await supabase
          .from("restaurants")
          .update(payload)
          .eq("owner_id", session.user.id)
      : await supabase.from("restaurants").insert({
          ...payload,
          owner_id: session.user.id,
          email: session.user.email ?? null,
        });

    if (error) {
      return { ok: false, message: SETUP_SAVE_ERROR };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: SETUP_SAVE_ERROR };
  }
}
