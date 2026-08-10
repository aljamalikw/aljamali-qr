import { logActivity } from "@/lib/admin/activity-log";
import { supabase } from "@/lib/supabase";

const DELETE_ERROR = "Unable to delete QR code. Please try again.";

export async function deleteQrCode(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { data: existing } = await supabase
      .from("qr_codes")
      .select("id, restaurant_id")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("qr_codes").delete().eq("id", id);

    if (error) {
      return { ok: false, message: DELETE_ERROR };
    }

    void logActivity({
      action: "qr_deleted",
      restaurantId: (existing as { restaurant_id?: string } | null)?.restaurant_id,
      entityType: "qr_code",
      entityId: id,
      oldValues: { id },
    });

    return { ok: true };
  } catch {
    return { ok: false, message: DELETE_ERROR };
  }
}
