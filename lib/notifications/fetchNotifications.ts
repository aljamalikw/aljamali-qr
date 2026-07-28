import { supabase } from "@/lib/supabase";
import { mapNotificationRow, type NotificationItem, type NotificationRow } from "./types";

const ERROR = "Unable to load notifications. Please try again.";

export async function fetchNotifications(
  limit = 20,
): Promise<{ ok: true; data: NotificationItem[] } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) return { ok: false, message: error.message || ERROR };
    return {
      ok: true,
      data: ((data ?? []) as NotificationRow[]).map(mapNotificationRow),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchUnreadNotificationCount(): Promise<
  { ok: true; count: number } | { ok: false; message: string }
> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false);

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true, count: count ?? 0 };
  } catch {
    return { ok: false, message: ERROR };
  }
}
