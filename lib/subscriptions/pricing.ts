import { supabase } from "@/lib/supabase";
import {
  getDefaultMonthlyPriceMap,
  getDefaultPlanPriceConfig,
  isPayablePlan,
  type SubscriptionPlanId,
} from "@/lib/subscriptions/plans";

const PLATFORM_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export type PricedPlan = SubscriptionPlanId;

export type PlanPriceConfig = {
  monthly: number;
  yearly: number;
};

export type SubscriptionPlanPrices = Record<PricedPlan, PlanPriceConfig>;

const PLAN_KEYS: PricedPlan[] = ["Starter", "Professional", "Enterprise"];

/** Fallback prices when platform_settings is unavailable — from shared catalog. */
export const DEFAULT_PLAN_PRICES: SubscriptionPlanPrices =
  getDefaultPlanPriceConfig();

/** Sync fallback monthly prices. Prefer getPlanMonthlyPrices(). */
export const PLAN_PRICES: Record<PricedPlan, number> =
  getDefaultMonthlyPriceMap();

function normalizePrices(raw: unknown): SubscriptionPlanPrices {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const result = { ...DEFAULT_PLAN_PRICES };

  for (const plan of PLAN_KEYS) {
    const entry = source[plan];
    if (!entry || typeof entry !== "object") continue;
    const monthly = Number((entry as { monthly?: unknown }).monthly);
    const yearly = Number((entry as { yearly?: unknown }).yearly);

    // Never accept unknown/legacy payable prices for Enterprise.
    if (plan === "Enterprise") {
      result.Enterprise = { monthly: 0, yearly: 0 };
      continue;
    }

    // Remap known legacy prices (19/49/99) to the catalog.
    const legacyMonthly =
      monthly === 19 || monthly === 49 || monthly === 99;
    const legacyYearly =
      yearly === 190 || yearly === 490 || yearly === 990;

    result[plan] = {
      monthly:
        Number.isFinite(monthly) && monthly > 0 && !legacyMonthly
          ? monthly
          : DEFAULT_PLAN_PRICES[plan].monthly,
      yearly:
        Number.isFinite(yearly) && yearly > 0 && !legacyYearly
          ? yearly
          : DEFAULT_PLAN_PRICES[plan].yearly,
    };
  }

  return result;
}

export async function fetchSubscriptionPlanPrices(): Promise<
  { ok: true; data: SubscriptionPlanPrices } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("subscription_plan_prices")
      .eq("id", PLATFORM_SETTINGS_ID)
      .maybeSingle();

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      data: normalizePrices(
        (data as { subscription_plan_prices?: unknown } | null)
          ?.subscription_plan_prices,
      ),
    };
  } catch {
    return { ok: false, message: "Unable to load plan prices." };
  }
}

/**
 * Always returns the canonical catalog amounts.
 * UI / renew / upgrade / payments must not drift from lib/subscriptions/plans.ts.
 */
export async function getPlanMonthlyPrices(): Promise<
  Record<PricedPlan, number>
> {
  return { ...PLAN_PRICES };
}

/** Sync accessor — same catalog as getPlanMonthlyPrices(). */
export function getCatalogMonthlyPrices(): Record<PricedPlan, number> {
  return { ...PLAN_PRICES };
}

export function pricesToJson(prices: SubscriptionPlanPrices): Record<
  string,
  { monthly: number; yearly: number }
> {
  return {
    Starter: prices.Starter,
    Professional: prices.Professional,
    Enterprise: { monthly: 0, yearly: 0 },
  };
}

export { isPayablePlan };
