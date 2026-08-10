import { logActivity } from "@/lib/admin/activity-log";
import type { CategoryFormData, DashboardCategory } from "@/lib/dashboard/categories/types";
import { supabase } from "@/lib/supabase";
import { getCurrentRestaurantId } from "./get-restaurant-id";
import { mapCategoryInputToRow, mapCategoryRowToDashboard } from "./mappers";

const CREATE_ERROR = "Unable to create category. Please try again.";

export async function createCategory(
  input: CategoryFormData,
): Promise<
  { ok: true; data: DashboardCategory } | { ok: false; message: string }
> {
  try {
    const restaurantId = await getCurrentRestaurantId();

    if (!restaurantId) {
      return { ok: false, message: CREATE_ERROR };
    }

    const { data: lastCategory } = await supabase
      .from("categories")
      .select("display_order")
      .eq("restaurant_id", restaurantId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const displayOrder = (lastCategory?.display_order ?? 0) + 1;
    const payload = mapCategoryInputToRow(input);

    const { data, error } = await supabase
      .from("categories")
      .insert({
        restaurant_id: restaurantId,
        ...payload,
        display_order: displayOrder,
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: CREATE_ERROR };
    }

    void logActivity({
      action: "category_created",
      restaurantId,
      entityType: "category",
      entityId: (data as { id: string }).id,
      newValues: {
        name_en: input.nameEn,
        name_ar: input.nameAr,
      },
    });

    return { ok: true, data: mapCategoryRowToDashboard(data) };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}
