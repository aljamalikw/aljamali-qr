import { supabase } from "@/lib/supabase";
import { mapOrderRow } from "./mappers";
import type { Order, OrderRecord, OrderStatus, PaymentStatus } from "./types";

const UPDATE_ERROR = "Unable to update the order. Please try again.";

const STATUS_TIMESTAMP_FIELD: Partial<Record<OrderStatus, string>> = {
  Accepted: "accepted_at",
  Preparing: "preparing_at",
  Ready: "ready_at",
  Completed: "completed_at",
  Cancelled: "cancelled_at",
};

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ ok: true; data: Order } | { ok: false; message: string }> {
  try {
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

    return { ok: true, data: mapOrderRow(data as OrderRecord) };
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

    return { ok: true, data: mapOrderRow(data as OrderRecord) };
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

    return { ok: true, data: mapOrderRow(data as OrderRecord) };
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }
}
