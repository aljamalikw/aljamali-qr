import { NextRequest, NextResponse } from "next/server";
import { notifyAdminsOfNewSupportTicket } from "@/lib/notifications/support-ticket";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type NotifyBody = {
  ticketId?: unknown;
};

type RestaurantJoin = {
  restaurant_name: string | null;
  owner_id: string | null;
  owner_name: string | null;
};

function restaurantFromJoin(
  value: RestaurantJoin | RestaurantJoin[] | null,
): RestaurantJoin | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value;
}

async function requireUser(request: NextRequest): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service unavailable.";
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: message }, { status: 500 }),
    };
  }

  const {
    data: { user },
    error,
  } = await admin.auth.getUser(token);

  if (error || !user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Invalid session." },
        { status: 401 },
      ),
    };
  }

  return { ok: true, userId: user.id };
}

export async function POST(request: NextRequest) {
  const auth = await requireUser(request);
  if (!auth.ok) return auth.response;

  let body: NotifyBody;
  try {
    body = (await request.json()) as NotifyBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const ticketId = typeof body.ticketId === "string" ? body.ticketId.trim() : "";
  if (!ticketId) {
    return NextResponse.json(
      { ok: false, error: "ticketId is required." },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }

  const { data, error } = await admin
    .from("support_tickets")
    .select(
      "id, ticket_number, subject, priority, restaurant_id, created_by, restaurants(restaurant_name, owner_id, owner_name)",
    )
    .eq("id", ticketId)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Ticket not found." },
      { status: 404 },
    );
  }

  const restaurant = restaurantFromJoin(
    data.restaurants as RestaurantJoin | RestaurantJoin[] | null,
  );
  const isCreator = data.created_by === auth.userId;
  const isOwner = restaurant?.owner_id === auth.userId;
  if (!isCreator && !isOwner) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const result = await notifyAdminsOfNewSupportTicket(admin, {
    ticketId: data.id,
    ticketNumber: data.ticket_number ?? "",
    restaurantId: data.restaurant_id ?? null,
    restaurantName: restaurant?.restaurant_name ?? null,
    ownerName: restaurant?.owner_name ?? null,
    subject: data.subject ?? "",
    priority: data.priority ?? "Medium",
  });

  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, skipped: result.skipped === true });
}
