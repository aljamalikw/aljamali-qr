import { supabase } from "@/lib/supabase";
import {
  mapDemoRequestRowToItem,
  mapEditableFieldsToUpdatePayload,
} from "./mappers";
import type {
  DemoRequestEditableFields,
  DemoRequestItem,
  DemoRequestRow,
} from "./types";

const UPDATE_ERROR = "Unable to save demo request changes. Please try again.";

export async function updateDemoRequest(
  id: string,
  fields: DemoRequestEditableFields,
): Promise<
  { ok: true; data: DemoRequestItem } | { ok: false; message: string }
> {
  try {
    const payload = mapEditableFieldsToUpdatePayload(fields);

    const { data, error } = await supabase
      .from("demo_requests")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? UPDATE_ERROR };
    }

    return { ok: true, data: mapDemoRequestRowToItem(data as DemoRequestRow) };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}
