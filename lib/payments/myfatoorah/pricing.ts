import type { SupabaseClient } from "@supabase/supabase-js";
import {
  getPlanMonthlyAmount,
  isPayablePlan,
  PLAN_CURRENCY,
  type SubscriptionPlanId,
} from "@/lib/subscriptions/plans";
import type { PricedPlan } from "@/lib/subscriptions/pricing";

const PLAN_KEYS: PricedPlan[] = ["Starter", "Professional", "Enterprise"];

export function isPricedPlan(value: string): value is PricedPlan {
  return (PLAN_KEYS as readonly string[]).includes(value);
}

/**
 * Resolve payable plan amount from the canonical catalog
 * (`lib/subscriptions/plans.ts`). DB platform_settings are not used for
 * charge amounts so renew/upgrade never drift from the shared config.
 */
export async function getPlanMonthlyPriceFromDb(
  _supabase: SupabaseClient,
  plan: PricedPlan,
): Promise<
  { ok: true; amount: number; currency: string } | { ok: false; message: string }
> {
  if (!isPayablePlan(plan)) {
    return {
      ok: false,
      message: "Enterprise is not available for online payment.",
    };
  }

  const amount = getPlanMonthlyAmount(plan as SubscriptionPlanId);
  if (amount == null || !Number.isFinite(amount) || amount <= 0) {
    return {
      ok: false,
      message: `Invalid monthly price for plan: ${plan}`,
    };
  }

  return { ok: true, amount, currency: PLAN_CURRENCY };
}
