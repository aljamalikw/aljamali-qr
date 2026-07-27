import { supabase } from "@/lib/supabase";
import { mapDemoRequestFormToInsert } from "./mappers";
import type { DemoRequestFormData } from "./types";

const CREATE_ERROR =
  "Unable to submit your demo request. Please try again in a moment.";

export async function createDemoRequest(
  form: DemoRequestFormData,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const payload = mapDemoRequestFormToInsert(form);

    const { error } = await supabase.from("demo_requests").insert(payload);

    if (error) {
      return { ok: false, message: error.message || CREATE_ERROR };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}
