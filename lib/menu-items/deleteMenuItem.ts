import { supabase } from "@/lib/supabase";

const DELETE_ERROR = "Unable to delete menu item. Please try again.";

export async function deleteMenuItem(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase.from("menu_items").delete().eq("id", id);

    if (error) {
      return { ok: false, message: DELETE_ERROR };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: DELETE_ERROR };
  }
}
