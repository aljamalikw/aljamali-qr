import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/admin/activity-log";
import { mapOrderRow } from "./mappers";
import { maybeAwardLoyaltyPointsForOrder } from "./loyalty-awards";
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

export type OrderMutationResult =
  | {
      ok: true;
      data: Order;
      loyaltyAward: { awarded: boolean; points: number };
    }
  | { ok: false; message: string };

function mapUpdatedOrder(data: OrderRecord): Order {
  return mapOrderRow(data);
}

/**
 * Server-side order status mutation with integrated loyalty award check.
 * Uses service-role client after route auth verifies restaurant access.
 */
export async function updateOrderStatusWithClient(
  client: SupabaseClient,
  orderId: string,
  status: OrderStatus,
  options?: { actorUserId?: string | null },
): Promise<OrderMutationResult> {
  try {
    const { data: previous } = await client
      .from("orders")
      .select("status, restaurant_id")
      .eq("id", orderId)
      .maybeSingle();

    if (!previous) {
      return { ok: false, message: "Order not found." };
    }

    const fromStatus = (previous as { status?: OrderStatus }).status;
    if (fromStatus && !isAllowedStatusTransition(fromStatus, status)) {
      return {
        ok: false,
        message: `Cannot change order from ${fromStatus} to ${status}.`,
      };
    }

    const payload: Record<string, unknown> = { status };
    const timestampField = STATUS_TIMESTAMP_FIELD[status];
    if (timestampField) payload[timestampField] = new Date().toISOString();

    const { data, error } = await client
      .from("orders")
      .update(payload)
      .eq("id", orderId)
      .select("*, order_items(*)")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message || UPDATE_ERROR };
    }

    const order = mapUpdatedOrder(data as OrderRecord);
    void logActivity({
      action: "order_status_changed",
      restaurantId:
        order.restaurantId ||
        (previous as { restaurant_id?: string } | null)?.restaurant_id,
      entityType: "order",
      entityId: orderId,
      actorId: options?.actorUserId ?? undefined,
      oldValues: {
        status: (previous as { status?: string } | null)?.status ?? null,
      },
      newValues: { status },
      client,
    });

    console.info("[LOYALTY TRACE]", {
      stage: "trigger entered",
      source: "updateOrderStatusWithClient",
      orderId,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      restaurantId: order.restaurantId,
    });

    const loyaltyResult = await maybeAwardLoyaltyPointsForOrder(orderId, client);
    if (!loyaltyResult.ok) {
      console.warn("[LOYALTY TRACE]", {
        stage: "award failed",
        source: "updateOrderStatusWithClient",
        orderId,
        message: loyaltyResult.message,
      });
    } else if (loyaltyResult.awarded) {
      console.info("[LOYALTY TRACE]", {
        stage: "award succeeded",
        source: "updateOrderStatusWithClient",
        orderId,
        points: loyaltyResult.points,
      });
    }

    return {
      ok: true,
      data: order,
      loyaltyAward: {
        awarded: loyaltyResult.ok ? loyaltyResult.awarded : false,
        points: loyaltyResult.ok ? loyaltyResult.points : 0,
      },
    };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}

/**
 * Server-side payment status mutation with integrated loyalty award check.
 */
export async function updatePaymentStatusWithClient(
  client: SupabaseClient,
  orderId: string,
  paymentStatus: PaymentStatus,
  options?: { actorUserId?: string | null },
): Promise<OrderMutationResult> {
  try {
    const { data, error } = await client
      .from("orders")
      .update({ payment_status: paymentStatus })
      .eq("id", orderId)
      .select("*, order_items(*)")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message || UPDATE_ERROR };
    }

    const order = mapUpdatedOrder(data as OrderRecord);

    console.info("[LOYALTY TRACE]", {
      stage: "trigger entered",
      source: "updatePaymentStatusWithClient",
      orderId,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      restaurantId: order.restaurantId,
    });

    const loyaltyResult = await maybeAwardLoyaltyPointsForOrder(orderId, client);
    if (!loyaltyResult.ok) {
      console.warn("[LOYALTY TRACE]", {
        stage: "award failed",
        source: "updatePaymentStatusWithClient",
        orderId,
        message: loyaltyResult.message,
      });
    } else if (loyaltyResult.awarded) {
      console.info("[LOYALTY TRACE]", {
        stage: "award succeeded",
        source: "updatePaymentStatusWithClient",
        orderId,
        points: loyaltyResult.points,
      });
    }

    return {
      ok: true,
      data: order,
      loyaltyAward: {
        awarded: loyaltyResult.ok ? loyaltyResult.awarded : false,
        points: loyaltyResult.ok ? loyaltyResult.points : 0,
      },
    };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}
