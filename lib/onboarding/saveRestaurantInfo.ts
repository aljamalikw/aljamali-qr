import { logActivity } from "@/lib/admin/activity-log";
import { DEFAULT_CURRENCY } from "@/lib/restaurants/constants";
import { generateUniqueSlug } from "@/lib/restaurants/slug";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";
import {
  mergeCompletedSteps,
  parseCompletedSteps,
} from "@/lib/onboarding/progress";
import type { RestaurantInfoFormData } from "./types";

const SAVE_ERROR =
  "We couldn't save your restaurant details. Please try again.";

/**
 * Persists Setup Wizard step 1 (restaurant info) and advances to step 2.
 */
export async function saveRestaurantInfo(
  input: RestaurantInfoFormData,
): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return { ok: false, message: "You must be signed in to continue." };
    }

    const existing = await fetchUserRestaurant();
    const slug =
      existing?.slug?.trim() || (await generateUniqueSlug(input.restaurantName));

    const completedSteps = mergeCompletedSteps(
      parseCompletedSteps(existing?.onboarding_completed_steps),
      1,
    );
    const now = new Date().toISOString();

    const payload = {
      restaurant_name: input.restaurantName.trim(),
      restaurant_type: input.restaurantType.trim() || null,
      cuisine_type: input.cuisineType.trim() || null,
      owner_name: input.ownerName.trim() || null,
      phone: input.phone.trim() || null,
      whatsapp_number: input.whatsapp.trim() || null,
      email: input.email.trim() || session.user.email || null,
      website: input.website.trim() || null,
      address_en: input.addressEn.trim() || null,
      city: input.city.trim() || null,
      country: input.country.trim() || null,
      google_maps_url: input.googleMapsUrl.trim() || null,
      opening_hours: input.openingHours.trim() || null,
      timezone: input.timezone,
      preferred_language: input.preferredLanguage,
      slug,
      onboarding_step: Math.max(existing?.onboarding_step ?? 1, 2),
      onboarding_completed_steps: completedSteps,
      onboarding_last_updated: now,
    };

    const { data, error } = existing
      ? await supabase
          .from("restaurants")
          .update(payload)
          .eq("id", existing.id)
          .select("*")
          .single()
      : await supabase
          .from("restaurants")
          .insert({
            ...payload,
            owner_id: session.user.id,
            currency: DEFAULT_CURRENCY,
          })
          .select("*")
          .single();

    if (error || !data) {
      return { ok: false, message: SAVE_ERROR };
    }

    const restaurant = data as Restaurant;
    void logActivity({
      action: "onboarding_step_completed",
      restaurantId: restaurant.id,
      restaurantName: restaurant.restaurant_name,
      ownerId: restaurant.owner_id,
      entityType: "restaurant",
      entityId: restaurant.id,
      newValues: { step: 1, nextStep: 2 },
    });

    return { ok: true, restaurant };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }
}
