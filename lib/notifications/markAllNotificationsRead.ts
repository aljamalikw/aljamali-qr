import { supabase } from "@/lib/supabase";

const ERROR = "Unable to update notifications. Please try again.";

export async function markAllNotificationsRead(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("is_read", false);

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}
