import { NextRequest, NextResponse } from "next/server";
import {
  canManageRestaurantOrder,
  requireOrderRouteUser,
} from "@/lib/orders/order-route-auth";
import { updatePaymentStatusWithClient } from "@/lib/orders/updateOrderWithClient";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/orders/types";

export const runtime = "nodejs";

type Body = {
  orderId?: unknown;
  paymentStatus?: unknown;
};

export async function POST(request: NextRequest) {
  const auth = await requireOrderRouteUser(request);
  if (!auth.ok) return auth.response;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  const orderId = typeof body.orderId === "string" ? body.orderId.trim() : "";
  const paymentStatusRaw =
    typeof body.paymentStatus === "string" ? body.paymentStatus.trim() : "";
  const paymentStatus = (PAYMENT_STATUSES as readonly string[]).includes(
    paymentStatusRaw,
  )
    ? (paymentStatusRaw as PaymentStatus)
    : null;

  if (!orderId || !paymentStatus) {
    return NextResponse.json(
      { ok: false, error: "orderId and a valid paymentStatus are required." },
      { status: 400 },
    );
  }

  const { data: order, error } = await auth.admin
    .from("orders")
    .select("id, restaurant_id")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json(
      { ok: false, error: "Order not found." },
      { status: 404 },
    );
  }

  const restaurantId =
    (order as { restaurant_id?: string } | null)?.restaurant_id ?? "";
  const allowed = await canManageRestaurantOrder(
    auth.admin,
    auth.userId,
    restaurantId,
  );
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const result = await updatePaymentStatusWithClient(
    auth.admin,
    orderId,
    paymentStatus,
    { actorUserId: auth.userId },
  );

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.message },
      { status: 400 },
    );
  }

  return NextResponse.json({
    ok: true,
    data: result.data,
    loyaltyAward: result.loyaltyAward,
  });
}
