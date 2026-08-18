import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeEmail, normalizePhone } from "@/lib/customers/sync-customer";
import { adjustLoyaltyPoints } from "@/lib/loyalty/mutations";
import {
  calculateLoyaltyPoints,
  parseLoyaltyEarningSettings,
  resolveEligibleOrderAmount,
} from "@/lib/loyalty/earning-rules";
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

function logLoyaltyAwardCheck(input: {
  reason: string;
  orderId: string;
  restaurantId: string;
  customerId: string | null;
  orderStatus: string;
  paymentStatus: string;
  isLoyaltyEnrolled: boolean;
  eligibleAmount: number;
  pointsPerCurrencyUnit: number;
  calculatedPoints: number;
  alreadyAwarded: boolean;
  finalEligibilityDecision: boolean;
}) {
  console.info("[LOYALTY AWARD CHECK]", input);
}

function isMissingAwardMarkerColumnError(
  error: { message?: string } | null | undefined,
): boolean {
  const message = error?.message ?? "";
  return /loyalty_points_awarded_at/i.test(message) && /column|schema cache/i.test(message);
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
    console.info("[LOYALTY AWARD TRIGGER]", {
      orderId,
      stage: "entered",
    });

    const { data, error } = await client
      .from("orders")
      .select(
        "id, restaurant_id, order_number, status, payment_status, customer_phone, customer_email, subtotal, discount_amount, grand_total, loyalty_points_awarded_at, restaurants(subscription_plan, loyalty_earning_settings)",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) {
      if (isMissingAwardMarkerColumnError(error)) {
        console.warn("[LOYALTY AWARD CHECK]", {
          reason: "missing_award_marker_column",
          orderId,
          message: error?.message ?? "Missing loyalty award marker column.",
        });
        return {
          ok: false,
          message:
            "orders.loyalty_points_awarded_at is missing in the database. Apply supabase/production/order_loyalty_award_marker_missing.sql before loyalty points can be awarded.",
        };
      }
      console.warn("[LOYALTY AWARD CHECK]", {
        reason: "order_not_found",
        orderId,
        message: error?.message ?? "Order not found.",
      });
      return { ok: false, message: error?.message || "Order not found." };
    }

    const order = data as OrderAwardRow;
    if (order.loyalty_points_awarded_at) {
      logLoyaltyAwardCheck({
        reason: "already_awarded",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: null,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isLoyaltyEnrolled: false,
        eligibleAmount: 0,
        pointsPerCurrencyUnit: 0,
        calculatedPoints: 0,
        alreadyAwarded: true,
        finalEligibilityDecision: false,
      });
      return { ok: true, awarded: false, points: 0 };
    }

    const restaurant = extractRestaurant(order.restaurants);
    const earningRules = parseLoyaltyEarningSettings(
      restaurant?.loyalty_earning_settings ?? null,
    );
    const eligibleAmount = resolveEligibleOrderAmount(
      {
        subtotal: Number(order.subtotal ?? 0),
        discountAmount: Number(order.discount_amount ?? 0),
        grandTotal: Number(order.grand_total ?? 0),
      },
      earningRules.calculationBasis,
    );

    if (
      !isOrderStatusEligibleForLoyalty(order.status) ||
      !isPaymentStatusEligibleForLoyalty(order.payment_status)
    ) {
      logLoyaltyAwardCheck({
        reason: !isOrderStatusEligibleForLoyalty(order.status)
          ? "ineligible_order_status"
          : "ineligible_payment_status",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: null,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isLoyaltyEnrolled: false,
        eligibleAmount,
        pointsPerCurrencyUnit: earningRules.pointsPerCurrencyUnit,
        calculatedPoints: 0,
        alreadyAwarded: false,
        finalEligibilityDecision: false,
      });
      return { ok: true, awarded: false, points: 0 };
    }

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
      logLoyaltyAwardCheck({
        reason: "plan_disallows_loyalty",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: null,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isLoyaltyEnrolled: false,
        eligibleAmount,
        pointsPerCurrencyUnit: earningRules.pointsPerCurrencyUnit,
        calculatedPoints: 0,
        alreadyAwarded: false,
        finalEligibilityDecision: false,
      });
      return { ok: true, awarded: false, points: 0 };
    }

    const customer = await lookupEligibleCustomerForOrder(client, order);
    if (!customer) {
      logLoyaltyAwardCheck({
        reason: "missing_customer_or_not_enrolled",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: null,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isLoyaltyEnrolled: false,
        eligibleAmount,
        pointsPerCurrencyUnit: earningRules.pointsPerCurrencyUnit,
        calculatedPoints: 0,
        alreadyAwarded: false,
        finalEligibilityDecision: false,
      });
      return { ok: true, awarded: false, points: 0 };
    }

    const points = calculateLoyaltyPoints({
      amounts: {
        subtotal: Number(order.subtotal ?? 0),
        discountAmount: Number(order.discount_amount ?? 0),
        grandTotal: Number(order.grand_total ?? 0),
      },
      rules: earningRules,
    });

    if (points <= 0) {
      logLoyaltyAwardCheck({
        reason: "calculated_zero_points",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: customer.id,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isLoyaltyEnrolled: true,
        eligibleAmount,
        pointsPerCurrencyUnit: earningRules.pointsPerCurrencyUnit,
        calculatedPoints: points,
        alreadyAwarded: false,
        finalEligibilityDecision: false,
      });
      return { ok: true, awarded: false, points: 0 };
    }

    logLoyaltyAwardCheck({
      reason: "eligible_for_award",
      orderId: order.id,
      restaurantId: order.restaurant_id,
      customerId: customer.id,
      orderStatus: String(order.status),
      paymentStatus: String(order.payment_status),
      isLoyaltyEnrolled: true,
      eligibleAmount,
      pointsPerCurrencyUnit: earningRules.pointsPerCurrencyUnit,
      calculatedPoints: points,
      alreadyAwarded: false,
      finalEligibilityDecision: true,
    });

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
      console.warn("[LOYALTY AWARD CHECK]", {
        reason: "claim_failed",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: customer.id,
        message: claimError.message || "Unable to award loyalty points.",
      });
      return {
        ok: false,
        message: claimError.message || "Unable to award loyalty points.",
      };
    }

    if (!claimed) {
      logLoyaltyAwardCheck({
        reason: "claim_not_acquired",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: customer.id,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isLoyaltyEnrolled: true,
        eligibleAmount,
        pointsPerCurrencyUnit: earningRules.pointsPerCurrencyUnit,
        calculatedPoints: points,
        alreadyAwarded: false,
        finalEligibilityDecision: false,
      });
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
      console.warn("[LOYALTY AWARD CHECK]", {
        reason: "customer_adjustment_failed",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: customer.id,
        message: award.message,
      });
      return { ok: false, message: award.message };
    }

    logLoyaltyAwardCheck({
      reason: "awarded",
      orderId: order.id,
      restaurantId: order.restaurant_id,
      customerId: customer.id,
      orderStatus: String(order.status),
      paymentStatus: String(order.payment_status),
      isLoyaltyEnrolled: true,
      eligibleAmount,
      pointsPerCurrencyUnit: earningRules.pointsPerCurrencyUnit,
      calculatedPoints: points,
      alreadyAwarded: false,
      finalEligibilityDecision: true,
    });
    return { ok: true, awarded: true, points };
  } catch (error) {
    console.warn("[LOYALTY AWARD CHECK]", {
      reason: "unexpected_error",
      orderId,
      message:
        error instanceof Error ? error.message : "Unable to award loyalty points.",
    });
    return { ok: false, message: "Unable to award loyalty points." };
  }
}
