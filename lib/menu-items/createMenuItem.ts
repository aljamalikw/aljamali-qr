import type { DashboardMenuItem, MenuFormData } from "@/lib/dashboard/menu/types";
import { supabase } from "@/lib/supabase";
import { insertWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { getCurrentRestaurantId } from "@/lib/categories/get-restaurant-id";
import { mapMenuFormToRow, mapMenuItemRowToDashboard } from "./mappers";
import type { MenuItemRow } from "./types";

const CREATE_ERROR = "Unable to create menu item. Please try again.";

export async function createMenuItem(
  input: MenuFormData,
): Promise<
  { ok: true; data: DashboardMenuItem } | { ok: false; message: string }
> {
  try {
    const restaurantId = await getCurrentRestaurantId();

    if (!restaurantId) {
      return { ok: false, message: CREATE_ERROR };
    }

    const { data: lastItem } = await supabase
      .from("menu_items")
      .select("display_order")
      .eq("restaurant_id", restaurantId)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const displayOrder = (lastItem?.display_order ?? 0) + 1;
    const payload = mapMenuFormToRow(input);

    const result = await insertWithColumnFallback<MenuItemRow>("menu_items", {
      restaurant_id: restaurantId,
      ...payload,
      display_order: displayOrder,
    });

    if (!result.ok) {
      return { ok: false, message: result.message === "NO_COLUMNS_AVAILABLE" ? CREATE_ERROR : result.message };
    }

    return { ok: true, data: mapMenuItemRowToDashboard(result.data) };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}
