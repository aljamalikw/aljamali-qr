import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail, normalizePhone } from "@/lib/customers/sync-customer";
import { adjustLoyaltyPoints } from "@/lib/loyalty/mutations";
import { calculateLoyaltyPoints, parseLoyaltyEarningSettings } from "@/lib/loyalty/earning-rules";
import { supabase } from "@/lib/supabase";
import { planAllowsLoyalty } from "@/lib/subscriptions/plans";
import type { OrderRecord, OrderStatus, PaymentStatus } from "./types";

type OrderAwardRow = Pick<
  OrderRecord,
  | "id"
  | "restaurant_id"
  | "order_number"
  | "status"
  | "payment_status"
  | "customer_phone"
  | "customer_email"
  | "subtotal"
  | "discount_amount"
  | "grand_total"
> & {
  loyalty_points_awarded_at?: string | null;
  restaurants?:
    | {
        subscription_plan?: string | null;
        loyalty_earning_settings?: unknown;
      }
    | {
        subscription_plan?: string | null;
        loyalty_earning_settings?: unknown;
      }[]
    | null;
};

type CustomerAwardLookup = {
  id: string;
  loyalty_points: number;
  metadata: Record<string, unknown> | null;
};

function isOrderStatusEligibleForLoyalty(status: OrderStatus | string): boolean {
  return (
    status === "Accepted" ||
    status === "Preparing" ||
    status === "Ready" ||
    status === "Completed"
  );
}

function isPaymentStatusEligibleForLoyalty(
  paymentStatus: PaymentStatus | string,
): boolean {
  return paymentStatus === "Paid";
}

function extractRestaurant(
  value: OrderAwardRow["restaurants"],
): { subscription_plan?: string | null; loyalty_earning_settings?: unknown } | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function isCustomerEnrolled(metadata: Record<string, unknown> | null): boolean {
  const loyalty =
    metadata &&
    typeof metadata === "object" &&
    metadata.loyalty &&
    typeof metadata.loyalty === "object"
      ? (metadata.loyalty as Record<string, unknown>)
      : null;
  return loyalty?.enrolled === true;
}

async function lookupEligibleCustomerForOrder(
  client: SupabaseClient,
  order: OrderAwardRow,
): Promise<CustomerAwardLookup | null> {
  const phone = normalizePhone(order.customer_phone);
  const email = normalizeEmail(order.customer_email);
  if (!phone && !email) return null;

  let customer: CustomerAwardLookup | null = null;

  if (phone) {
    const { data } = await client
      .from("customers")
      .select("id, loyalty_points, metadata")
      .eq("restaurant_id", order.restaurant_id)
      .eq("phone", phone)
      .maybeSingle();
    customer = (data as CustomerAwardLookup | null) ?? null;
  }

  if (!customer && email) {
    const { data } = await client
      .from("customers")
      .select("id, loyalty_points, metadata")
      .eq("restaurant_id", order.restaurant_id)
      .ilike("email", email)
      .maybeSingle();
    customer = (data as CustomerAwardLookup | null) ?? null;
  }

  if (!customer || !isCustomerEnrolled(customer.metadata)) {
    return null;
  }

  return customer;
}

/**
 * Award loyalty points only once, and only after the order is both eligible
 * for processing and paid. Safe to call after any order/payment mutation.
 */
export async function maybeAwardLoyaltyPointsForOrder(
  orderId: string,
  client: SupabaseClient = supabase,
): Promise<
  | { ok: true; awarded: boolean; points: number }
  | { ok: false; message: string }
> {
  try {
    const { data, error } = await client
      .from("orders")
      .select(
        "id, restaurant_id, order_number, status, payment_status, customer_phone, customer_email, subtotal, discount_amount, grand_total, loyalty_points_awarded_at, restaurants(subscription_plan, loyalty_earning_settings)",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message || "Order not found." };
    }

    const order = data as OrderAwardRow;
    if (order.loyalty_points_awarded_at) {
      return { ok: true, awarded: false, points: 0 };
    }

    if (
      !isOrderStatusEligibleForLoyalty(order.status) ||
      !isPaymentStatusEligibleForLoyalty(order.payment_status)
    ) {
      return { ok: true, awarded: false, points: 0 };
    }

    const restaurant = extractRestaurant(order.restaurants);
    const { data: subscription } = await client
      .from("restaurant_subscriptions")
      .select("plan")
      .eq("restaurant_id", order.restaurant_id)
      .maybeSingle();
    const plan =
      typeof subscription?.plan === "string" && subscription.plan.trim()
        ? subscription.plan.trim()
        : (restaurant?.subscription_plan ?? "Starter");
    if (!planAllowsLoyalty(plan)) {
      return { ok: true, awarded: false, points: 0 };
    }

    const customer = await lookupEligibleCustomerForOrder(client, order);
    if (!customer) {
      return { ok: true, awarded: false, points: 0 };
    }

    const earningRules = parseLoyaltyEarningSettings(
      restaurant?.loyalty_earning_settings ?? null,
    );
    const points = calculateLoyaltyPoints({
      amounts: {
        subtotal: Number(order.subtotal ?? 0),
        discountAmount: Number(order.discount_amount ?? 0),
        grandTotal: Number(order.grand_total ?? 0),
      },
      rules: earningRules,
    });

    if (points <= 0) {
      return { ok: true, awarded: false, points: 0 };
    }

    const awardStamp = new Date().toISOString();
    const { data: claimed, error: claimError } = await client
      .from("orders")
      .update({ loyalty_points_awarded_at: awardStamp })
      .eq("id", order.id)
      .is("loyalty_points_awarded_at", null)
      .eq("payment_status", "Paid")
      .in("status", ["Accepted", "Preparing", "Ready", "Completed"])
      .select("id")
      .maybeSingle();

    if (claimError) {
      return {
        ok: false,
        message: claimError.message || "Unable to award loyalty points.",
      };
    }

    if (!claimed) {
      return { ok: true, awarded: false, points: 0 };
    }

    const award = await adjustLoyaltyPoints({
      restaurantId: order.restaurant_id,
      customerId: customer.id,
      delta: points,
      reason: `Order ${order.order_number}`,
      client,
    });

    if (!award.ok) {
      await client
        .from("orders")
        .update({ loyalty_points_awarded_at: null })
        .eq("id", order.id);
      return { ok: false, message: award.message };
    }

    return { ok: true, awarded: true, points };
  } catch {
    return { ok: false, message: "Unable to award loyalty points." };
  }
}
