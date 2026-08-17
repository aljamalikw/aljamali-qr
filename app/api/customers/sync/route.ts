import { NextRequest, NextResponse } from "next/server";
import { syncCustomerEvent } from "@/lib/customers/sync-customer";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SyncBody = {
  restaurantId?: unknown;
  reservationId?: unknown;
  orderId?: unknown;
  fullName?: unknown;
  phone?: unknown;
  email?: unknown;
  visitAt?: unknown;
  reservationIncrement?: unknown;
  orderSpent?: unknown;
};

/**
 * Service-role customer sync for public reservation / order-adjacent flows.
 * Requires a proof record (reservationId or orderId) that matches restaurantId
 * so anonymous callers cannot invent CRM stats for arbitrary restaurants.
 */
export async function POST(request: NextRequest) {
  let body: SyncBody;
  try {
    body = (await request.json()) as SyncBody;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const restaurantId =
    typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  const reservationId =
    typeof body.reservationId === "string" ? body.reservationId.trim() : "";
  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";

  if (!restaurantId) {
    return NextResponse.json(
      { ok: false, error: "restaurantId is required." },
      { status: 400 },
    );
  }

  if (!reservationId && !orderId) {
    return NextResponse.json(
      { ok: false, error: "reservationId or orderId is required." },
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

  const { data: restaurant } = await admin
    .from("restaurants")
    .select("id, is_active")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant || restaurant.is_active === false) {
    return NextResponse.json(
      { ok: false, error: "Restaurant not found." },
      { status: 404 },
    );
  }

  let fullName: string | null =
    typeof body.fullName === "string" ? body.fullName : null;
  let phone: string | null =
    typeof body.phone === "string" ? body.phone : null;
  let email: string | null =
    typeof body.email === "string" ? body.email : null;
  let visitAt: string | undefined =
    typeof body.visitAt === "string" ? body.visitAt : undefined;
  let reservationIncrement: number | undefined;
  let orderSpent: number | undefined;

  if (reservationId) {
    const { data: reservation } = await admin
      .from("reservations")
      .select(
        "id, restaurant_id, customer_name, mobile_number, email, created_at",
      )
      .eq("id", reservationId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (!reservation) {
      return NextResponse.json(
        { ok: false, error: "Reservation not found." },
        { status: 404 },
      );
    }

    fullName =
      (reservation as { customer_name?: string | null }).customer_name ??
      fullName;
    phone =
      (reservation as { mobile_number?: string | null }).mobile_number ?? phone;
    email = (reservation as { email?: string | null }).email ?? email;
    visitAt =
      (reservation as { created_at?: string | null }).created_at ?? visitAt;
    reservationIncrement = 1;
  }

  if (orderId) {
    const { data: order } = await admin
      .from("orders")
      .select(
        "id, restaurant_id, customer_name, customer_phone, customer_email, grand_total, created_at",
      )
      .eq("id", orderId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (!order) {
      return NextResponse.json(
        { ok: false, error: "Order not found." },
        { status: 404 },
      );
    }

    fullName =
      (order as { customer_name?: string | null }).customer_name ?? fullName;
    phone =
      (order as { customer_phone?: string | null }).customer_phone ?? phone;
    email = (order as { customer_email?: string | null }).customer_email ?? email;
    visitAt = (order as { created_at?: string | null }).created_at ?? visitAt;
    const total = Number((order as { grand_total?: number | string }).grand_total);
    orderSpent = Number.isFinite(total) ? Math.max(0, total) : 0;
  }

  const result = await syncCustomerEvent(
    {
      restaurantId,
      fullName,
      phone,
      email,
      visitAt,
      reservationIncrement,
      orderSpent,
    },
    admin,
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, customerId: result.customerId });
}
