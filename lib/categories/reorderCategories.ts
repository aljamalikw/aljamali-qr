import { supabase } from "@/lib/supabase";

const REORDER_ERROR = "Unable to reorder categories. Please try again.";

/** Persists a new display order for categories, given ids in their desired order. */
export async function reorderCategories(
  orderedIds: string[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const results = await Promise.all(
      orderedIds.map((id, index) =>
        supabase
          .from("categories")
          .update({ display_order: index + 1 })
          .eq("id", id),
      ),
    );

    if (results.some((result) => result.error)) {
      return { ok: false, message: REORDER_ERROR };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: REORDER_ERROR };
  }
}
