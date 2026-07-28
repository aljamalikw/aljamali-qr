import { supabase } from "@/lib/supabase";
import { mapDemoRequestRowToItem } from "./mappers";
import type { DemoRequestItem, DemoRequestRow } from "./types";

const FETCH_ERROR = "Unable to load demo requests. Please try again.";

export async function fetchDemoRequests(): Promise<
  { ok: true; data: DemoRequestItem[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("demo_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, message: error.message || FETCH_ERROR };
    }

    const rows = (data ?? []) as DemoRequestRow[];
    return {
      ok: true,
      data: rows.map(mapDemoRequestRowToItem),
    };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}
