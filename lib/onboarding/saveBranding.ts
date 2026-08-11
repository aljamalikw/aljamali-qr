import { logActivity } from "@/lib/admin/activity-log";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";
import {
  mergeCompletedSteps,
  parseCompletedSteps,
} from "@/lib/onboarding/progress";
import type { BrandingFormData } from "./types";

const SAVE_ERROR = "We couldn't save your branding. Please try again.";

/** Persists Setup Wizard step 2 (logo / branding) and advances to step 3. */
export async function saveBranding(
  input: BrandingFormData,
  options?: { skipped?: boolean },
): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  try {
    const restaurant = await fetchUserRestaurant();

    if (!restaurant?.id) {
      return { ok: false, message: SAVE_ERROR };
    }

    const completedSteps = mergeCompletedSteps(
      parseCompletedSteps(restaurant.onboarding_completed_steps),
      2,
    );
    const now = new Date().toISOString();

    const payload = {
      logo_url: input.logoUrl.trim() || null,
      cover_url: input.coverUrl.trim() || null,
      favicon_url: input.faviconUrl.trim() || null,
      theme_primary_color: input.themePrimaryColor.trim() || "#d4af37",
      menu_accent_color: input.menuAccentColor.trim() || "#d4af37",
      font_style: input.fontStyle,
      dark_mode_default: input.darkModeDefault,
      onboarding_step: Math.max(restaurant.onboarding_step ?? 1, 3),
      onboarding_completed_steps: completedSteps,
      onboarding_last_updated: now,
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

    void logActivity({
      action: options?.skipped
        ? "onboarding_step_skipped"
        : "onboarding_step_completed",
      restaurantId: restaurant.id,
      restaurantName: restaurant.restaurant_name,
      ownerId: restaurant.owner_id,
      entityType: "restaurant",
      entityId: restaurant.id,
      newValues: { step: 2, nextStep: 3 },
    });

    return { ok: true, restaurant: data as Restaurant };
  } catch {
    return { ok: false, message: SAVE_ERROR };
  }
}
