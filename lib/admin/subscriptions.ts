import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/utils/csv";
import {
  DEFAULT_GRACE_PERIOD_DAYS,
  resolveEffectiveStatus,
  trialWindowIso,
} from "@/lib/subscriptions/engine";
import { getPlanMonthlyPrices, PLAN_PRICES } from "@/lib/subscriptions/pricing";

export const SUBSCRIPTION_PLANS = [
  "Starter",
  "Professional",
  "Enterprise",
] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const SUBSCRIPTION_STATUSES = [
  "trial",
  "active",
  "grace",
  "suspended",
  "expired",
  "cancelled",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type RestaurantSubscription = {
  id: string;
  restaurantId: string;
  restaurantName: string | null;
  restaurantEmail: string | null;
  ownerId: string;
  ownerName: string | null;
  plan: SubscriptionPlan;
  monthlyPrice: number;
  currency: string;
  status: SubscriptionStatus;
  renewalDate: string | null;
  startedAt: string;
  cancelledAt: string | null;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  gracePeriodDays: number;
  createdAt: string;
  updatedAt: string;
  isActiveRestaurant: boolean;
};

export type OwnerRestaurantSummary = {
  restaurantId: string;
  restaurantName: string | null;
  subscriptionId: string | null;
};

/** One admin-list row per owner account (multi-restaurant aware). */
export type OwnerSubscriptionAccount = {
  ownerId: string;
  ownerName: string | null;
  ownerEmail: string | null;
  plan: SubscriptionPlan;
  monthlyPrice: number;
  currency: string;
  status: SubscriptionStatus;
  renewalDate: string | null;
  restaurantCount: number;
  restaurants: OwnerRestaurantSummary[];
  primarySubscriptionId: string;
  primaryRestaurantId: string;
  subscriptionIds: string[];
  restaurantIds: string[];
};

/** @deprecated Prefer getPlanMonthlyPrices() from lib/subscriptions/pricing */
export { PLAN_PRICES };

type SubscriptionRow = {
  id: string;
  restaurant_id: string;
  plan: SubscriptionPlan;
  monthly_price: number | string;
  currency: string;
  status: SubscriptionStatus;
  renewal_date: string | null;
  started_at: string;
  cancelled_at: string | null;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  grace_period_days?: number | null;
  created_at: string;
  updated_at: string;
  restaurants:
    | {
        owner_id: string;
        owner_name: string | null;
        restaurant_name: string | null;
        email: string | null;
        is_active: boolean | null;
      }
    | {
        owner_id: string;
        owner_name: string | null;
        restaurant_name: string | null;
        email: string | null;
        is_active: boolean | null;
      }[]
    | null;
};

const ERROR = "Unable to load subscriptions. Please try again.";
const SELECT_WITH_RESTAURANT =
  "*, restaurants(owner_id, owner_name, restaurant_name, email, is_active)";

const PLAN_RANK: Record<SubscriptionPlan, number> = {
  Starter: 1,
  Professional: 2,
  Enterprise: 3,
};

function restaurantFromJoin(row: SubscriptionRow) {
  if (Array.isArray(row.restaurants)) return row.restaurants[0] ?? null;
  return row.restaurants;
}

function mapRow(row: SubscriptionRow): RestaurantSubscription {
  const restaurant = restaurantFromJoin(row);
  const effectiveStatus = resolveEffectiveStatus({
    plan: row.plan,
    status: row.status,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    gracePeriodDays: row.grace_period_days,
    renewalDate: row.renewal_date,
    cancelledAt: row.cancelled_at,
  });

  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: restaurant?.restaurant_name ?? null,
    restaurantEmail: restaurant?.email ?? null,
    ownerId: restaurant?.owner_id ?? "",
    ownerName: restaurant?.owner_name ?? null,
    plan: row.plan,
    monthlyPrice: Number(row.monthly_price ?? 0),
    currency: row.currency || "KWD",
    status: effectiveStatus,
    renewalDate: row.renewal_date,
    startedAt: row.started_at,
    cancelledAt: row.cancelled_at,
    trialStartedAt: row.trial_started_at ?? null,
    trialEndsAt: row.trial_ends_at ?? null,
    gracePeriodDays:
      typeof row.grace_period_days === "number"
        ? row.grace_period_days
        : DEFAULT_GRACE_PERIOD_DAYS,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isActiveRestaurant: Boolean(restaurant?.is_active ?? true),
  };
}

async function syncStoredStatus(row: SubscriptionRow): Promise<SubscriptionRow> {
  const effective = resolveEffectiveStatus({
    plan: row.plan,
    status: row.status,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    gracePeriodDays: row.grace_period_days,
    renewalDate: row.renewal_date,
    cancelledAt: row.cancelled_at,
  });

  if (effective === row.status) return row;

  const payload: Record<string, unknown> = { status: effective };
  if (effective === "cancelled") {
    payload.cancelled_at = row.cancelled_at ?? new Date().toISOString();
  } else if (row.status === "cancelled") {
    // Do not auto-unsync cancelled via date logic — resolveEffectiveStatus
    // already keeps cancelled sticky.
  } else {
    payload.cancelled_at = null;
  }

  const { data } = await supabase
    .from("restaurant_subscriptions")
    .update(payload)
    .eq("id", row.id)
    .select(SELECT_WITH_RESTAURANT)
    .maybeSingle();

  return (data as SubscriptionRow | null) ?? { ...row, status: effective };
}

export async function fetchSubscriptions(): Promise<
  { ok: true; data: RestaurantSubscription[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("restaurant_subscriptions")
      .select(SELECT_WITH_RESTAURANT)
      .order("updated_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };

    const rows = (data ?? []) as SubscriptionRow[];
    const synced = await Promise.all(rows.map((row) => syncStoredStatus(row)));
    return { ok: true, data: synced.map(mapRow).filter((row) => Boolean(row.ownerId)) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

function pickPrimarySubscription(
  subscriptions: RestaurantSubscription[],
): RestaurantSubscription {
  return [...subscriptions].sort((a, b) => {
    const planDiff = PLAN_RANK[b.plan] - PLAN_RANK[a.plan];
    if (planDiff !== 0) return planDiff;
    return b.updatedAt.localeCompare(a.updatedAt);
  })[0]!;
}

/**
 * Group per-restaurant subscription rows into one account row per owner.
 * Subscription fields come from a single canonical (highest-plan) row.
 * Restaurant names come from all owned restaurants (subscription join + extras).
 */
export function groupSubscriptionsByOwner(
  subscriptions: RestaurantSubscription[],
  restaurants: Array<{
    id: string;
    owner_id: string;
    owner_name: string | null;
    email: string | null;
    restaurant_name: string | null;
  }> = [],
): OwnerSubscriptionAccount[] {
  const subsByOwner = new Map<string, RestaurantSubscription[]>();
  for (const sub of subscriptions) {
    if (!sub.ownerId) continue;
    const list = subsByOwner.get(sub.ownerId) ?? [];
    list.push(sub);
    subsByOwner.set(sub.ownerId, list);
  }

  const restaurantsByOwner = new Map<
    string,
    Array<{
      id: string;
      owner_name: string | null;
      email: string | null;
      restaurant_name: string | null;
    }>
  >();
  for (const restaurant of restaurants) {
    const list = restaurantsByOwner.get(restaurant.owner_id) ?? [];
    list.push(restaurant);
    restaurantsByOwner.set(restaurant.owner_id, list);
  }

  const ownerIds = new Set([
    ...subsByOwner.keys(),
    ...restaurantsByOwner.keys(),
  ]);

  const accounts: OwnerSubscriptionAccount[] = [];

  for (const ownerId of ownerIds) {
    const ownerSubs = subsByOwner.get(ownerId) ?? [];
    if (ownerSubs.length === 0) continue;

    const primary = pickPrimarySubscription(ownerSubs);
    const ownedRestaurants = restaurantsByOwner.get(ownerId) ?? [];

    const restaurantMap = new Map<string, OwnerRestaurantSummary>();
    for (const restaurant of ownedRestaurants) {
      restaurantMap.set(restaurant.id, {
        restaurantId: restaurant.id,
        restaurantName: restaurant.restaurant_name,
        subscriptionId: null,
      });
    }
    for (const sub of ownerSubs) {
      restaurantMap.set(sub.restaurantId, {
        restaurantId: sub.restaurantId,
        restaurantName: sub.restaurantName,
        subscriptionId: sub.id,
      });
    }

    const restaurantSummaries = [...restaurantMap.values()].sort((a, b) =>
      (a.restaurantName ?? "").localeCompare(b.restaurantName ?? ""),
    );

    const ownerName =
      ownedRestaurants.find((r) => r.owner_name?.trim())?.owner_name?.trim() ||
      ownerSubs.find((s) => s.ownerName?.trim())?.ownerName?.trim() ||
      null;

    const ownerEmail =
      ownedRestaurants.find((r) => r.email?.trim())?.email?.trim() ||
      ownerSubs.find((s) => s.restaurantEmail?.trim())?.restaurantEmail?.trim() ||
      null;

    accounts.push({
      ownerId,
      ownerName,
      ownerEmail,
      plan: primary.plan,
      monthlyPrice: primary.monthlyPrice,
      currency: primary.currency,
      status: primary.status,
      renewalDate: primary.renewalDate,
      restaurantCount: restaurantSummaries.length,
      restaurants: restaurantSummaries,
      primarySubscriptionId: primary.id,
      primaryRestaurantId: primary.restaurantId,
      subscriptionIds: ownerSubs.map((s) => s.id),
      restaurantIds: restaurantSummaries.map((r) => r.restaurantId),
    });
  }

  return accounts.sort((a, b) => {
    const nameA = (a.ownerName ?? a.ownerEmail ?? a.ownerId).toLowerCase();
    const nameB = (b.ownerName ?? b.ownerEmail ?? b.ownerId).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

export async function fetchOwnerSubscriptionAccounts(): Promise<
  | { ok: true; data: OwnerSubscriptionAccount[] }
  | { ok: false; message: string }
> {
  try {
    const [subsResult, restaurantsResult] = await Promise.all([
      fetchSubscriptions(),
      supabase
        .from("restaurants")
        .select("id, owner_id, owner_name, email, restaurant_name")
        .order("created_at", { ascending: true }),
    ]);

    if (!subsResult.ok) return subsResult;
    if (restaurantsResult.error) {
      return {
        ok: false,
        message: restaurantsResult.error.message || ERROR,
      };
    }

    return {
      ok: true,
      data: groupSubscriptionsByOwner(
        subsResult.data,
        (restaurantsResult.data ?? []) as Array<{
          id: string;
          owner_id: string;
          owner_name: string | null;
          email: string | null;
          restaurant_name: string | null;
        }>,
      ),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchOwnerSubscription(
  restaurantId: string,
): Promise<
  { ok: true; data: RestaurantSubscription | null } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("restaurant_subscriptions")
      .select(SELECT_WITH_RESTAURANT)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (error) return { ok: false, message: error.message || ERROR };
    if (!data) return { ok: true, data: null };

    const synced = await syncStoredStatus(data as SubscriptionRow);
    return { ok: true, data: mapRow(synced) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function updateSubscription(params: {
  id: string;
  restaurantId: string;
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  monthlyPrice?: number;
  renewalDate?: string | null;
  gracePeriodDays?: number;
  trialEndsAt?: string | null;
}): Promise<
  { ok: true; data: RestaurantSubscription } | { ok: false; message: string }
> {
  try {
    const plan = params.plan;
    const prices = await getPlanMonthlyPrices();
    const monthlyPrice =
      params.monthlyPrice ?? (plan ? prices[plan] : undefined);

    const payload: Record<string, unknown> = {};
    if (plan) payload.plan = plan;
    if (params.status) {
      payload.status = params.status;
      payload.cancelled_at =
        params.status === "cancelled" ? new Date().toISOString() : null;

      if (params.status === "trial") {
        const window = trialWindowIso();
        payload.trial_started_at = window.trialStartedAt;
        payload.trial_ends_at = window.trialEndsAt;
        if (params.renewalDate === undefined) {
          payload.renewal_date = window.renewalDate;
        }
      }

      if (params.status === "active" && params.renewalDate === undefined) {
        const renew = new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .slice(0, 10);
        payload.renewal_date = renew;
      }
    }
    if (monthlyPrice !== undefined) payload.monthly_price = monthlyPrice;
    if (params.renewalDate !== undefined) {
      payload.renewal_date = params.renewalDate;
    }
    if (params.gracePeriodDays !== undefined) {
      payload.grace_period_days = params.gracePeriodDays;
    }
    if (params.trialEndsAt !== undefined) {
      payload.trial_ends_at = params.trialEndsAt;
    }

    const { data, error } = await supabase
      .from("restaurant_subscriptions")
      .update(payload)
      .eq("id", params.id)
      .select(SELECT_WITH_RESTAURANT)
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    if (plan) {
      await supabase
        .from("restaurants")
        .update({ subscription_plan: plan })
        .eq("id", params.restaurantId);
    }

    // Reactivation after successful payment / admin reactivate.
    if (params.status === "active" || params.status === "trial") {
      await supabase
        .from("restaurants")
        .update({ is_active: true, is_archived: false })
        .eq("id", params.restaurantId);
    }

    if (
      params.status === "suspended" ||
      params.status === "expired" ||
      params.status === "cancelled"
    ) {
      await supabase
        .from("restaurants")
        .update({ is_active: false })
        .eq("id", params.restaurantId);
    }

    return { ok: true, data: mapRow(data as SubscriptionRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

/**
 * Update an owner's subscription across all of their restaurant_subscriptions
 * rows (account-level billing for multi-restaurant owners).
 */
export async function updateOwnerSubscription(params: {
  ownerId: string;
  subscriptionIds: string[];
  restaurantIds: string[];
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  monthlyPrice?: number;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    if (params.subscriptionIds.length === 0) {
      return { ok: false, message: "No subscriptions found for this owner." };
    }

    const plan = params.plan;
    const prices = await getPlanMonthlyPrices();
    const monthlyPrice =
      params.monthlyPrice ?? (plan ? prices[plan] : undefined);

    const payload: Record<string, unknown> = {};
    if (plan) payload.plan = plan;
    if (params.status) {
      payload.status = params.status;
      payload.cancelled_at =
        params.status === "cancelled" ? new Date().toISOString() : null;

      if (params.status === "trial") {
        const window = trialWindowIso();
        payload.trial_started_at = window.trialStartedAt;
        payload.trial_ends_at = window.trialEndsAt;
        payload.renewal_date = window.renewalDate;
      }

      if (params.status === "active") {
        payload.renewal_date = new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .slice(0, 10);
      }
    }
    if (monthlyPrice !== undefined) payload.monthly_price = monthlyPrice;

    const { error } = await supabase
      .from("restaurant_subscriptions")
      .update(payload)
      .in("id", params.subscriptionIds);

    if (error) return { ok: false, message: error.message || ERROR };

    if (params.restaurantIds.length > 0) {
      const restaurantPayload: Record<string, unknown> = {};
      if (plan) restaurantPayload.subscription_plan = plan;

      if (params.status === "active" || params.status === "trial") {
        restaurantPayload.is_active = true;
        restaurantPayload.is_archived = false;
      }

      if (
        params.status === "suspended" ||
        params.status === "expired" ||
        params.status === "cancelled"
      ) {
        restaurantPayload.is_active = false;
      }

      if (Object.keys(restaurantPayload).length > 0) {
        const { error: restaurantError } = await supabase
          .from("restaurants")
          .update(restaurantPayload)
          .in("id", params.restaurantIds);

        if (restaurantError) {
          return { ok: false, message: restaurantError.message || ERROR };
        }
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function ensureRestaurantSubscription(
  restaurantId: string,
  plan: SubscriptionPlan = "Starter",
): Promise<
  { ok: true; data: RestaurantSubscription } | { ok: false; message: string }
> {
  try {
    const existing = await fetchOwnerSubscription(restaurantId);
    if (!existing.ok) return existing;
    if (existing.data) return { ok: true, data: existing.data };

    const prices = await getPlanMonthlyPrices();
    const window = trialWindowIso();

    const { data, error } = await supabase
      .from("restaurant_subscriptions")
      .insert({
        restaurant_id: restaurantId,
        plan,
        monthly_price: prices[plan],
        currency: "KWD",
        status: "trial",
        trial_started_at: window.trialStartedAt,
        trial_ends_at: window.trialEndsAt,
        grace_period_days: DEFAULT_GRACE_PERIOD_DAYS,
        renewal_date: window.renewalDate,
      })
      .select(SELECT_WITH_RESTAURANT)
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    await supabase
      .from("restaurants")
      .update({ subscription_plan: plan })
      .eq("id", restaurantId);

    return { ok: true, data: mapRow(data as SubscriptionRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function bulkUpdateSubscriptionStatus(
  ids: string[],
  status: SubscriptionStatus,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const payload: Record<string, unknown> = { status };
    payload.cancelled_at =
      status === "cancelled" ? new Date().toISOString() : null;

    if (status === "trial") {
      const window = trialWindowIso();
      payload.trial_started_at = window.trialStartedAt;
      payload.trial_ends_at = window.trialEndsAt;
      payload.renewal_date = window.renewalDate;
    }

    const { error } = await supabase
      .from("restaurant_subscriptions")
      .update(payload)
      .in("id", ids);

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export function exportSubscriptionsToCsv(
  items: RestaurantSubscription[],
): string {
  const headers = [
    "Restaurant",
    "Email",
    "Plan",
    "Price",
    "Currency",
    "Status",
    "Trial Ends",
    "Grace Days",
    "Renewal",
    "Started",
  ];

  const rows = items.map((item) => [
    item.restaurantName?.trim() || "Unnamed restaurant",
    item.restaurantEmail ?? "",
    item.plan,
    String(item.monthlyPrice),
    item.currency,
    item.status,
    item.trialEndsAt ?? "",
    String(item.gracePeriodDays),
    item.renewalDate ?? "",
    item.startedAt,
  ]);

  return buildCsv(headers, rows);
}

export function exportOwnerSubscriptionsToCsv(
  items: OwnerSubscriptionAccount[],
): string {
  const headers = [
    "Owner Name",
    "Owner Email",
    "Plan",
    "Price",
    "Currency",
    "Status",
    "Renewal",
    "Restaurant Count",
    "Restaurants",
  ];

  const rows = items.map((item) => [
    item.ownerName?.trim() || "Unnamed owner",
    item.ownerEmail ?? "",
    item.plan,
    String(item.monthlyPrice),
    item.currency,
    item.status,
    item.renewalDate ?? "",
    String(item.restaurantCount),
    item.restaurants
      .map((r) => r.restaurantName?.trim() || "Unnamed restaurant")
      .join(", "),
  ]);

  return buildCsv(headers, rows);
}
