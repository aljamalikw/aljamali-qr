import { supabase } from "@/lib/supabase";
import type { AnnouncementItem, AnnouncementRow } from "./types";

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

/** Published announcements visible to the current owner (RLS enforces publish/expiry windows). */
export async function fetchPublishedAnnouncementsForOwner(): Promise<
  AnnouncementItem[]
> {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("status", "Published")
      .order("publish_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });

    if (error) return [];
    return ((data ?? []) as AnnouncementRow[]).map(mapRow);
  } catch {
    return [];
  }
}

export async function fetchPublishedAnnouncementById(
  id: string,
): Promise<AnnouncementItem | null> {
  try {
    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .eq("id", id)
      .eq("status", "Published")
      .maybeSingle();

    if (error || !data) return null;
    return mapRow(data as AnnouncementRow);
  } catch {
    return null;
  }
}

/** Latest active announcement for banner display (no priority field in schema). */
export function pickBannerAnnouncement(
  announcements: AnnouncementItem[],
  dismissedIds: ReadonlySet<string>,
): AnnouncementItem | null {
  for (const item of announcements) {
    if (!dismissedIds.has(item.id)) return item;
  }
  return null;
}

export function getAnnouncementPublishedAt(item: AnnouncementItem): string {
  return item.publishAt ?? item.createdAt;
}
