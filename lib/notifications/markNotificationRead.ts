import { supabase } from "@/lib/supabase";

const ERROR = "Unable to update notification. Please try again.";

export async function markNotificationRead(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}
