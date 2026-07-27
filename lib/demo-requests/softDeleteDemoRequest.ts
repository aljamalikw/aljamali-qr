import { supabase } from "@/lib/supabase";
import { mapDemoRequestRowToItem } from "./mappers";
import type { DemoRequestItem, DemoRequestRow } from "./types";

const DELETE_ERROR = "Unable to delete demo request. Please try again.";

/**
 * Soft-deletes a demo request by setting deleted_at.
 * Rows are never physically removed. Permanent delete is intentionally unsupported.
 */
export async function softDeleteDemoRequest(
  id: string,
): Promise<
  { ok: true; data: DemoRequestItem } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("demo_requests")
      .update({
        deleted_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? DELETE_ERROR };
    }

    return { ok: true, data: mapDemoRequestRowToItem(data as DemoRequestRow) };
  } catch {
    return { ok: false, message: DELETE_ERROR };
  }
}
