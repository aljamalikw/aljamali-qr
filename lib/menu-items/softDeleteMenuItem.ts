import { NO_COLUMNS_AVAILABLE, updateWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { deleteMenuItem } from "./deleteMenuItem";
import type { MenuItemRow } from "./types";

const DELETE_ERROR = "Unable to delete menu item. Please try again.";

/**
 * Soft-deletes a menu item by setting `deleted_at`. Falls back to a permanent
 * delete when the `deleted_at` column hasn't been migrated yet.
 */
export async function softDeleteMenuItem(
  id: string,
): Promise<{ ok: true; hard: boolean } | { ok: false; message: string }> {
  try {
    const result = await updateWithColumnFallback<MenuItemRow>(
      "menu_items",
      { id },
      { deleted_at: new Date().toISOString() },
    );

    if (result.ok) {
      return { ok: true, hard: false };
    }

    if (result.message === NO_COLUMNS_AVAILABLE) {
      const hardResult = await deleteMenuItem(id);
      if (!hardResult.ok) return hardResult;
      return { ok: true, hard: true };
    }

    return { ok: false, message: result.message };
  } catch {
    return { ok: false, message: DELETE_ERROR };
  }
}

/** Restores a soft-deleted menu item by clearing `deleted_at`. */
export async function restoreMenuItem(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const result = await updateWithColumnFallback<MenuItemRow>(
    "menu_items",
    { id },
    { deleted_at: null },
  );

  if (!result.ok) {
    return { ok: false, message: result.message === NO_COLUMNS_AVAILABLE ? DELETE_ERROR : result.message };
  }

  return { ok: true };
}
