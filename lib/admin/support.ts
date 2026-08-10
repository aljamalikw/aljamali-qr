import { supabase } from "@/lib/supabase";
import { logActivity } from "@/lib/admin/activity-log";
import { buildCsv } from "@/lib/utils/csv";
import {
  firstNonEmpty,
  groupItemsByOwnerId,
  sortOwnerRowsByName,
} from "@/lib/admin/group-by-owner";

export const TICKET_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = [
  "Open",
  "Waiting for Customer",
  "Waiting for Admin",
  "Resolved",
  "Closed",
] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export const TICKET_CATEGORIES = [
  "Billing",
  "QR Codes",
  "Menu",
  "Account",
  "Technical",
  "Other",
] as const;

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  restaurantId: string | null;
  restaurantName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  subject: string;
  category: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  assignedStaff: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
};

export type SupportTicketReply = {
  id: string;
  ticketId: string;
  body: string;
  authorId: string | null;
  createdAt: string;
};

export type SupportOwnerGroup = {
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  restaurantCount: number;
  restaurants: Array<{ id: string; name: string | null }>;
  tickets: SupportTicket[];
  ticketCount: number;
};

type RestaurantJoin = {
  restaurant_name: string | null;
  owner_id: string | null;
  owner_name: string | null;
  email: string | null;
  phone: string | null;
};

type TicketRow = {
  id: string;
  ticket_number: string;
  restaurant_id: string | null;
  subject: string;
  category: string | null;
  priority: TicketPriority;
  status: string;
  assigned_staff: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  restaurants: RestaurantJoin | RestaurantJoin[] | null;
};

type ReplyRow = {
  id: string;
  ticket_id: string;
  body: string;
  author_id: string | null;
  created_at: string;
};

const ERROR = "Unable to manage support tickets. Please try again.";
const SELECT_WITH_RESTAURANT =
  "*, restaurants(restaurant_name, owner_id, owner_name, email, phone)";

function restaurantFromJoin(row: TicketRow): RestaurantJoin | null {
  if (Array.isArray(row.restaurants)) return row.restaurants[0] ?? null;
  return row.restaurants;
}

function normalizeStatus(status: string): TicketStatus {
  if (status === "In Progress") return "Waiting for Admin";
  if ((TICKET_STATUSES as readonly string[]).includes(status)) {
    return status as TicketStatus;
  }
  return "Open";
}

function mapTicket(row: TicketRow): SupportTicket {
  const restaurant = restaurantFromJoin(row);
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    restaurantId: row.restaurant_id,
    restaurantName: restaurant?.restaurant_name ?? null,
    ownerId: restaurant?.owner_id ?? row.created_by ?? null,
    ownerName: restaurant?.owner_name ?? null,
    ownerEmail: restaurant?.email ?? null,
    ownerPhone: restaurant?.phone ?? null,
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    status: normalizeStatus(row.status),
    assignedStaff: row.assigned_staff,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at,
  };
}

function mapReply(row: ReplyRow): SupportTicketReply {
  return {
    id: row.id,
    ticketId: row.ticket_id,
    body: row.body,
    authorId: row.author_id,
    createdAt: row.created_at,
  };
}

function nextTicketNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `SUP-${stamp}-${rand}`;
}

export function getTicketStatusBadgeClass(status: TicketStatus): string {
  switch (status) {
    case "Open":
      return "border-sky-500/35 bg-sky-500/10 text-sky-300";
    case "Waiting for Customer":
      return "border-amber-500/35 bg-amber-500/10 text-amber-300";
    case "Waiting for Admin":
      return "border-orange-500/35 bg-orange-500/10 text-orange-300";
    case "Resolved":
      return "border-emerald-500/35 bg-emerald-500/10 text-emerald-300";
    case "Closed":
      return "border-white/15 bg-white/5 text-white/50";
    default:
      return "border-white/10 bg-white/5 text-white/60";
  }
}

export function getTicketCategoryBadgeClass(): string {
  return "border-gold/25 bg-gold/10 text-gold";
}

export function replySenderLabel(
  reply: SupportTicketReply,
  ticket: SupportTicket,
): "Owner" | "Support" {
  if (reply.authorId && ticket.createdBy && reply.authorId === ticket.createdBy) {
    return "Owner";
  }
  return "Support";
}

export function groupSupportTicketsByOwner(
  tickets: SupportTicket[],
): SupportOwnerGroup[] {
  const withOwner = tickets.map((ticket) => ({
    ...ticket,
    ownerId: ticket.ownerId || ticket.createdBy || "unknown",
  }));
  const byOwner = groupItemsByOwnerId(withOwner);
  const groups: SupportOwnerGroup[] = [];

  for (const [ownerId, ownerTickets] of byOwner) {
    const restaurantMap = new Map<string, string | null>();
    for (const ticket of ownerTickets) {
      if (!ticket.restaurantId) continue;
      restaurantMap.set(ticket.restaurantId, ticket.restaurantName);
    }

    groups.push({
      ownerId,
      ownerName: firstNonEmpty(...ownerTickets.map((t) => t.ownerName)),
      ownerEmail: firstNonEmpty(...ownerTickets.map((t) => t.ownerEmail)),
      ownerPhone: firstNonEmpty(...ownerTickets.map((t) => t.ownerPhone)),
      restaurantCount: restaurantMap.size,
      restaurants: [...restaurantMap.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => (a.name ?? "").localeCompare(b.name ?? "")),
      tickets: [...ownerTickets].sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      ),
      ticketCount: ownerTickets.length,
    });
  }

  return sortOwnerRowsByName(groups);
}

export async function fetchSupportTickets(): Promise<
  { ok: true; data: SupportTicket[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(SELECT_WITH_RESTAURANT)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true, data: ((data ?? []) as TicketRow[]).map(mapTicket) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

/** Owner CRM: tickets for an owner account and/or their restaurants. */
export async function fetchSupportTicketsForOwner(
  ownerId: string,
  restaurantIds: string[],
): Promise<
  { ok: true; data: SupportTicket[] } | { ok: false; message: string }
> {
  try {
    const filters: string[] = [`created_by.eq.${ownerId}`];
    if (restaurantIds.length > 0) {
      filters.push(`restaurant_id.in.(${restaurantIds.join(",")})`);
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .select(SELECT_WITH_RESTAURANT)
      .or(filters.join(","))
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };

    const mapped = ((data ?? []) as TicketRow[]).map(mapTicket);
    const byId = new Map(mapped.map((ticket) => [ticket.id, ticket]));
    return { ok: true, data: Array.from(byId.values()) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchOwnerSupportTickets(
  restaurantId: string,
): Promise<
  { ok: true; data: SupportTicket[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select(SELECT_WITH_RESTAURANT)
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true, data: ((data ?? []) as TicketRow[]).map(mapTicket) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function createSupportTicket(params: {
  restaurantId: string;
  restaurantName?: string | null;
  ownerId?: string | null;
  ownerEmail?: string | null;
  subject: string;
  category?: string;
  priority?: TicketPriority;
  body?: string;
}): Promise<
  { ok: true; data: SupportTicket } | { ok: false; message: string }
> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return { ok: false, message: "You must be signed in." };

    const { data, error } = await supabase
      .from("support_tickets")
      .insert({
        ticket_number: nextTicketNumber(),
        restaurant_id: params.restaurantId,
        subject: params.subject.trim(),
        category: params.category?.trim() || null,
        priority: params.priority ?? "Medium",
        status: "Open",
        created_by: userId,
      })
      .select(SELECT_WITH_RESTAURANT)
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    const ticket = mapTicket(data as TicketRow);
    const details = params.body?.trim() ?? "";

    void logActivity({
      action: "support_ticket_created",
      restaurantId: params.restaurantId,
      ownerId: params.ownerId ?? ticket.ownerId,
      entityType: "support_ticket",
      entityId: ticket.id,
      newValues: {
        subject: ticket.subject,
        priority: ticket.priority,
        category: ticket.category,
        ticket_number: ticket.ticketNumber,
      },
    });

    // Context (restaurant_id, restaurant_name, owner_id, owner_email) is stored
    // via restaurant_id + created_by and loaded for admin from the restaurant join.
    if (details) {
      await createTicketReply(ticket.id, details, {
        nextStatus: "Waiting for Admin",
      });
      return {
        ok: true,
        data: { ...ticket, status: "Waiting for Admin" },
      };
    }

    const statusResult = await updateSupportTicketStatus(
      ticket.id,
      "Waiting for Admin",
    );
    if (!statusResult.ok) return { ok: true, data: ticket };
    return statusResult;
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchTicketReplies(
  ticketId: string,
): Promise<
  { ok: true; data: SupportTicketReply[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("support_ticket_replies")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true, data: ((data ?? []) as ReplyRow[]).map(mapReply) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function createTicketReply(
  ticketId: string,
  body: string,
  options?: { nextStatus?: TicketStatus },
): Promise<
  { ok: true; data: SupportTicketReply } | { ok: false; message: string }
> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id;
    if (!userId) return { ok: false, message: "You must be signed in." };

    const { data, error } = await supabase
      .from("support_ticket_replies")
      .insert({
        ticket_id: ticketId,
        body: body.trim(),
        author_id: userId,
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (options?.nextStatus) {
      payload.status = options.nextStatus;
      payload.closed_at =
        options.nextStatus === "Closed" || options.nextStatus === "Resolved"
          ? new Date().toISOString()
          : null;
    }

    await supabase.from("support_tickets").update(payload).eq("id", ticketId);

    void logActivity({
      action: "support_ticket_replied",
      entityType: "support_ticket",
      entityId: ticketId,
      newValues: {
        reply_id: (data as ReplyRow).id,
        next_status: options?.nextStatus ?? null,
      },
    });

    return { ok: true, data: mapReply(data as ReplyRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function assignSupportTicket(
  ticketId: string,
  assignedStaff: string,
): Promise<
  { ok: true; data: SupportTicket } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .update({
        assigned_staff: assignedStaff.trim() || null,
        status: "Waiting for Customer",
      })
      .eq("id", ticketId)
      .select(SELECT_WITH_RESTAURANT)
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }
    return { ok: true, data: mapTicket(data as TicketRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function closeSupportTicket(
  ticketId: string,
): Promise<
  { ok: true; data: SupportTicket } | { ok: false; message: string }
> {
  return updateSupportTicketStatus(ticketId, "Closed");
}

export async function bulkCloseSupportTickets(
  ticketIds: string[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase
      .from("support_tickets")
      .update({ status: "Closed", closed_at: new Date().toISOString() })
      .in("id", ticketIds);

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export function exportSupportTicketsToCsv(items: SupportTicket[]): string {
  const headers = [
    "Ticket",
    "Subject",
    "Owner",
    "Email",
    "Phone",
    "Restaurant",
    "Status",
    "Priority",
    "Category",
    "Assigned",
    "Created",
    "Updated",
    "Closed",
  ];

  const rows = items.map((item) => [
    item.ticketNumber,
    item.subject,
    item.ownerName ?? "",
    item.ownerEmail ?? "",
    item.ownerPhone ?? "",
    item.restaurantName ?? "",
    item.status,
    item.priority,
    item.category ?? "",
    item.assignedStaff ?? "",
    item.createdAt,
    item.updatedAt,
    item.closedAt ?? "",
  ]);

  return buildCsv(headers, rows);
}

export async function updateSupportTicketStatus(
  ticketId: string,
  status: TicketStatus,
): Promise<
  { ok: true; data: SupportTicket } | { ok: false; message: string }
> {
  try {
    const payload: Record<string, unknown> = { status };
    if (status === "Closed" || status === "Resolved") {
      payload.closed_at = new Date().toISOString();
    } else {
      payload.closed_at = null;
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .update(payload)
      .eq("id", ticketId)
      .select(SELECT_WITH_RESTAURANT)
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    const ticket = mapTicket(data as TicketRow);
    if (status === "Resolved" || status === "Closed") {
      void logActivity({
        action: "support_ticket_resolved",
        restaurantId: ticket.restaurantId,
        ownerId: ticket.ownerId,
        entityType: "support_ticket",
        entityId: ticket.id,
        newValues: { status },
      });
    }

    return { ok: true, data: ticket };
  } catch {
    return { ok: false, message: ERROR };
  }
}

const SEEN_PREFIX = "aj_support_seen_";

export function getTicketLastSeen(ticketId: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(`${SEEN_PREFIX}${ticketId}`);
  } catch {
    return null;
  }
}

export function markTicketSeen(ticketId: string, atIso?: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      `${SEEN_PREFIX}${ticketId}`,
      atIso || new Date().toISOString(),
    );
  } catch {
    // ignore
  }
}

export function ticketHasUnreadSupportReplies(
  ticket: SupportTicket,
  replies: SupportTicketReply[],
): boolean {
  const seen = getTicketLastSeen(ticket.id);
  return replies.some((reply) => {
    if (replySenderLabel(reply, ticket) !== "Support") return false;
    if (!seen) return true;
    return reply.createdAt > seen;
  });
}
