import { supabase } from "@/lib/supabase";

const RESTAURANT_SETUP_ERROR =
  "Your account was created, but we couldn't finish setting up your restaurant profile. Please try signing in or contact support.";

export async function createRestaurantForOwner(
  ownerId: string,
  email: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase.rpc("create_restaurant_for_owner", {
      p_owner_id: ownerId,
      p_email: email.trim(),
    });

    if (error) {
      console.error("[createRestaurantForOwner] RPC failed", {
        ownerId,
        email: email.trim(),
        error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });
      return { ok: false, message: RESTAURANT_SETUP_ERROR };
    }

    return { ok: true };
  } catch (err) {
    console.error("[createRestaurantForOwner] unexpected error", {
      ownerId,
      email: email.trim(),
      err,
    });
    return { ok: false, message: RESTAURANT_SETUP_ERROR };
  }
}
