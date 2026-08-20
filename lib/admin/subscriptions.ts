import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/utils/csv";
import {
  DEFAULT_GRACE_PERIOD_DAYS,
  resolveEffectiveStatus,
  trialWindowIso,
} from "@/lib/subscriptions/engine";
import { getPlanMonthlyPrices, PLAN_PRICES } from "@/lib/subscriptions/pricing";
import {
  getMaxRestaurants,
} from "@/lib/subscriptions/plans";
import {
  assertRestaurantsOwnedByOwner,
  attachRestaurantToOwnerSubscription,
  buildEffectiveOwnerSubscription,
  resolveCanonicalEffectiveStatus,
  resolveEffectiveOwnerSubscription,
} from "@/lib/subscriptions/owner-subscription";
import {
  firstNonEmpty,
  groupItemsByOwnerId,
  pickPrimaryByPlan,
  sortOwnerRowsByName,
} from "@/lib/admin/group-by-owner";

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
  isCovered: boolean;
};

export type OwnerRestaurantSummary = {
  restaurantId: string;
  restaurantName: string | null;
  subscriptionId: string | null;
  isCovered: boolean;
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
  coveredCount: number;
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
  is_covered?: boolean | null;
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
    isCovered: row.is_covered !== false,
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
    return {
      ok: true,
      data: rows.map(mapRow).filter((row) => Boolean(row.ownerId)),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

function pickPrimarySubscription(
  subscriptions: RestaurantSubscription[],
): RestaurantSubscription {
  return pickPrimaryByPlan(subscriptions, (item) => item.updatedAt);
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
    created_at: string;
  }> = [],
): OwnerSubscriptionAccount[] {
  const subsByOwner = groupItemsByOwnerId(subscriptions);

    const restaurantsByOwner = new Map<
    string,
    Array<{
      id: string;
      owner_name: string | null;
      email: string | null;
      restaurant_name: string | null;
      created_at: string;
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

    const ownedRestaurants = restaurantsByOwner.get(ownerId) ?? [];
    const restaurantRefs =
      ownedRestaurants.length > 0
        ? ownedRestaurants.map((restaurant) => ({
            id: restaurant.id,
            owner_id: ownerId,
            created_at: restaurant.created_at,
            restaurant_name: restaurant.restaurant_name,
          }))
        : ownerSubs.map((sub) => ({
            id: sub.restaurantId,
            owner_id: ownerId,
            created_at: sub.createdAt,
            restaurant_name: sub.restaurantName,
          }));
    const subscriptionRows = ownerSubs.map((sub) => ({
      id: sub.id,
      restaurant_id: sub.restaurantId,
      plan: sub.plan,
      monthly_price: sub.monthlyPrice,
      currency: sub.currency,
      status: sub.status,
      renewal_date: sub.renewalDate,
      started_at: sub.startedAt,
      cancelled_at: sub.cancelledAt,
      trial_started_at: sub.trialStartedAt,
      trial_ends_at: sub.trialEndsAt,
      grace_period_days: sub.gracePeriodDays,
      created_at: sub.createdAt,
      updated_at: sub.updatedAt,
      is_covered: sub.isCovered,
    }));
    const effective = buildEffectiveOwnerSubscription(
      ownerId,
      restaurantRefs,
      subscriptionRows,
    );
    const primary =
      ownerSubs.find((sub) => sub.id === effective?.canonical.id) ??
      pickPrimarySubscription(ownerSubs);
    const ownerStatus = effective
      ? resolveCanonicalEffectiveStatus(effective.canonical)
      : primary.status;
    const coveredIds = new Set(effective?.coveredRestaurantIds ?? []);

    const restaurantMap = new Map<string, OwnerRestaurantSummary>();
    for (const restaurant of ownedRestaurants) {
      restaurantMap.set(restaurant.id, {
        restaurantId: restaurant.id,
        restaurantName: restaurant.restaurant_name,
        subscriptionId: null,
        isCovered: coveredIds.has(restaurant.id),
      });
    }
    for (const sub of ownerSubs) {
      restaurantMap.set(sub.restaurantId, {
        restaurantId: sub.restaurantId,
        restaurantName: sub.restaurantName,
        subscriptionId: sub.id,
        isCovered: coveredIds.has(sub.restaurantId),
      });
    }

    const restaurantSummaries = [...restaurantMap.values()].sort((a, b) =>
      (a.restaurantName ?? "").localeCompare(b.restaurantName ?? ""),
    );

    accounts.push({
      ownerId,
      ownerName: firstNonEmpty(
        ...ownedRestaurants.map((r) => r.owner_name),
        ...ownerSubs.map((s) => s.ownerName),
      ),
      ownerEmail: firstNonEmpty(
        ...ownedRestaurants.map((r) => r.email),
        ...ownerSubs.map((s) => s.restaurantEmail),
      ),
      plan: effective?.ownerPlan ?? primary.plan,
      monthlyPrice: Number(
        effective?.canonical.monthly_price ?? primary.monthlyPrice,
      ),
      currency: effective?.canonical.currency || primary.currency,
      status: ownerStatus,
      renewalDate: effective?.canonical.renewal_date ?? primary.renewalDate,
      restaurantCount: restaurantSummaries.length,
      coveredCount: coveredIds.size,
      restaurants: restaurantSummaries,
      primarySubscriptionId: primary.id,
      primaryRestaurantId: primary.restaurantId,
      subscriptionIds: ownerSubs.map((s) => s.id),
      restaurantIds: restaurantSummaries.map((r) => r.restaurantId),
    });
  }

  return sortOwnerRowsByName(accounts);
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
        .select("id, owner_id, owner_name, email, restaurant_name, created_at")
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
          created_at: string;
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

    const mapped = mapRow(data as SubscriptionRow);
    const effective = await resolveEffectiveOwnerSubscription(
      supabase,
      restaurantId,
    );
    if (!effective) {
      return { ok: true, data: mapped };
    }

    const canonicalStatus = resolveCanonicalEffectiveStatus(effective.canonical);

    return {
      ok: true,
      data: {
        ...mapped,
        plan: effective.ownerPlan,
        monthlyPrice: Number(effective.canonical.monthly_price ?? mapped.monthlyPrice),
        currency: effective.canonical.currency || mapped.currency,
        status: canonicalStatus,
        renewalDate: effective.canonical.renewal_date,
        cancelledAt: effective.canonical.cancelled_at,
        trialStartedAt: effective.canonical.trial_started_at,
        trialEndsAt: effective.canonical.trial_ends_at,
        gracePeriodDays:
          typeof effective.canonical.grace_period_days === "number"
            ? effective.canonical.grace_period_days
            : mapped.gracePeriodDays,
        isCovered: effective.locationCovered,
      },
    };
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
  coveredRestaurantIds?: string[];
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  monthlyPrice?: number;
  renewalDate?: string | null;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    if (params.subscriptionIds.length === 0) {
      return { ok: false, message: "No subscriptions found for this owner." };
    }

    const { data: ownerRestaurants, error: ownerRestaurantsError } =
      await supabase
        .from("restaurants")
        .select("id, owner_id, created_at, restaurant_name")
        .eq("owner_id", params.ownerId);

    if (ownerRestaurantsError) {
      return { ok: false, message: ownerRestaurantsError.message || ERROR };
    }

    const owned = (ownerRestaurants ?? []) as Array<{
      id: string;
      owner_id: string;
      created_at: string;
      restaurant_name: string | null;
    }>;

    const ownershipError = assertRestaurantsOwnedByOwner(
      params.ownerId,
      owned,
      params.restaurantIds,
    );
    if (ownershipError) return { ok: false, message: ownershipError };

    const plan = params.plan;
    const max = plan ? getMaxRestaurants(plan) : Number.POSITIVE_INFINITY;
    const requestedCovered = params.coveredRestaurantIds
      ? [...new Set(params.coveredRestaurantIds)]
      : params.restaurantIds;

    const coveredOwnershipError = assertRestaurantsOwnedByOwner(
      params.ownerId,
      owned,
      requestedCovered,
    );
    if (coveredOwnershipError) {
      return { ok: false, message: coveredOwnershipError };
    }

    if (Number.isFinite(max) && requestedCovered.length > max) {
      return {
        ok: false,
        message:
          plan === "Starter"
            ? "Starter supports 1 restaurant. Select exactly one covered restaurant."
            : `Professional supports 2 restaurants. Select up to ${max} restaurants that will remain covered.`,
      };
    }

    if (Number.isFinite(max) && requestedCovered.length < 1) {
      return {
        ok: false,
        message: "Select at least one restaurant to cover.",
      };
    }

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

      if (params.status === "active" && params.renewalDate === undefined) {
        payload.renewal_date = new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .slice(0, 10);
      }
    }
    if (monthlyPrice !== undefined) payload.monthly_price = monthlyPrice;
    if (params.renewalDate !== undefined) {
      payload.renewal_date = params.renewalDate;
    }

    const { error } = await supabase
      .from("restaurant_subscriptions")
      .update(payload)
      .in("id", params.subscriptionIds);

    if (error) return { ok: false, message: error.message || ERROR };

    const coveredSet = new Set(requestedCovered);
    for (const restaurant of owned) {
      const covered = coveredSet.has(restaurant.id);
      const coveragePayload: Record<string, unknown> = {
        is_covered: covered,
      };
      if (plan) {
        coveragePayload.plan = covered ? plan : "Starter";
        coveragePayload.monthly_price = covered
          ? (monthlyPrice ?? prices[plan])
          : prices.Starter;
      }
      const { error: coverageError } = await supabase
        .from("restaurant_subscriptions")
        .update(coveragePayload)
        .eq("restaurant_id", restaurant.id);
      if (
        coverageError &&
        !/is_covered|column/i.test(coverageError.message)
      ) {
        return { ok: false, message: coverageError.message || ERROR };
      }

      const restaurantPayload: Record<string, unknown> = {};
      if (plan) {
        restaurantPayload.subscription_plan = covered ? plan : "Starter";
      }
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
        await supabase
          .from("restaurants")
          .update(restaurantPayload)
          .eq("id", restaurant.id);
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

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("owner_id")
      .eq("id", restaurantId)
      .maybeSingle();
    if (restaurant?.owner_id) {
      await attachRestaurantToOwnerSubscription(
        supabase,
        restaurant.owner_id as string,
        restaurantId,
      );
    }

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
    "Covered",
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
    String(item.coveredCount),
  ]);

  return buildCsv(headers, rows);
}
