import { logActivity } from "@/lib/admin/activity-log";
import { supabase } from "@/lib/supabase";

const DELETE_ERROR = "Unable to delete menu item. Please try again.";

export async function deleteMenuItem(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { data: existing } = await supabase
      .from("menu_items")
      .select("id, restaurant_id, name")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      return { ok: false, message: DELETE_ERROR };
    }

    void logActivity({
      action: "menu_item_deleted",
      restaurantId: (existing as { restaurant_id?: string } | null)?.restaurant_id,
      entityType: "menu_item",
      entityId: id,
      oldValues: existing ?? { id },
    });

    return { ok: true };
  } catch {
    return { ok: false, message: DELETE_ERROR };
  }
}
