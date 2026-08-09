/**
 * Canonical subscription plan catalog — single source of truth for pricing
 * and presentation across landing, billing, admin, payments, and emails.
 */

export type SubscriptionPlanId = "Starter" | "Professional" | "Enterprise";

export type PlanCatalogEntry = {
  id: "starter" | "professional" | "enterprise";
  name: SubscriptionPlanId;
  /** Monthly price in KWD. Null = Contact Us (not payable online). */
  monthly: number | null;
  /** Yearly price in KWD (10× monthly when payable). Null = Contact Us. */
  yearly: number | null;
  currency: "KWD";
  contactSales: boolean;
  subtitle: string;
  description: string;
  badge: string | null;
  highlighted: boolean;
  ctaLabel: string;
  ctaHref: string;
};

export const PLAN_CURRENCY = "KWD" as const;
/** Display label matching Landing (`8 KWD / month`). */
export const PLAN_CURRENCY_LABEL = "KWD" as const;

export const SUBSCRIPTION_PLAN_ORDER: SubscriptionPlanId[] = [
  "Starter",
  "Professional",
  "Enterprise",
];

/** Payable plans only (Enterprise is sales-led). */
export const PAYABLE_PLANS: Array<"Starter" | "Professional"> = [
  "Starter",
  "Professional",
];

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, PlanCatalogEntry> = {
  Starter: {
    id: "starter",
    name: "Starter",
    monthly: 8,
    yearly: 80,
    currency: "KWD",
    contactSales: false,
    subtitle: "Perfect for cafés & small restaurants",
    description: "Everything you need to digitize your menu.",
    badge: "Best Value",
    highlighted: false,
    ctaLabel: "Start Free Trial",
    ctaHref: "/register",
  },
  Professional: {
    id: "professional",
    name: "Professional",
    monthly: 15,
    yearly: 150,
    currency: "KWD",
    contactSales: false,
    subtitle: "Best for growing restaurants & multiple branches",
    description: "Advanced tools to increase sales and automate operations.",
    badge: "Most Popular",
    highlighted: true,
    ctaLabel: "Start Free Trial",
    ctaHref: "/register",
  },
  Enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthly: null,
    yearly: null,
    currency: "KWD",
    contactSales: true,
    subtitle: "Built for restaurant chains",
    description:
      "Tailored solutions with dedicated support and custom integrations.",
    badge: "Custom Solution",
    highlighted: false,
    ctaLabel: "Contact Sales",
    ctaHref: "#contact",
  },
};

export function isSubscriptionPlanId(value: string): value is SubscriptionPlanId {
  return (
    value === "Starter" || value === "Professional" || value === "Enterprise"
  );
}

export function isPayablePlan(
  value: string,
): value is "Starter" | "Professional" {
  return value === "Starter" || value === "Professional";
}

/** Capability flags resolved from a subscription plan. */
export type PlanFeatures = {
  onlineOrdering: boolean;
  /** Use Number.POSITIVE_INFINITY for unlimited. */
  maxRestaurants: number;
};

/**
 * Canonical plan capability table — single source for feature gates
 * (online ordering, restaurant limits). Prefer helpers below over
 * comparing plan name strings in feature code.
 */
export const PLAN_FEATURES: Record<SubscriptionPlanId, PlanFeatures> = {
  Starter: {
    onlineOrdering: false,
    maxRestaurants: 1,
  },
  Professional: {
    onlineOrdering: true,
    maxRestaurants: Number.POSITIVE_INFINITY,
  },
  Enterprise: {
    onlineOrdering: true,
    maxRestaurants: Number.POSITIVE_INFINITY,
  },
};

/** Normalize unknown plan strings to a catalog id (default Starter). */
export function normalizePlanId(
  plan: string | null | undefined,
): SubscriptionPlanId {
  const normalized = typeof plan === "string" ? plan.trim() : "";
  return isSubscriptionPlanId(normalized) ? normalized : "Starter";
}

export function getPlanFeatures(
  plan: string | null | undefined,
): PlanFeatures {
  return PLAN_FEATURES[normalizePlanId(plan)];
}

export function getMaxRestaurants(plan: string | null | undefined): number {
  return getPlanFeatures(plan).maxRestaurants;
}

/**
 * Online ordering features (public cart, Orders, Kitchen Display).
 * Driven by PLAN_FEATURES — not ad-hoc plan name checks.
 */
export function planAllowsOnlineOrdering(
  plan: string | null | undefined,
): boolean {
  return getPlanFeatures(plan).onlineOrdering;
}

/** Whether the account may create another restaurant under this plan. */
export function canCreateRestaurant(
  plan: string | null | undefined,
  restaurantCount: number,
): boolean {
  const count = Number.isFinite(restaurantCount)
    ? Math.max(0, Math.floor(restaurantCount))
    : 0;
  return count < getMaxRestaurants(plan);
}

/**
 * Billing / UI usage label, e.g. "1 / 1 used" or "2 / Unlimited".
 */
export function formatRestaurantUsage(
  plan: string | null | undefined,
  restaurantCount: number,
): string {
  const count = Number.isFinite(restaurantCount)
    ? Math.max(0, Math.floor(restaurantCount))
    : 0;
  const max = getMaxRestaurants(plan);
  if (!Number.isFinite(max)) {
    return `${count} / Unlimited`;
  }
  return `${count} / ${max} used`;
}

export const STARTER_RESTAURANT_LIMIT_MESSAGE =
  "Your current plan allows only one restaurant. Upgrade to Professional to create additional restaurants.";

export function getPlanMonthlyAmount(
  plan: SubscriptionPlanId,
): number | null {
  return SUBSCRIPTION_PLANS[plan].monthly;
}

/** Display helper matching Landing: "8 KWD / month" | "Contact Us" */
export function formatPlanPriceLabel(
  plan: SubscriptionPlanId,
  cycle: "monthly" | "yearly" = "monthly",
): string {
  const entry = SUBSCRIPTION_PLANS[plan];
  if (entry.contactSales || entry.monthly == null) {
    return "Contact Us";
  }
  const amount = cycle === "yearly" ? entry.yearly : entry.monthly;
  if (amount == null) return "Contact Us";
  return `${amount} ${PLAN_CURRENCY_LABEL} / ${cycle === "yearly" ? "year" : "month"}`;
}

/** Compact amount for CTAs (e.g. "8 KWD"). */
export function formatPlanAmountKd(plan: SubscriptionPlanId): string {
  const entry = SUBSCRIPTION_PLANS[plan];
  if (entry.contactSales || entry.monthly == null) {
    return "Contact Us";
  }
  return `${entry.monthly} ${PLAN_CURRENCY_LABEL}`;
}

/**
 * Numeric monthly map for DB/payment helpers.
 * Enterprise uses 0 (not payable) — never charge this online.
 */
export function getDefaultMonthlyPriceMap(): Record<SubscriptionPlanId, number> {
  return {
    Starter: SUBSCRIPTION_PLANS.Starter.monthly ?? 0,
    Professional: SUBSCRIPTION_PLANS.Professional.monthly ?? 0,
    Enterprise: 0,
  };
}

export function getDefaultPlanPriceConfig(): Record<
  SubscriptionPlanId,
  { monthly: number; yearly: number }
> {
  return {
    Starter: {
      monthly: SUBSCRIPTION_PLANS.Starter.monthly ?? 0,
      yearly: SUBSCRIPTION_PLANS.Starter.yearly ?? 0,
    },
    Professional: {
      monthly: SUBSCRIPTION_PLANS.Professional.monthly ?? 0,
      yearly: SUBSCRIPTION_PLANS.Professional.yearly ?? 0,
    },
    Enterprise: { monthly: 0, yearly: 0 },
  };
}
