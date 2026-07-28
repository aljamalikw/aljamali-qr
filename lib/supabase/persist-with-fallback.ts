import { supabase } from "@/lib/supabase";

/**
 * Postgres/PostgREST reports missing columns with SQLSTATE 42703 and a message like
 * `column "restaurants.gallery_urls" does not exist` (or `column gallery_urls of
 * relation "restaurants" does not exist`). We parse the offending column name so we
 * can retry the request without it — this lets the app ship new optional fields
 * before their migration has been applied to a given database.
 */
function extractMissingColumn(error: { code?: string; message?: string } | null | undefined): string | null {
  if (!error?.message) return null;
  const match = error.message.match(/column\s+"?([a-zA-Z0-9_.]+)"?\s+(of relation|does not exist)/i);
  if (!match) return null;
  const raw = match[1];
  const parts = raw.split(".");
  return parts[parts.length - 1] || null;
}

export const NO_COLUMNS_AVAILABLE = "NO_COLUMNS_AVAILABLE";

type FallbackResult<T> =
  | { ok: true; data: T; appliedKeys: string[] }
  | { ok: false; message: string; appliedKeys: string[] };

/**
 * Updates a row, stripping any columns that don't exist in the database yet and
 * retrying until the write succeeds (or there are no columns left to persist).
 */
export async function updateWithColumnFallback<T = Record<string, unknown>>(
  table: string,
  match: Record<string, string | number>,
  payload: Record<string, unknown>,
): Promise<FallbackResult<T>> {
  let currentPayload: Record<string, unknown> = { ...payload };

  for (;;) {
    if (Object.keys(currentPayload).length === 0) {
      return { ok: false, message: NO_COLUMNS_AVAILABLE, appliedKeys: [] };
    }

    let query = supabase.from(table).update(currentPayload);
    for (const [key, value] of Object.entries(match)) {
      query = query.eq(key, value);
    }
    const { data, error } = await query.select("*").single();

    if (!error) {
      if (!data) {
        return { ok: false, message: "Unable to save changes. Please try again.", appliedKeys: Object.keys(currentPayload) };
      }
      return { ok: true, data: data as T, appliedKeys: Object.keys(currentPayload) };
    }

    const missingColumn = extractMissingColumn(error);
    if (missingColumn && missingColumn in currentPayload) {
      const next = { ...currentPayload };
      delete next[missingColumn];
      currentPayload = next;
      continue;
    }

    return {
      ok: false,
      message: error.message || "Unable to save changes. Please try again.",
      appliedKeys: Object.keys(currentPayload),
    };
  }
}

/**
 * Inserts a row, stripping any columns that don't exist in the database yet and
 * retrying until the write succeeds (or there are no columns left to persist).
 */
export async function insertWithColumnFallback<T = Record<string, unknown>>(
  table: string,
  payload: Record<string, unknown>,
): Promise<FallbackResult<T>> {
  let currentPayload: Record<string, unknown> = { ...payload };

  for (;;) {
    if (Object.keys(currentPayload).length === 0) {
      return { ok: false, message: NO_COLUMNS_AVAILABLE, appliedKeys: [] };
    }

    const { data, error } = await supabase.from(table).insert(currentPayload).select("*").single();

    if (!error) {
      if (!data) {
        return { ok: false, message: "Unable to save changes. Please try again.", appliedKeys: Object.keys(currentPayload) };
      }
      return { ok: true, data: data as T, appliedKeys: Object.keys(currentPayload) };
    }

    const missingColumn = extractMissingColumn(error);
    if (missingColumn && missingColumn in currentPayload) {
      const next = { ...currentPayload };
      delete next[missingColumn];
      currentPayload = next;
      continue;
    }

    return {
      ok: false,
      message: error.message || "Unable to save changes. Please try again.",
      appliedKeys: Object.keys(currentPayload),
    };
  }
}

/** Removes keys whose value is `undefined` so optional fields can be spread safely. */
export function stripUndefined<T extends Record<string, unknown>>(payload: T): Partial<T> {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as Partial<T>;
}
