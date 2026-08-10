import { logActivity } from "@/lib/admin/activity-log";
import type { DashboardMenuItem, MenuFormData } from "@/lib/dashboard/menu/types";
import { updateWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { mapMenuFormToRow, mapMenuItemRowToDashboard } from "./mappers";
import type { MenuItemRow } from "./types";

const UPDATE_ERROR = "Unable to update menu item. Please try again.";

export async function updateMenuItem(
  id: string,
  input: MenuFormData,
): Promise<
  { ok: true; data: DashboardMenuItem } | { ok: false; message: string }
> {
  try {
    const payload = mapMenuFormToRow(input);

    const result = await updateWithColumnFallback<MenuItemRow>("menu_items", { id }, payload);

    if (!result.ok) {
      return { ok: false, message: result.message === "NO_COLUMNS_AVAILABLE" ? UPDATE_ERROR : result.message };
    }

    void logActivity({
      action: "menu_item_updated",
      restaurantId: result.data.restaurant_id,
      entityType: "menu_item",
      entityId: id,
      newValues: {
        name_en: input.nameEn,
        name_ar: input.nameAr,
        category_id: input.categoryId,
        price: input.price,
      },
    });

    return { ok: true, data: mapMenuItemRowToDashboard(result.data) };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}
