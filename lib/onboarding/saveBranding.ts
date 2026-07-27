import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";
import type { BrandingFormData } from "./types";

const SAVE_ERROR = "We couldn't save your branding. Please try again.";

/** Persists step 2 of the onboarding wizard (branding) and advances to step 3. */
export async function saveBranding(
  input: BrandingFormData,
): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  try {
    const restaurant = await fetchUserRestaurant();

    if (!restaurant?.id) {
      return { ok: false, message: SAVE_ERROR };
    }

    const payload = {
      logo_url: input.logoUrl.trim() || null,
      cover_url: input.coverUrl.trim() || null,
      favicon_url: input.faviconUrl.trim() || null,
      theme_primary_color: input.themePrimaryColor.trim() || "#d4af37",
      menu_accent_color: input.menuAccentColor.trim() || "#d4af37",
      font_style: input.fontStyle,
      dark_mode_default: input.darkModeDefault,
      onboarding_step: Math.max(restaurant.onboarding_step ?? 1, 3),
    };

    const { data, error } = await supabase
      .from("restaurants")
      .update(payload)
      .eq("id", restaurant.id)
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
