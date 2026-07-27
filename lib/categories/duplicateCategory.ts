import type { DashboardCategory } from "@/lib/dashboard/categories/types";
import { supabase } from "@/lib/supabase";
import type { CategoryRow } from "./types";
import { mapCategoryRowToDashboard } from "./mappers";

const DUPLICATE_ERROR = "Unable to duplicate category. Please try again.";

export async function duplicateCategory(
  id: string,
): Promise<{ ok: true; data: DashboardCategory } | { ok: false; message: string }> {
  try {
    const { data: source, error: fetchError } = await supabase
      .from("categories")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !source) {
      return { ok: false, message: DUPLICATE_ERROR };
    }

    const sourceRow = source as CategoryRow;

    const { data: lastCategory } = await supabase
      .from("categories")
      .select("display_order")
      .eq("restaurant_id", sourceRow.restaurant_id)
      .order("display_order", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data, error } = await supabase
      .from("categories")
      .insert({
        restaurant_id: sourceRow.restaurant_id,
        name: `${sourceRow.name} (Copy)`,
        description: sourceRow.description,
        is_active: sourceRow.is_active,
        display_order: (lastCategory?.display_order ?? 0) + 1,
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: DUPLICATE_ERROR };
    }

    return { ok: true, data: mapCategoryRowToDashboard(data) };
  } catch {
    return { ok: false, message: DUPLICATE_ERROR };
  }
}
