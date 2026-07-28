import { supabase } from "@/lib/supabase";
import { mapDemoRequestRowToItem } from "./mappers";
import type { DemoRequestItem, DemoRequestRow } from "./types";

const ARCHIVE_ERROR = "Unable to archive demo request. Please try again.";

export async function archiveDemoRequest(
  id: string,
): Promise<
  { ok: true; data: DemoRequestItem } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("demo_requests")
      .update({
        is_archived: true,
        archived_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ARCHIVE_ERROR };
    }

    return { ok: true, data: mapDemoRequestRowToItem(data as DemoRequestRow) };
  } catch {
    return { ok: false, message: ARCHIVE_ERROR };
  }
}

export async function restoreDemoRequest(
  id: string,
): Promise<
  { ok: true; data: DemoRequestItem } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("demo_requests")
      .update({
        is_archived: false,
        archived_at: null,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ARCHIVE_ERROR };
    }

    return { ok: true, data: mapDemoRequestRowToItem(data as DemoRequestRow) };
  } catch {
    return { ok: false, message: ARCHIVE_ERROR };
  }
}
