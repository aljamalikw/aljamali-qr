import { logActivity } from "@/lib/admin/activity-log";
import { supabase } from "@/lib/supabase";
import { queueEmailNotification } from "@/lib/email/framework";

const REGISTRATION_FAILED =
  "Registration could not be completed. Please try again with the same email.";

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
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const response = await fetch("/api/auth/complete-registration", {
      method: "POST",
      headers,
      body: JSON.stringify({
        ownerId,
        email: email.trim(),
        restaurantName: profile?.restaurantName?.trim() || "",
        ownerName: profile?.ownerName?.trim() || "",
        phone: profile?.phone?.trim() || "",
        country: profile?.country?.trim() || "",
      }),
    });
    const body = (await response.json().catch(() => ({}))) as {
      ok?: boolean;
      error?: string;
      restaurantId?: string;
    };

    if (!response.ok || !body.ok) {
      if (response.status >= 500) {
        await fetch("/api/auth/abort-registration", {
          method: "POST",
          headers,
          body: JSON.stringify({ ownerId, email: email.trim() }),
        }).catch(() => undefined);
      }
      return { ok: false, message: body.error || REGISTRATION_FAILED };
    }

    void logActivity({
      action: "restaurant_created",
      ownerId,
      actorId: ownerId,
      actorEmail: email.trim(),
      actorRole: "restaurant_owner",
      restaurantId: body.restaurantId ?? null,
      restaurantName: profile?.restaurantName?.trim() || null,
      entityType: "restaurant",
      entityId: body.restaurantId ?? null,
      newValues: { email: email.trim() },
    });

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
    await fetch("/api/auth/abort-registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ownerId, email: email.trim() }),
    }).catch(() => undefined);
    return { ok: false, message: REGISTRATION_FAILED };
  }
}
