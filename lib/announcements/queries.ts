import { supabase } from "@/lib/supabase";
import type {
  AnnouncementFormData,
  AnnouncementItem,
  AnnouncementRow,
} from "./types";

const ERROR = "Unable to manage announcements. Please try again.";

function mapRow(row: AnnouncementRow): AnnouncementItem {
  return {
    id: row.id,
    title: row.title,
    message: row.message,
    status: row.status,
    publishAt: row.publish_at,
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toNullableDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function fetchAnnouncements(): Promise<
  { ok: true; data: AnnouncementItem[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return {
      ok: true,
      data: ((data ?? []) as AnnouncementRow[]).map(mapRow),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function upsertAnnouncement(
  form: AnnouncementFormData,
  id?: string,
): Promise<
  { ok: true; data: AnnouncementItem } | { ok: false; message: string }
> {
  try {
    const payload = {
      title: form.title.trim(),
      message: form.message.trim(),
      status: form.status,
      publish_at: toNullableDate(form.publishAt),
      expires_at: toNullableDate(form.expiresAt),
    };

    const query = id
      ? supabase.from("announcements").update(payload).eq("id", id)
      : supabase.from("announcements").insert(payload);

    const { data, error } = await query.select("*").single();
    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    return { ok: true, data: mapRow(data as AnnouncementRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function deleteAnnouncement(
  id: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase.from("announcements").delete().eq("id", id);
    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}
