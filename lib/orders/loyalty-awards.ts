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
};

type RestaurantAwardContext = {
  subscription_plan?: string | null;
  loyalty_earning_settings?: unknown;
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

function isMissingColumnError(
  error: { message?: string } | null | undefined,
  column: string,
): boolean {
  const message = error?.message ?? "";
  const pattern = new RegExp(column, "i");
  return pattern.test(message) && /column|schema cache/i.test(message);
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

async function loadRestaurantAwardContext(
  client: SupabaseClient,
  restaurantId: string,
): Promise<RestaurantAwardContext | null> {
  const { data, error } = await client
    .from("restaurants")
    .select("subscription_plan, loyalty_earning_settings")
    .eq("id", restaurantId)
    .maybeSingle();

  if (error) {
    if (isMissingColumnError(error, "loyalty_earning_settings")) {
      const { data: fallback } = await client
        .from("restaurants")
        .select("subscription_plan")
        .eq("id", restaurantId)
        .maybeSingle();
      return (fallback as RestaurantAwardContext | null) ?? null;
    }
    console.warn("[LOYALTY TRACE]", {
      stage: "award failed",
      reason: "earning_settings_load_failed",
      restaurantId,
      message: error.message,
    });
    return null;
  }

  return (data as RestaurantAwardContext | null) ?? null;
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

function traceEligibility(input: {
  reason: string;
  orderId: string;
  restaurantId: string;
  customerId: string | null;
  orderStatus: string;
  paymentStatus: string;
  isEnrolled: boolean;
  earningSettings: ReturnType<typeof parseLoyaltyEarningSettings> | null;
  eligibleAmount: number;
  calculatedPoints: number;
  alreadyAwarded: boolean;
  finalEligibilityDecision: boolean;
}) {
  console.info("[LOYALTY TRACE]", {
    stage: "eligibility result",
    ...input,
    earningSettings: input.earningSettings
      ? {
          pointsPerCurrencyUnit: input.earningSettings.pointsPerCurrencyUnit,
          minimumSpend: input.earningSettings.minimumSpend,
          calculationBasis: input.earningSettings.calculationBasis,
          maxPointsPerOrder: input.earningSettings.maxPointsPerOrder,
          isCustom: input.earningSettings.isCustom,
        }
      : null,
  });
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
    console.info("[LOYALTY TRACE]", {
      stage: "trigger entered",
      source: "maybeAwardLoyaltyPointsForOrder",
      orderId,
    });

    const { data, error } = await client
      .from("orders")
      .select(
        "id, restaurant_id, order_number, status, payment_status, customer_phone, customer_email, subtotal, discount_amount, grand_total, loyalty_points_awarded_at",
      )
      .eq("id", orderId)
      .maybeSingle();

    if (error || !data) {
      if (isMissingColumnError(error, "loyalty_points_awarded_at")) {
        console.warn("[LOYALTY TRACE]", {
          stage: "award failed",
          reason: "SKIP: missing orders.loyalty_points_awarded_at column",
          orderId,
          message: error?.message ?? "Missing loyalty award marker column.",
        });
        return {
          ok: false,
          message:
            "orders.loyalty_points_awarded_at is missing in the database. Apply supabase/production/order_loyalty_award_marker_missing.sql before loyalty points can be awarded.",
        };
      }
      console.warn("[LOYALTY TRACE]", {
        stage: "award failed",
        reason: "SKIP: order not found",
        orderId,
        message: error?.message ?? "Order not found.",
      });
      return { ok: false, message: error?.message || "Order not found." };
    }

    const order = data as OrderAwardRow;
    const restaurant = await loadRestaurantAwardContext(
      client,
      order.restaurant_id,
    );
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

    if (order.loyalty_points_awarded_at) {
      traceEligibility({
        reason: "SKIP: already awarded",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: null,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isEnrolled: false,
        earningSettings: earningRules,
        eligibleAmount,
        calculatedPoints: 0,
        alreadyAwarded: true,
        finalEligibilityDecision: false,
      });
      return { ok: true, awarded: false, points: 0 };
    }

    if (!isOrderStatusEligibleForLoyalty(order.status)) {
      traceEligibility({
        reason: "SKIP: order not accepted",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: null,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isEnrolled: false,
        earningSettings: earningRules,
        eligibleAmount,
        calculatedPoints: 0,
        alreadyAwarded: false,
        finalEligibilityDecision: false,
      });
      return { ok: true, awarded: false, points: 0 };
    }

    if (!isPaymentStatusEligibleForLoyalty(order.payment_status)) {
      traceEligibility({
        reason: "SKIP: payment not paid",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: null,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isEnrolled: false,
        earningSettings: earningRules,
        eligibleAmount,
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
      traceEligibility({
        reason: "SKIP: plan disallows loyalty",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: null,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isEnrolled: false,
        earningSettings: earningRules,
        eligibleAmount,
        calculatedPoints: 0,
        alreadyAwarded: false,
        finalEligibilityDecision: false,
      });
      return { ok: true, awarded: false, points: 0 };
    }

    const customer = await lookupEligibleCustomerForOrder(client, order);
    if (!customer) {
      traceEligibility({
        reason: "SKIP: customer not enrolled",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: null,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isEnrolled: false,
        earningSettings: earningRules,
        eligibleAmount,
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
      traceEligibility({
        reason: "SKIP: zero calculated points",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: customer.id,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isEnrolled: true,
        earningSettings: earningRules,
        eligibleAmount,
        calculatedPoints: points,
        alreadyAwarded: false,
        finalEligibilityDecision: false,
      });
      return { ok: true, awarded: false, points: 0 };
    }

    traceEligibility({
      reason: "eligible_for_award",
      orderId: order.id,
      restaurantId: order.restaurant_id,
      customerId: customer.id,
      orderStatus: String(order.status),
      paymentStatus: String(order.payment_status),
      isEnrolled: true,
      earningSettings: earningRules,
      eligibleAmount,
      calculatedPoints: points,
      alreadyAwarded: false,
      finalEligibilityDecision: true,
    });

    console.info("[LOYALTY TRACE]", {
      stage: "attempting award",
      orderId: order.id,
      restaurantId: order.restaurant_id,
      customerId: customer.id,
      calculatedPoints: points,
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
      console.warn("[LOYALTY TRACE]", {
        stage: "award failed",
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
      traceEligibility({
        reason: "SKIP: claim not acquired",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: customer.id,
        orderStatus: String(order.status),
        paymentStatus: String(order.payment_status),
        isEnrolled: true,
        earningSettings: earningRules,
        eligibleAmount,
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
      console.warn("[LOYALTY TRACE]", {
        stage: "award failed",
        reason: "customer_adjustment_failed",
        orderId: order.id,
        restaurantId: order.restaurant_id,
        customerId: customer.id,
        message: award.message,
      });
      return { ok: false, message: award.message };
    }

    console.info("[LOYALTY TRACE]", {
      stage: "award succeeded",
      orderId: order.id,
      restaurantId: order.restaurant_id,
      customerId: customer.id,
      orderStatus: String(order.status),
      paymentStatus: String(order.payment_status),
      isEnrolled: true,
      eligibleAmount,
      calculatedPoints: points,
      loyaltyPointsAfter: award.loyaltyPoints,
    });
    return { ok: true, awarded: true, points };
  } catch (error) {
    console.warn("[LOYALTY TRACE]", {
      stage: "award failed",
      reason: "unexpected_error",
      orderId,
      message:
        error instanceof Error ? error.message : "Unable to award loyalty points.",
    });
    return { ok: false, message: "Unable to award loyalty points." };
  }
}
