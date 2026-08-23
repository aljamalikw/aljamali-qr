import type { SupabaseClient } from "@supabase/supabase-js";
import {
  notifyPlatformAdmins,
  type CreateNotificationParams,
} from "@/lib/notifications/createNotification";

export type NewSupportTicketNotice = {
  ticketId: string;
  ticketNumber: string;
  restaurantId: string | null;
  restaurantName: string | null;
  ownerName: string | null;
  subject: string;
  priority: string;
};

export function buildNewSupportTicketNotification(
  input: NewSupportTicketNotice,
): Omit<CreateNotificationParams, "userId"> {
  const restaurant = input.restaurantName?.trim() || "a restaurant";
  const subject = input.subject.trim() || "Untitled ticket";
  const priority = input.priority.trim().toLowerCase() || "medium";
  const owner = input.ownerName?.trim() || null;
  const ticketRef = input.ticketNumber.trim() || input.ticketId;

  const bodyParts = [owner, ticketRef].filter(Boolean);

  return {
    type: "support_ticket",
    title: `New ${priority} support ticket from ${restaurant}: ${subject}`,
    body: bodyParts.join(" · ") || ticketRef,
    href: `/admin/support?ticket=${input.ticketId}`,
    restaurantId: input.restaurantId,
    meta: {
      ticketId: input.ticketId,
      ticketNumber: input.ticketNumber,
      priority: input.priority,
      restaurantName: input.restaurantName,
      ownerName: input.ownerName,
    },
  };
}

/**
 * Creates one `support_ticket` notification per platform admin.
 * Skips if a new-ticket notice for this ticket already exists.
 */
export async function notifyAdminsOfNewSupportTicket(
  client: SupabaseClient,
  input: NewSupportTicketNotice,
): Promise<{ ok: true; skipped?: boolean } | { ok: false; message: string }> {
  const { data: existing, error } = await client
    .from("notifications")
    .select("id")
    .eq("type", "support_ticket")
    .contains("meta", { ticketId: input.ticketId })
    .limit(1);

  if (error) return { ok: false, message: error.message };
  if (existing && existing.length > 0) {
    return { ok: true, skipped: true };
  }

  const result = await notifyPlatformAdmins(
    buildNewSupportTicketNotification(input),
    client,
  );
  if (!result.ok) return result;
  return { ok: true };
}
