import { logActivity } from "@/lib/admin/activity-log";
import { supabase } from "@/lib/supabase";
import { fetchOrderById } from "./fetchOrders";
import { mapOrderRow } from "./mappers";
import type { Order, OrderRecord, OrderStatus, PaymentStatus } from "./types";
import { canCancelOrder, getNextOrderStatus } from "./utils";

const UPDATE_ERROR = "Unable to update the order. Please try again.";

const STATUS_TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  Accepted: "accepted_at",
  Preparing: "preparing_at",
  Ready: "ready_at",
  Completed: "completed_at",
  Cancelled: "cancelled_at",
};

function isAllowedStatusTransition(
  from: OrderStatus,
  to: OrderStatus,
): boolean {
  if (to === "Cancelled") return canCancelOrder(from);
  return getNextOrderStatus(from) === to;
}

async function withLineItems(order: Order): Promise<Order> {
  if (order.items.length > 0) return order;
  const refreshed = await fetchOrderById(order.id);
  if (refreshed.ok && refreshed.data && refreshed.data.items.length > 0) {
    return refreshed.data;
  }
  return order;
}

async function triggerServerLoyaltyAwardCheck(orderId: string): Promise<void> {
  console.info("[LOYALTY AWARD TRIGGER]", {
    orderId,
    stage: "client_trigger_requested",
  });
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    console.warn("[LOYALTY AWARD CHECK]", {
      reason: "missing_session_for_server_check",
      orderId,
    });
    return;
  }

  const response = await fetch("/api/orders/loyalty-award", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ orderId }),
  });

  if (!response.ok) {
    let payload: { error?: string } = {};
    try {
      payload = (await response.json()) as typeof payload;
    } catch {}
    console.warn("[LOYALTY AWARD CHECK]", {
      reason: "server_check_failed",
      orderId,
      status: response.status,
      message: payload.error ?? "Award check request failed.",
    });
    return;
  }

  let payload: { awarded?: boolean; points?: number } = {};
  try {
    payload = (await response.json()) as typeof payload;
  } catch {}
  console.info("[LOYALTY AWARD TRIGGER]", {
    orderId,
    stage: "client_trigger_completed",
    awarded: payload.awarded ?? false,
    points: payload.points ?? 0,
  });
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ ok: true; data: Order } | { ok: false; message: string }> {
  try {
    const { data: previous } = await supabase
      .from("orders")
      .select("status, restaurant_id")
      .eq("id", orderId)
      .maybeSingle();

    if (!previous) {
      return { ok: false, message: "Order not found." };
    }

    const fromStatus = (previous as { status?: OrderStatus }).status;
    if (
      fromStatus &&
      !isAllowedStatusTransition(fromStatus, status)
    ) {
      return {
        ok: false,
        message: `Cannot change order from ${fromStatus} to ${status}.`,
      };
    }

    const payload: Record<string, unknown> = { status };
    const timestampField = STATUS_TIMESTAMP_FIELD[status];
    if (timestampField) payload[timestampField] = new Date().toISOString();

    const { data, error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId)
      .select("*, order_items(*)")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message || UPDATE_ERROR };
    }

    const order = await withLineItems(mapOrderRow(data as OrderRecord));
    void logActivity({
      action: "order_status_changed",
      restaurantId:
        order.restaurantId ||
        (previous as { restaurant_id?: string } | null)?.restaurant_id,
      entityType: "order",
      entityId: orderId,
      oldValues: {
        status: (previous as { status?: string } | null)?.status ?? null,
      },
      newValues: { status },
    });

    await triggerServerLoyaltyAwardCheck(orderId);

    return { ok: true, data: order };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
): Promise<{ ok: true; data: Order } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message || UPDATE_ERROR };
    }

    const order = await withLineItems(mapOrderRow(data as OrderRecord));
    await triggerServerLoyaltyAwardCheck(orderId);
    return {
      ok: true,
      data: order,
    };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}

export async function updateKitchenNotes(
  orderId: string,
  kitchenNotes: string,
): Promise<{ ok: true; data: Order } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .update({ kitchen_notes: kitchenNotes.trim() || null })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message || UPDATE_ERROR };
    }

    return {
      ok: true,
      data: await withLineItems(mapOrderRow(data as OrderRecord)),
    };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}
