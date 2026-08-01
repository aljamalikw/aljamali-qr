import { supabase } from "@/lib/supabase";
import { queueEmailNotification } from "@/lib/email/framework";

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
      return { ok: false, message: RESTAURANT_SETUP_ERROR };
    }

    // Framework-only: queue welcome / trial emails (no provider connected yet).
    void queueEmailNotification({
      templateId: "registration_successful",
      toEmail: email.trim(),
      meta: { ownerId },
    });
    void queueEmailNotification({
      templateId: "trial_started",
      toEmail: email.trim(),
      meta: { ownerId },
    });

    return { ok: true };
  } catch {
    return { ok: false, message: RESTAURANT_SETUP_ERROR };
  }
}
