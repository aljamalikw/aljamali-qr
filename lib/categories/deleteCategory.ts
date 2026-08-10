import { logActivity } from "@/lib/admin/activity-log";
import { supabase } from "@/lib/supabase";

const DELETE_ERROR = "Unable to delete category. Please try again.";

export async function deleteCategory(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { data: existing } = await supabase
      .from("categories")
      .select("id, restaurant_id, name_en")
      .eq("id", id)
      .maybeSingle();

    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      return { ok: false, message: DELETE_ERROR };
    }

    void logActivity({
      action: "category_deleted",
      restaurantId: (existing as { restaurant_id?: string } | null)?.restaurant_id,
      entityType: "category",
      entityId: id,
      oldValues: existing ?? { id },
    });

    return { ok: true };
  } catch {
    return { ok: false, message: DELETE_ERROR };
  }
}
