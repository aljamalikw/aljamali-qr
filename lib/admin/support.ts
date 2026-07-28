import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/utils/csv";

export const TICKET_PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;
export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = ["Open", "In Progress", "Closed"] as const;
export type TicketStatus = (typeof TICKET_STATUSES)[number];

export type SupportTicket = {
  id: string;
  ticketNumber: string;
  restaurantId: string | null;
  restaurantName: string | null;
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

type TicketRow = {
  id: string;
  ticket_number: string;
  restaurant_id: string | null;
  subject: string;
  category: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_staff: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  restaurants:
    | { restaurant_name: string | null }
    | { restaurant_name: string | null }[]
    | null;
};

type ReplyRow = {
  id: string;
  ticket_id: string;
  body: string;
  author_id: string | null;
  created_at: string;
};

const ERROR = "Unable to manage support tickets. Please try again.";

function restaurantName(row: TicketRow): string | null {
  if (Array.isArray(row.restaurants)) {
    return row.restaurants[0]?.restaurant_name ?? null;
  }
  return row.restaurants?.restaurant_name ?? null;
}

function mapTicket(row: TicketRow): SupportTicket {
  return {
    id: row.id,
    ticketNumber: row.ticket_number,
    restaurantId: row.restaurant_id,
    restaurantName: restaurantName(row),
    subject: row.subject,
    category: row.category,
    priority: row.priority,
    status: row.status,
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

export async function fetchSupportTickets(): Promise<
  { ok: true; data: SupportTicket[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .select("*, restaurants(restaurant_name)")
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true, data: ((data ?? []) as TicketRow[]).map(mapTicket) };
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
      .select("*, restaurants(restaurant_name)")
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
      .select("*, restaurants(restaurant_name)")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    const ticket = mapTicket(data as TicketRow);

    if (params.body?.trim()) {
      await createTicketReply(ticket.id, params.body.trim());
    }

    return { ok: true, data: ticket };
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

    await supabase
      .from("support_tickets")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", ticketId);

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
        status: "In Progress",
      })
      .eq("id", ticketId)
      .select("*, restaurants(restaurant_name)")
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
  try {
    const { data, error } = await supabase
      .from("support_tickets")
      .update({
        status: "Closed",
        closed_at: new Date().toISOString(),
      })
      .eq("id", ticketId)
      .select("*, restaurants(restaurant_name)")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }
    return { ok: true, data: mapTicket(data as TicketRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
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
    "Restaurant",
    "Status",
    "Priority",
    "Assigned",
    "Created",
    "Closed",
  ];

  const rows = items.map((item) => [
    item.ticketNumber,
    item.subject,
    item.restaurantName ?? "",
    item.status,
    item.priority,
    item.assignedStaff ?? "",
    item.createdAt,
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
    if (status === "Closed") {
      payload.closed_at = new Date().toISOString();
    } else {
      payload.closed_at = null;
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .update(payload)
      .eq("id", ticketId)
      .select("*, restaurants(restaurant_name)")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }
    return { ok: true, data: mapTicket(data as TicketRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}
