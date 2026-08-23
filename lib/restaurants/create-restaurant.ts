import { logActivity } from "@/lib/admin/activity-log";
import { supabase } from "@/lib/supabase";
import { queueEmailNotification } from "@/lib/email/framework";
import { DEFAULT_TRIAL_PLAN } from "@/lib/subscriptions/plans";

const RESTAURANT_SETUP_ERROR =
  "Your account was created, but we couldn't finish setting up your restaurant profile. Please try signing in or contact support.";

export async function createRestaurantForOwner(
  ownerId: string,
  email: string,
  profile?: {
    restaurantName?: string;
    ownerName?: string;
    phone?: string;
    country?: string;
  },
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase.rpc("create_restaurant_for_owner", {
      p_owner_id: ownerId,
      p_email: email.trim(),
    });

    if (error) {
      return { ok: false, message: RESTAURANT_SETUP_ERROR };
    }

    const { data: created } = await supabase
      .from("restaurants")
      .select("id, restaurant_name")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const restaurantName = profile?.restaurantName?.trim() || null;
    const ownerName = profile?.ownerName?.trim() || null;
    const phone = profile?.phone?.trim() || null;
    const country = profile?.country?.trim() || null;
    const createdId = (created as { id?: string } | null)?.id;

    if (createdId) {
      const profilePatch: Record<string, unknown> = {
        subscription_plan: DEFAULT_TRIAL_PLAN,
      };
      if (restaurantName) profilePatch.restaurant_name = restaurantName;
      if (ownerName) profilePatch.owner_name = ownerName;
      if (phone) profilePatch.phone = phone;
      if (country) profilePatch.country = country;

      await supabase.from("restaurants").update(profilePatch).eq("id", createdId);

      try {
        await fetch("/api/restaurants/finalize-trial", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ restaurantId: createdId, ownerId }),
        });
      } catch {
        // Signup must still succeed if the trial mirror cannot be rewritten.
      }
    }

    void logActivity({
      action: "restaurant_created",
      ownerId,
      actorId: ownerId,
      actorEmail: email.trim(),
      actorRole: "restaurant_owner",
      restaurantId: (created as { id?: string } | null)?.id ?? null,
      restaurantName:
        restaurantName ??
        (created as { restaurant_name?: string | null } | null)
          ?.restaurant_name ??
        null,
      entityType: "restaurant",
      entityId: (created as { id?: string } | null)?.id ?? null,
      newValues: { email: email.trim() },
    });

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
