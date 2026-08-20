import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/admin/activity-log";
import type { PaymentStatus } from "@/lib/admin/payments";
import { assertPaymentStatusTransition } from "@/lib/admin/payment-transitions";
import {
  computeCoveredRestaurantIds,
  loadOwnerSubscriptionContext,
  type OwnerSubscriptionDbRow,
} from "@/lib/subscriptions/owner-subscription";
import { normalizePlanId } from "@/lib/subscriptions/plans";

export const PAYMENT_METHOD_OPTIONS = [
  "manual",
  "bank_transfer",
  "cash",
  "card",
  "myfatoorah",
] as const;

export type PaymentMethodOption = (typeof PAYMENT_METHOD_OPTIONS)[number];

export type PaymentActor = {
  userId: string;
  email: string | null;
  name?: string | null;
  role?: string | null;
};

type PaymentRow = {
  id: string;
  restaurant_id: string;
  invoice_number: string | null;
  amount: number | string;
  currency: string;
  payment_method: string | null;
  status: PaymentStatus;
  paid_at: string | null;
  reference: string | null;
  notes: string | null;
  created_at: string;
  restaurants:
    | {
        owner_id: string;
        owner_name: string | null;
        email: string | null;
        restaurant_name: string | null;
      }
    | {
        owner_id: string;
        owner_name: string | null;
        email: string | null;
        restaurant_name: string | null;
      }[]
    | null;
};

function restaurantFromJoin(row: PaymentRow) {
  if (Array.isArray(row.restaurants)) return row.restaurants[0] ?? null;
  return row.restaurants;
}

function manualInvoiceNumber(): string {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MAN-${stamp}-${suffix}`;
}

/**
 * Activate covered restaurants when an owner subscription payment is marked paid.
 * Preserves existing renewal/expiry dates — only updates subscription status.
 */
export async function activateOwnerSubscriptionOnPayment(
  client: SupabaseClient,
  ownerId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const context = await loadOwnerSubscriptionContext(client, ownerId);
  if (!context?.canonical) {
    return { ok: false, message: "Owner subscription not found." };
  }

  const ownerPlan = normalizePlanId(context.canonical.plan);
  const coveredIds = computeCoveredRestaurantIds(
    context.restaurants,
    context.subscriptions,
    ownerPlan,
  );

  if (coveredIds.length === 0) {
    return { ok: false, message: "No covered restaurants for this owner." };
  }

  const subscriptionIds = context.subscriptions
    .filter((row) => coveredIds.includes(row.restaurant_id))
    .map((row) => row.id);

  if (subscriptionIds.length > 0) {
    const { error: subError } = await client
      .from("restaurant_subscriptions")
      .update({ status: "active", cancelled_at: null })
      .in("id", subscriptionIds);

    if (subError) {
      return { ok: false, message: subError.message };
    }
  }

  const { error: restaurantError } = await client
    .from("restaurants")
    .update({ is_active: true, is_archived: false })
    .in("id", coveredIds);

  if (restaurantError) {
    return { ok: false, message: restaurantError.message };
  }

  return { ok: true };
}

async function logPaymentActivity(
  client: SupabaseClient,
  action: string,
  payment: PaymentRow,
  actor: PaymentActor,
  oldValues: Record<string, unknown>,
  newValues: Record<string, unknown>,
  metadata?: Record<string, unknown>,
) {
  const restaurant = restaurantFromJoin(payment);
  void logActivity({
    action,
    actorId: actor.userId,
    actorEmail: actor.email,
    actorName: actor.name ?? null,
    actorRole: actor.role ?? "admin",
    ownerId: restaurant?.owner_id ?? null,
    restaurantId: payment.restaurant_id,
    restaurantName: restaurant?.restaurant_name ?? null,
    entityType: "payment",
    entityId: payment.id,
    oldValues,
    newValues,
    metadata,
    client,
  });
}

export async function updatePaymentAsAdmin(
  client: SupabaseClient,
  paymentId: string,
  params: {
    status?: PaymentStatus;
    paymentMethod?: string | null;
    reference?: string | null;
    notes?: string | null;
    paidAt?: string | null;
  },
  actor: PaymentActor,
): Promise<
  | { ok: true; data: { id: string; status: PaymentStatus; alreadyApplied: boolean } }
  | { ok: false; message: string }
> {
  const { data: row, error } = await client
    .from("payments")
    .select(
      "*, restaurants(owner_id, owner_name, email, restaurant_name)",
    )
    .eq("id", paymentId)
    .maybeSingle();

  if (error || !row) {
    return { ok: false, message: error?.message || "Payment not found." };
  }

  const payment = row as PaymentRow;
  const restaurant = restaurantFromJoin(payment);
  const currentStatus = payment.status;
  const nextStatus = params.status ?? currentStatus;

  const transitionError = assertPaymentStatusTransition(currentStatus, nextStatus);
  if (transitionError) {
    return { ok: false, message: transitionError };
  }

  if (currentStatus === nextStatus && params.status === undefined) {
    // Field-only update (reference, notes, method)
  } else if (currentStatus === nextStatus) {
    return {
      ok: true,
      data: { id: payment.id, status: currentStatus, alreadyApplied: true },
    };
  }

  const payload: Record<string, unknown> = {};
  if (params.status !== undefined) payload.status = nextStatus;
  if (params.paymentMethod !== undefined) {
    payload.payment_method = params.paymentMethod;
  }
  if (params.reference !== undefined) payload.reference = params.reference;
  if (params.notes !== undefined) payload.notes = params.notes;

  if (nextStatus === "paid") {
    payload.paid_at =
      params.paidAt?.trim() ||
      payment.paid_at ||
      new Date().toISOString();
  } else if (params.status !== undefined) {
    payload.paid_at = null;
  } else if (params.paidAt !== undefined) {
    payload.paid_at = params.paidAt;
  }

  const { data: updated, error: updateError } = await client
    .from("payments")
    .update(payload)
    .eq("id", paymentId)
    .eq("status", currentStatus)
    .select("id, status")
    .maybeSingle();

  if (updateError) {
    return { ok: false, message: updateError.message };
  }

  if (!updated) {
    const { data: latest } = await client
      .from("payments")
      .select("status")
      .eq("id", paymentId)
      .maybeSingle();
    const latestStatus = (latest as { status?: PaymentStatus } | null)?.status;
    if (latestStatus === nextStatus) {
      return {
        ok: true,
        data: { id: paymentId, status: nextStatus, alreadyApplied: true },
      };
    }
    return {
      ok: false,
      message: "Payment status changed elsewhere. Please refresh and try again.",
    };
  }

  if (nextStatus === "paid" && currentStatus !== "paid" && restaurant?.owner_id) {
    const activation = await activateOwnerSubscriptionOnPayment(
      client,
      restaurant.owner_id,
    );
    if (!activation.ok) {
      return activation;
    }
  }

  const action =
    params.status === undefined
      ? "payment_updated"
      : nextStatus === "refunded"
        ? "payment_refunded"
        : "payment_status_changed";

  await logPaymentActivity(
    client,
    action,
    payment,
    actor,
    {
      status: currentStatus,
      paymentMethod: payment.payment_method,
      reference: payment.reference,
      notes: payment.notes,
      paidAt: payment.paid_at,
    },
    {
      status: nextStatus,
      paymentMethod: params.paymentMethod ?? payment.payment_method,
      reference: params.reference ?? payment.reference,
      notes: params.notes ?? payment.notes,
      paidAt:
        (payload.paid_at as string | null | undefined) ?? payment.paid_at,
      amount: Number(payment.amount),
    },
    {
      ownerId: restaurant?.owner_id ?? null,
      invoiceNumber: payment.invoice_number,
    },
  );

  return {
    ok: true,
    data: {
      id: paymentId,
      status: nextStatus,
      alreadyApplied: false,
    },
  };
}

export async function createManualPaymentAsAdmin(
  client: SupabaseClient,
  params: {
    ownerId: string;
    amount: number;
    currency?: string;
    paymentMethod: string;
    status: PaymentStatus;
    paidAt?: string | null;
    reference?: string | null;
    notes?: string | null;
    paymentDate?: string | null;
  },
  actor: PaymentActor,
): Promise<
  | { ok: true; data: { id: string; status: PaymentStatus } }
  | { ok: false; message: string }
> {
  const context = await loadOwnerSubscriptionContext(client, params.ownerId);
  if (!context?.canonical) {
    return { ok: false, message: "Owner subscription not found." };
  }

  const billingRestaurantId = context.canonical.restaurant_id;
  const ownerPlan = normalizePlanId(context.canonical.plan);
  const coveredIds = computeCoveredRestaurantIds(
    context.restaurants,
    context.subscriptions,
    ownerPlan,
  );

  const createdAt = params.paymentDate
    ? new Date(params.paymentDate).toISOString()
    : undefined;

  const insertPayload: Record<string, unknown> = {
    restaurant_id: billingRestaurantId,
    amount: params.amount,
    currency: params.currency?.trim() || context.canonical.currency || "KWD",
    payment_method: params.paymentMethod,
    status: params.status,
    invoice_number: manualInvoiceNumber(),
    reference: params.reference?.trim() || null,
    notes: params.notes?.trim() || null,
    paid_at:
      params.status === "paid"
        ? params.paidAt?.trim() || new Date().toISOString()
        : null,
  };
  if (createdAt) insertPayload.created_at = createdAt;

  const { data, error } = await client
    .from("payments")
    .insert(insertPayload)
    .select("id, status, restaurant_id, amount, invoice_number")
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message || "Unable to create payment." };
  }

  const payment = data as {
    id: string;
    status: PaymentStatus;
    restaurant_id: string;
    amount: number | string;
    invoice_number: string | null;
  };

  if (params.status === "paid") {
    const activation = await activateOwnerSubscriptionOnPayment(
      client,
      params.ownerId,
    );
    if (!activation.ok) {
      return activation;
    }
  }

  const billingRestaurant = context.restaurants.find(
    (item) => item.id === billingRestaurantId,
  );

  await logPaymentActivity(
    client,
    "payment_created_manually",
    {
      id: payment.id,
      restaurant_id: payment.restaurant_id,
      invoice_number: payment.invoice_number,
      amount: payment.amount,
      currency: insertPayload.currency as string,
      payment_method: params.paymentMethod,
      status: payment.status,
      paid_at: (insertPayload.paid_at as string | null) ?? null,
      reference: (insertPayload.reference as string | null) ?? null,
      notes: (insertPayload.notes as string | null) ?? null,
      created_at: createdAt ?? new Date().toISOString(),
      restaurants: {
        owner_id: params.ownerId,
        owner_name: billingRestaurant?.restaurant_name ?? null,
        email: null,
        restaurant_name: billingRestaurant?.restaurant_name ?? null,
      },
    },
    actor,
    {},
    {
      status: payment.status,
      amount: Number(payment.amount),
      paymentMethod: params.paymentMethod,
      reference: params.reference ?? null,
      notes: params.notes ?? null,
      plan: ownerPlan,
      coveredRestaurantIds: coveredIds,
    },
    {
      ownerId: params.ownerId,
      invoiceNumber: payment.invoice_number,
      manualEntry: true,
    },
  );

  return { ok: true, data: { id: payment.id, status: payment.status } };
}

export function pickBillingRestaurantId(
  canonical: OwnerSubscriptionDbRow | null,
  restaurants: Array<{ id: string; created_at: string }>,
): string | null {
  if (canonical?.restaurant_id) return canonical.restaurant_id;
  const ordered = [...restaurants].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  return ordered[0]?.id ?? null;
}
