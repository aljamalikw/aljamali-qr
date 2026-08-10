import { NextRequest, NextResponse } from "next/server";
import { syncCustomerEvent } from "@/lib/customers/sync-customer";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type SyncBody = {
  restaurantId?: unknown;
  fullName?: unknown;
  phone?: unknown;
  email?: unknown;
  visitAt?: unknown;
  reservationIncrement?: unknown;
  orderSpent?: unknown;
};

/**
 * Service-role customer sync for public reservation (and similar) flows.
 * Does not alter reservation creation logic — fire-and-forget from clients.
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
  if (!restaurantId) {
    return NextResponse.json(
      { ok: false, error: "restaurantId is required." },
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

  const result = await syncCustomerEvent(
    {
      restaurantId,
      fullName: typeof body.fullName === "string" ? body.fullName : null,
      phone: typeof body.phone === "string" ? body.phone : null,
      email: typeof body.email === "string" ? body.email : null,
      visitAt: typeof body.visitAt === "string" ? body.visitAt : undefined,
      reservationIncrement:
        typeof body.reservationIncrement === "number"
          ? body.reservationIncrement
          : undefined,
      orderSpent:
        typeof body.orderSpent === "number" ? body.orderSpent : undefined,
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
