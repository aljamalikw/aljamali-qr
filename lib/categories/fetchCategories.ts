import type { DashboardCategory } from "@/lib/dashboard/categories/types";
import { supabase } from "@/lib/supabase";
import { getCurrentRestaurantId } from "./get-restaurant-id";
import { mapCategoryRowToDashboard } from "./mappers";

const FETCH_ERROR = "Unable to load categories. Please try again.";

export async function fetchCategories(): Promise<
  { ok: true; data: DashboardCategory[] } | { ok: false; message: string }
> {
  try {
    const restaurantId = await getCurrentRestaurantId();

    if (!restaurantId) {
      return { ok: false, message: FETCH_ERROR };
    }

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (error) {
      return { ok: false, message: FETCH_ERROR };
    }

    const { data: itemRows, error: itemsError } = await supabase
      .from("menu_items")
      .select("category_id, deleted_at")
      .eq("restaurant_id", restaurantId);

    if (itemsError) {
      return { ok: false, message: FETCH_ERROR };
    }

    const counts = new Map<string, number>();
    for (const item of itemRows ?? []) {
      if (item.deleted_at || !item.category_id) continue;
      counts.set(item.category_id, (counts.get(item.category_id) ?? 0) + 1);
    }

    return {
      ok: true,
      data: (data ?? []).map((row) =>
        mapCategoryRowToDashboard(row, counts.get(row.id) ?? 0),
      ),
    };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}
