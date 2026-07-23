import type { DashboardMenuItem, MenuFormData } from "@/lib/dashboard/menu/types";
import { supabase } from "@/lib/supabase";
import { getCurrentRestaurantId } from "@/lib/categories/get-restaurant-id";
import { mapMenuFormToRow, mapMenuItemRowToDashboard } from "./mappers";

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

    const { data, error } = await supabase
      .from("menu_items")
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

    return { ok: true, data: mapMenuItemRowToDashboard(data) };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}
