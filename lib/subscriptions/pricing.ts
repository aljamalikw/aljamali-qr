import { supabase } from "@/lib/supabase";

const PLATFORM_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export type PricedPlan = "Starter" | "Professional" | "Enterprise";

export type PlanPriceConfig = {
  monthly: number;
  yearly: number;
};

export type SubscriptionPlanPrices = Record<PricedPlan, PlanPriceConfig>;

const PLAN_KEYS: PricedPlan[] = ["Starter", "Professional", "Enterprise"];

/** Fallback prices when platform_settings is unavailable. */
export const DEFAULT_PLAN_PRICES: SubscriptionPlanPrices = {
  Starter: { monthly: 19, yearly: 190 },
  Professional: { monthly: 49, yearly: 490 },
  Enterprise: { monthly: 99, yearly: 990 },
};

/** Sync fallback monthly prices. Prefer getPlanMonthlyPrices(). */
export const PLAN_PRICES: Record<PricedPlan, number> = {
  Starter: DEFAULT_PLAN_PRICES.Starter.monthly,
  Professional: DEFAULT_PLAN_PRICES.Professional.monthly,
  Enterprise: DEFAULT_PLAN_PRICES.Enterprise.monthly,
};

function normalizePrices(raw: unknown): SubscriptionPlanPrices {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};

  const result = { ...DEFAULT_PLAN_PRICES };

  for (const plan of PLAN_KEYS) {
    const entry = source[plan];
    if (!entry || typeof entry !== "object") continue;
    const monthly = Number((entry as { monthly?: unknown }).monthly);
    const yearly = Number((entry as { yearly?: unknown }).yearly);
    result[plan] = {
      monthly: Number.isFinite(monthly)
        ? monthly
        : DEFAULT_PLAN_PRICES[plan].monthly,
      yearly: Number.isFinite(yearly)
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

export async function getPlanMonthlyPrices(): Promise<
  Record<PricedPlan, number>
> {
  const result = await fetchSubscriptionPlanPrices();
  const prices = result.ok ? result.data : DEFAULT_PLAN_PRICES;
  return {
    Starter: prices.Starter.monthly,
    Professional: prices.Professional.monthly,
    Enterprise: prices.Enterprise.monthly,
  };
}

export function pricesToJson(prices: SubscriptionPlanPrices): Record<
  string,
  { monthly: number; yearly: number }
> {
  return {
    Starter: prices.Starter,
    Professional: prices.Professional,
    Enterprise: prices.Enterprise,
  };
}
