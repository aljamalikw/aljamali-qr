import { NextRequest, NextResponse } from "next/server";
import {
  canManageRestaurantOrder,
  requireOrderRouteUser,
} from "@/lib/orders/order-route-auth";
import { updateOrderStatusWithClient } from "@/lib/orders/updateOrderWithClient";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/orders/types";

export const runtime = "nodejs";

type Body = {
  orderId?: unknown;
  status?: unknown;
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
  const statusRaw = typeof body.status === "string" ? body.status.trim() : "";
  const status = (ORDER_STATUSES as readonly string[]).includes(statusRaw)
    ? (statusRaw as OrderStatus)
    : null;

  if (!orderId || !status) {
    return NextResponse.json(
      { ok: false, error: "orderId and a valid status are required." },
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

  const result = await updateOrderStatusWithClient(auth.admin, orderId, status, {
    actorUserId: auth.userId,
  });

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
