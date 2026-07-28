import type { SupabaseClient } from "@supabase/supabase-js";
import type { PricedPlan } from "@/lib/subscriptions/pricing";

const PLATFORM_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

const PLAN_KEYS: PricedPlan[] = ["Starter", "Professional", "Enterprise"];

export function isPricedPlan(value: string): value is PricedPlan {
  return (PLAN_KEYS as readonly string[]).includes(value);
}

/**
 * Load a plan's monthly price from platform_settings.
 * Does not fall back to hardcoded defaults — fails if pricing is unavailable.
 */
export async function getPlanMonthlyPriceFromDb(
  supabase: SupabaseClient,
  plan: PricedPlan,
): Promise<{ ok: true; amount: number; currency: string } | { ok: false; message: string }> {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("subscription_plan_prices, currency")
    .eq("id", PLATFORM_SETTINGS_ID)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message || "Unable to load plan pricing." };
  }

  if (!data) {
    return { ok: false, message: "Platform pricing settings not found." };
  }

  const raw = (data as { subscription_plan_prices?: unknown }).subscription_plan_prices;
  if (!raw || typeof raw !== "object") {
    return { ok: false, message: "Plan pricing is not configured." };
  }

  const entry = (raw as Record<string, unknown>)[plan];
  if (!entry || typeof entry !== "object") {
    return { ok: false, message: `No price configured for plan: ${plan}` };
  }

  const monthly = Number((entry as { monthly?: unknown }).monthly);
  if (!Number.isFinite(monthly) || monthly <= 0) {
    return {
      ok: false,
      message: `Invalid monthly price for plan: ${plan}`,
    };
  }

  const currency =
    ((data as { currency?: string | null }).currency || "KWD").trim() || "KWD";

  return { ok: true, amount: monthly, currency };
}
