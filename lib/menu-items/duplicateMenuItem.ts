import type { DashboardMenuItem } from "@/lib/dashboard/menu/types";
import { supabase } from "@/lib/supabase";
import { insertWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { mapMenuItemRowToDashboard } from "./mappers";
import type { MenuItemRow } from "./types";

const DUPLICATE_ERROR = "Unable to duplicate menu item. Please try again.";

export async function duplicateMenuItem(
  id: string,
): Promise<{ ok: true; data: DashboardMenuItem } | { ok: false; message: string }> {
  try {
    const { data: source, error: fetchError } = await supabase
      .from("menu_items")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !source) {
      return { ok: false, message: DUPLICATE_ERROR };
    }

    const sourceRow = source as MenuItemRow;

    const { data: lastItem } = await supabase
      .from("menu_items")
      .select("display_order")
      .eq("restaurant_id", sourceRow.restaurant_id)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const result = await insertWithColumnFallback<MenuItemRow>("menu_items", {
      restaurant_id: sourceRow.restaurant_id,
      category_id: sourceRow.category_id,
      name: `${sourceRow.name} (Copy)`,
      description: sourceRow.description,
      price: sourceRow.price,
      discount_price: sourceRow.discount_price ?? null,
      image_url: sourceRow.image_url,
      is_available: false,
      display_order: (lastItem?.display_order ?? 0) + 1,
      is_archived: false,
    });

    if (!result.ok) {
      return { ok: false, message: result.message === "NO_COLUMNS_AVAILABLE" ? DUPLICATE_ERROR : result.message };
    }

    return { ok: true, data: mapMenuItemRowToDashboard(result.data) };
  } catch {
    return { ok: false, message: DUPLICATE_ERROR };
  }
}
