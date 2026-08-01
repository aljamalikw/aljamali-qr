import { DEFAULT_CURRENCY } from "@/lib/restaurants/constants";
import { generateUniqueSlug } from "@/lib/restaurants/slug";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";
import type { RestaurantInfoFormData } from "./types";

const SAVE_ERROR =
  "We couldn't save your restaurant details. Please try again.";

/**
 * Persists step 1 of the onboarding wizard (core restaurant info) and advances
 * `onboarding_step` to 2. Restaurant rows are normally created automatically at
 * sign-up, so this typically updates the existing row — but it will create one
 * as a fallback if it's somehow missing.
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

    const payload = {
      restaurant_name: input.restaurantName.trim(),
      restaurant_type: input.restaurantType.trim() || null,
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
      onboarding_step: Math.max(existing?.onboarding_step ?? 1, 3),
    };

    const { data, error } = existing
      ? await supabase
          .from("restaurants")
          .update(payload)
          .eq("owner_id", session.user.id)
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

    return { ok: true, restaurant: data as Restaurant };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }
}
