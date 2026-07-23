import type { DashboardMenuItem, MenuFormData } from "@/lib/dashboard/menu/types";
import { supabase } from "@/lib/supabase";
import { mapMenuFormToRow, mapMenuItemRowToDashboard } from "./mappers";

const UPDATE_ERROR = "Unable to update menu item. Please try again.";

export async function updateMenuItem(
  id: string,
  input: MenuFormData,
): Promise<
  { ok: true; data: DashboardMenuItem } | { ok: false; message: string }
> {
  try {
    const payload = mapMenuFormToRow(input);

    const { data, error } = await supabase
      .from("menu_items")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: UPDATE_ERROR };
    }

    return { ok: true, data: mapMenuItemRowToDashboard(data) };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}
