import type { DashboardMenuItem } from "@/lib/dashboard/menu/types";
import { updateWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { mapMenuItemRowToDashboard } from "./mappers";
import type { MenuItemRow } from "./types";

const ARCHIVE_ERROR = "Unable to update menu item. Please try again.";

export async function setMenuItemArchived(
  id: string,
  archived: boolean,
): Promise<{ ok: true; data: DashboardMenuItem } | { ok: false; message: string }> {
  try {
    const result = await updateWithColumnFallback<MenuItemRow>(
      "menu_items",
      { id },
      { is_archived: archived },
    );

    if (!result.ok) {
      return { ok: false, message: result.message === "NO_COLUMNS_AVAILABLE" ? ARCHIVE_ERROR : result.message };
    }

    return { ok: true, data: mapMenuItemRowToDashboard(result.data) };
  } catch {
    return { ok: false, message: ARCHIVE_ERROR };
  }
}
