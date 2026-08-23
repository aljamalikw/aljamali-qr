import type { SupabaseClient } from "@supabase/supabase-js";
import { pickPrimaryByPlan } from "@/lib/admin/group-by-owner";
import {
  getMaxRestaurants,
  normalizePlanId,
  type SubscriptionPlanId,
} from "@/lib/subscriptions/plans";
import {
  isEntitledSubscriptionStatus,
  resolveEffectiveStatus,
  type SubscriptionStatus,
} from "@/lib/subscriptions/engine";

export type OwnerSubscriptionDbRow = {
  id: string;
  restaurant_id: string;
  plan: string;
  monthly_price?: number | string | null;
  currency?: string | null;
  status: string;
  renewal_date: string | null;
  started_at?: string | null;
  cancelled_at: string | null;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  grace_period_days: number | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_covered?: boolean | null;
};

export type OwnerRestaurantRef = {
  id: string;
  owner_id: string;
  created_at: string;
  restaurant_name?: string | null;
};

export type EffectiveOwnerSubscription = {
  ownerId: string;
  canonical: OwnerSubscriptionDbRow;
  ownerPlan: SubscriptionPlanId;
  /**
   * This restaurant's own subscription row. Feature access and public-menu
   * dates must come from here — never from a sibling restaurant.
   */
  locationSubscription: OwnerSubscriptionDbRow;
  /** Plan used for this restaurant's features/public menu. */
  locationPlan: SubscriptionPlanId;
  locationCovered: boolean;
  restaurantCount: number;
  coveredCount: number;
  maxRestaurants: number;
  coveredRestaurantIds: string[];
  restaurantIds: string[];
  restaurants: OwnerRestaurantRef[];
  subscriptions: OwnerSubscriptionDbRow[];
};

const SUB_SELECT =
  "id, restaurant_id, plan, monthly_price, currency, status, renewal_date, started_at, cancelled_at, trial_started_at, trial_ends_at, grace_period_days, created_at, updated_at, is_covered";

const SUB_SELECT_LEGACY =
  "id, restaurant_id, plan, monthly_price, currency, status, renewal_date, started_at, cancelled_at, trial_started_at, trial_ends_at, grace_period_days, created_at, updated_at";

async function loadSubscriptionRows(
  client: SupabaseClient,
  restaurantIds: string[],
): Promise<OwnerSubscriptionDbRow[]> {
  if (restaurantIds.length === 0) return [];

  const withCoverage = await client
    .from("restaurant_subscriptions")
    .select(SUB_SELECT)
    .in("restaurant_id", restaurantIds);

  if (!withCoverage.error) {
    return (withCoverage.data ?? []) as OwnerSubscriptionDbRow[];
  }

  const legacy = await client
    .from("restaurant_subscriptions")
    .select(SUB_SELECT_LEGACY)
    .in("restaurant_id", restaurantIds);

  if (legacy.error) return [];
  return (legacy.data ?? []) as OwnerSubscriptionDbRow[];
}

function canonicalTieBreaker(row: OwnerSubscriptionDbRow): string {
  return (
    row.renewal_date ||
    row.trial_ends_at ||
    row.updated_at ||
    row.created_at ||
    ""
  );
}

export function pickCanonicalSubscription(
  rows: OwnerSubscriptionDbRow[],
): OwnerSubscriptionDbRow | null {
  if (rows.length === 0) return null;
  return pickPrimaryByPlan(
    rows.map((row) => ({ ...row, plan: normalizePlanId(row.plan) })),
    canonicalTieBreaker,
  );
}

/** In-memory owner resolver. Prefer this over re-implementing coverage/canonical pick. */
export function buildEffectiveOwnerSubscription(
  ownerId: string,
  restaurants: OwnerRestaurantRef[],
  subscriptions: OwnerSubscriptionDbRow[],
  restaurantId?: string,
): EffectiveOwnerSubscription | null {
  const canonical = pickCanonicalSubscription(subscriptions);
  if (!canonical) return null;

  const ownerPlan = normalizePlanId(canonical.plan);
  const coveredRestaurantIds = computeCoveredRestaurantIds(
    restaurants,
    subscriptions,
    ownerPlan,
  );
  const id = restaurantId?.trim() ?? "";
  const locationCovered = id ? coveredRestaurantIds.includes(id) : true;
  const locationSubscription =
    (id
      ? subscriptions.find((row) => row.restaurant_id === id)
      : undefined) ?? canonical;

  return {
    ownerId,
    canonical,
    ownerPlan,
    locationSubscription,
    locationPlan: locationCovered
      ? normalizePlanId(locationSubscription.plan)
      : "Starter",
    locationCovered,
    restaurantCount: restaurants.length,
    coveredCount: coveredRestaurantIds.length,
    maxRestaurants: getMaxRestaurants(ownerPlan),
    coveredRestaurantIds,
    restaurantIds: restaurants.map((item) => item.id),
    restaurants,
    subscriptions,
  };
}

export function computeCoveredRestaurantIds(
  restaurants: OwnerRestaurantRef[],
  subscriptions: OwnerSubscriptionDbRow[],
  plan: SubscriptionPlanId,
): string[] {
  const max = getMaxRestaurants(plan);
  const ordered = [...restaurants].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  );
  const subByRestaurant = new Map(
    subscriptions.map((row) => [row.restaurant_id, row]),
  );
  const hasCoverageColumn = subscriptions.some(
    (row) => typeof row.is_covered === "boolean",
  );

  let selected = ordered.map((restaurant) => restaurant.id);
  if (hasCoverageColumn) {
    const flagged = ordered
      .filter((restaurant) => {
        const row = subByRestaurant.get(restaurant.id);
        if (!row) return false;
        return row.is_covered !== false;
      })
      .map((restaurant) => restaurant.id);
    selected = flagged.length > 0 ? flagged : ordered.slice(0, 1).map((r) => r.id);
  } else if (Number.isFinite(max)) {
    selected = ordered.slice(0, max).map((restaurant) => restaurant.id);
  }

  if (!Number.isFinite(max)) return selected;
  return selected.slice(0, max);
}

export async function loadOwnerSubscriptionContext(
  client: SupabaseClient,
  ownerId: string,
): Promise<{
  restaurants: OwnerRestaurantRef[];
  subscriptions: OwnerSubscriptionDbRow[];
  canonical: OwnerSubscriptionDbRow | null;
} | null> {
  const { data: restaurants, error } = await client
    .from("restaurants")
    .select("id, owner_id, created_at, restaurant_name")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error || !restaurants?.length) {
    return {
      restaurants: [],
      subscriptions: [],
      canonical: null,
    };
  }

  const refs = restaurants as OwnerRestaurantRef[];
  const subscriptions = await loadSubscriptionRows(
    client,
    refs.map((restaurant) => restaurant.id),
  );
  return {
    restaurants: refs,
    subscriptions,
    canonical: pickCanonicalSubscription(subscriptions),
  };
}

export async function resolveEffectiveOwnerSubscription(
  client: SupabaseClient,
  restaurantId: string,
): Promise<EffectiveOwnerSubscription | null> {
  const id = restaurantId.trim();
  if (!id) return null;

  const { data: restaurant, error } = await client
    .from("restaurants")
    .select("id, owner_id, created_at, restaurant_name")
    .eq("id", id)
    .maybeSingle();

  if (error || !restaurant?.owner_id) return null;

  const context = await loadOwnerSubscriptionContext(
    client,
    restaurant.owner_id as string,
  );
  if (!context) return null;

  return buildEffectiveOwnerSubscription(
    restaurant.owner_id as string,
    context.restaurants,
    context.subscriptions,
    id,
  );
}

export function canonicalToEngineFields(row: OwnerSubscriptionDbRow): {
  plan: SubscriptionPlanId;
  status: SubscriptionStatus | string;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  gracePeriodDays: number | null;
  renewalDate: string | null;
  cancelledAt: string | null;
} {
  return {
    plan: normalizePlanId(row.plan),
    status: row.status,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    gracePeriodDays: row.grace_period_days,
    renewalDate: row.renewal_date,
    cancelledAt: row.cancelled_at,
  };
}

export function resolveCanonicalEffectiveStatus(
  row: OwnerSubscriptionDbRow,
  now: Date = new Date(),
): SubscriptionStatus {
  return resolveEffectiveStatus(canonicalToEngineFields(row), now);
}

/** Engine fields for the active restaurant only. */
export function locationEngineInput(effective: EffectiveOwnerSubscription) {
  const row = effective.locationSubscription ?? effective.canonical;
  return {
    plan: effective.locationPlan,
    status: row.status,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    gracePeriodDays: row.grace_period_days,
    renewalDate: row.renewal_date,
    cancelledAt: row.cancelled_at,
  };
}

/** Feature plan after applying this restaurant's trial/paid entitlement. */
export function entitledLocationPlan(
  effective: EffectiveOwnerSubscription,
  now: Date = new Date(),
): SubscriptionPlanId {
  const row = effective.locationSubscription ?? effective.canonical;
  const status = resolveCanonicalEffectiveStatus(row, now);
  if (!isEntitledSubscriptionStatus(status)) return "Starter";
  return effective.locationPlan;
}

export function assertRestaurantsOwnedByOwner(
  ownerId: string,
  restaurants: OwnerRestaurantRef[],
  restaurantIds: string[],
): string | null {
  const owned = new Set(restaurants.map((restaurant) => restaurant.id));
  for (const restaurantId of restaurantIds) {
    if (!owned.has(restaurantId)) {
      return "A selected restaurant does not belong to this owner.";
    }
  }
  if (!ownerId.trim()) {
    return "Owner is required.";
  }
  return null;
}

export async function attachRestaurantToOwnerSubscription(
  client: SupabaseClient,
  ownerId: string,
  restaurantId: string,
): Promise<{ covered: boolean; plan: SubscriptionPlanId }> {
  const context = await loadOwnerSubscriptionContext(client, ownerId);
  const canonical = context?.canonical ?? null;
  const plan = canonical ? normalizePlanId(canonical.plan) : "Starter";
  const max = getMaxRestaurants(plan);
  const currentlyCovered = context
    ? computeCoveredRestaurantIds(
        context.restaurants.filter((restaurant) => restaurant.id !== restaurantId),
        context.subscriptions.filter((row) => row.restaurant_id !== restaurantId),
        plan,
      )
    : [];
  const canCover =
    !Number.isFinite(max) || currentlyCovered.length < max;

  const payload: Record<string, unknown> = {
    is_covered: canCover,
  };
  if (canonical && canCover) {
    payload.plan = canonical.plan;
    payload.monthly_price = canonical.monthly_price;
    payload.currency = canonical.currency ?? "KWD";
    payload.status = canonical.status;
    payload.renewal_date = canonical.renewal_date;
    payload.cancelled_at = canonical.cancelled_at;
    payload.trial_started_at = canonical.trial_started_at;
    payload.trial_ends_at = canonical.trial_ends_at;
    payload.grace_period_days = canonical.grace_period_days;
  } else if (canonical) {
    payload.plan = "Starter";
    payload.status = canonical.status;
    payload.renewal_date = canonical.renewal_date;
    payload.cancelled_at = canonical.cancelled_at;
    payload.trial_started_at = canonical.trial_started_at;
    payload.trial_ends_at = canonical.trial_ends_at;
    payload.grace_period_days = canonical.grace_period_days;
  }

  const { error } = await client
    .from("restaurant_subscriptions")
    .update(payload)
    .eq("restaurant_id", restaurantId);

  if (error && /is_covered|column/i.test(error.message)) {
    const fallback = { ...payload };
    delete fallback.is_covered;
    await client
      .from("restaurant_subscriptions")
      .update(fallback)
      .eq("restaurant_id", restaurantId);
  }

  await client
    .from("restaurants")
    .update({
      subscription_plan: canCover ? plan : "Starter",
    })
    .eq("id", restaurantId);

  return { covered: canCover, plan: canCover ? plan : "Starter" };
}
