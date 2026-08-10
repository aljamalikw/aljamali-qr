import { logActivity } from "@/lib/admin/activity-log";
import type { CategoryFormData, DashboardCategory } from "@/lib/dashboard/categories/types";
import { supabase } from "@/lib/supabase";
import { mapCategoryInputToRow, mapCategoryRowToDashboard } from "./mappers";

const UPDATE_ERROR = "Unable to update category. Please try again.";

export async function updateCategory(
  id: string,
  input: CategoryFormData,
): Promise<
  { ok: true; data: DashboardCategory } | { ok: false; message: string }
> {
  try {
    const payload = mapCategoryInputToRow(input);

    const { data, error } = await supabase
      .from("categories")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: UPDATE_ERROR };
    }

    void logActivity({
      action: "category_updated",
      restaurantId: (data as { restaurant_id?: string }).restaurant_id,
      entityType: "category",
      entityId: id,
      newValues: {
        name_en: input.nameEn,
        name_ar: input.nameAr,
      },
    });

    return { ok: true, data: mapCategoryRowToDashboard(data) };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}
