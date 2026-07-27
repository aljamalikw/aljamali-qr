import type { DashboardMenuItem } from "@/lib/dashboard/menu/types";
import { supabase } from "@/lib/supabase";
import { getCurrentRestaurantId } from "@/lib/categories/get-restaurant-id";
import { mapMenuItemRowToDashboard } from "./mappers";

const FETCH_ERROR = "Unable to load menu items. Please try again.";

export async function fetchMenuItems(): Promise<
  { ok: true; data: DashboardMenuItem[] } | { ok: false; message: string }
> {
  try {
    const restaurantId = await getCurrentRestaurantId();

    if (!restaurantId) {
      return { ok: false, message: FETCH_ERROR };
    }

    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, message: FETCH_ERROR };
    }

    return {
      ok: true,
      data: (data ?? [])
        .filter((row) => !row.deleted_at)
        .map((row) => mapMenuItemRowToDashboard(row)),
    };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}
