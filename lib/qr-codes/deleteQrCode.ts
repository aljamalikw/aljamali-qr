import { logActivity } from "@/lib/admin/activity-log";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";

const DELETE_ERROR = "Unable to delete QR code. Please try again.";

export async function deleteQrCode(
  id: string,
  restaurant?: Restaurant | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const existingQuery = supabase
      .from("qr_codes")
      .select("id, restaurant_id")
      .eq("id", id);
    const { data: existing } = restaurant?.id
      ? await existingQuery.eq("restaurant_id", restaurant.id).maybeSingle()
      : await existingQuery.maybeSingle();

    const deleteQuery = supabase.from("qr_codes").delete().eq("id", id);
    const { error } = restaurant?.id
      ? await deleteQuery.eq("restaurant_id", restaurant.id)
      : await deleteQuery;

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
