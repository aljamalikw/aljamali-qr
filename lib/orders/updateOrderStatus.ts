import { supabase } from "@/lib/supabase";
import { mapOrderRow } from "./mappers";
import type { Order, OrderRecord, OrderStatus, PaymentStatus } from "./types";

const UPDATE_ERROR = "Unable to update the order. Please try again.";

type MutationPayload = {
  orderId: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
};

async function callOrderMutationApi(
  path: "/api/orders/update-status" | "/api/orders/update-payment",
  payload: MutationPayload,
): Promise<
  | {
      ok: true;
      data: Order;
      loyaltyAward?: { awarded: boolean; points: number };
    }
  | { ok: false; message: string }
> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const accessToken = session?.access_token;
  if (!accessToken) {
    console.warn("[LOYALTY TRACE]", {
      stage: "award failed",
      reason: "SKIP: missing authenticated session for order mutation",
      orderId: payload.orderId,
    });
    return { ok: false, message: "Your session expired. Please sign in again." };
  }

  const body =
    path === "/api/orders/update-status"
      ? { orderId: payload.orderId, status: payload.status }
      : { orderId: payload.orderId, paymentStatus: payload.paymentStatus };

  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  let result: {
    ok?: boolean;
    data?: Order;
    error?: string;
    loyaltyAward?: { awarded: boolean; points: number };
  } = {};

  try {
    result = (await response.json()) as typeof result;
  } catch {
    return { ok: false, message: UPDATE_ERROR };
  }

  if (!response.ok || !result.ok || !result.data) {
    console.warn("[LOYALTY TRACE]", {
      stage: "award failed",
      reason: "order mutation API failed",
      orderId: payload.orderId,
      status: response.status,
      message: result.error ?? UPDATE_ERROR,
    });
    return { ok: false, message: result.error || UPDATE_ERROR };
  }

  if (result.loyaltyAward?.awarded) {
    console.info("[LOYALTY TRACE]", {
      stage: "award succeeded",
      source: "client_mutation_response",
      orderId: payload.orderId,
      points: result.loyaltyAward.points,
    });
  }

  return {
    ok: true,
    data: result.data,
    loyaltyAward: result.loyaltyAward,
  };
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus,
): Promise<{ ok: true; data: Order } | { ok: false; message: string }> {
  const result = await callOrderMutationApi("/api/orders/update-status", {
    orderId,
    status,
  });
  if (!result.ok) return result;
  return { ok: true, data: result.data };
}

export async function updatePaymentStatus(
  orderId: string,
  paymentStatus: PaymentStatus,
): Promise<{ ok: true; data: Order } | { ok: false; message: string }> {
  const result = await callOrderMutationApi("/api/orders/update-payment", {
    orderId,
    paymentStatus,
  });
  if (!result.ok) return result;
  return { ok: true, data: result.data };
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
