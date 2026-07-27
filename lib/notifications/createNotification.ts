import { supabase } from "@/lib/supabase";
import type { NotificationType } from "./types";

const ERROR = "Unable to create notification.";

export type CreateNotificationParams = {
  userId: string;
  type: NotificationType | string;
  title: string;
  body: string;
  href?: string | null;
  restaurantId?: string | null;
  meta?: Record<string, unknown>;
};

/**
 * Inserts a notification row. RLS only allows this when the caller is a
 * platform admin (any target user) or is inserting a row for themselves.
 */
export async function createNotification(
  params: CreateNotificationParams,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase.from("notifications").insert({
      user_id: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      href: params.href ?? null,
      restaurant_id: params.restaurantId ?? null,
      meta: params.meta ?? {},
    });

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function createNotificationsForUsers(
  userIds: string[],
  base: Omit<CreateNotificationParams, "userId">,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (userIds.length === 0) return { ok: true };
  try {
    const rows = userIds.map((userId) => ({
      user_id: userId,
      type: base.type,
      title: base.title,
      body: base.body,
      href: base.href ?? null,
      restaurant_id: base.restaurantId ?? null,
      meta: base.meta ?? {},
    }));

    const { error } = await supabase.from("notifications").insert(rows);
    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

/** Notifies the owner of a single restaurant. Fails silently (best-effort). */
export async function notifyRestaurantOwner(
  restaurantId: string,
  base: Omit<CreateNotificationParams, "userId" | "restaurantId">,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("owner_id")
      .eq("id", restaurantId)
      .maybeSingle();

    if (error || !data?.owner_id) {
      return { ok: false, message: error?.message ?? "Owner not found." };
    }

    return createNotification({
      userId: data.owner_id,
      restaurantId,
      ...base,
    });
  } catch {
    return { ok: false, message: ERROR };
  }
}

/** Best-effort broadcast to every restaurant owner when an announcement is published. */
export async function notifyOwnersOfAnnouncement(params: {
  title: string;
  announcementId: string;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select("owner_id");

    if (error) return { ok: false, message: error.message || ERROR };

    const ownerIds = [
      ...new Set((data ?? []).map((row) => row.owner_id as string)),
    ];

    return createNotificationsForUsers(ownerIds, {
      type: "new_announcement",
      title: "New announcement",
      body: params.title,
      href: "/dashboard",
      meta: { announcementId: params.announcementId },
    });
  } catch {
    return { ok: false, message: ERROR };
  }
}
