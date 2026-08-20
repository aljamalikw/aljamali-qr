import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import {
  buildEffectiveOwnerSubscription,
  resolveCanonicalEffectiveStatus,
  type OwnerRestaurantRef,
  type OwnerSubscriptionDbRow,
} from "@/lib/subscriptions/owner-subscription";
import type { SubscriptionStatus } from "@/lib/subscriptions/engine";

export type LifecycleSyncResult = {
  scanned: number;
  updated: number;
  suspendedRestaurants: number;
  reactivatedRestaurants: number;
  errors: string[];
};

type SubRow = OwnerSubscriptionDbRow & {
  restaurant_id: string;
};

type RestaurantRow = OwnerRestaurantRef & {
  is_active?: boolean | null;
  is_archived?: boolean | null;
};

const SUB_SELECT =
  "id, restaurant_id, plan, monthly_price, currency, status, renewal_date, started_at, cancelled_at, trial_started_at, trial_ends_at, grace_period_days, created_at, updated_at, is_covered";
const SUB_SELECT_LEGACY =
  "id, restaurant_id, plan, monthly_price, currency, status, renewal_date, started_at, cancelled_at, trial_started_at, trial_ends_at, grace_period_days, created_at, updated_at";

/**
 * Persist effective owner-level subscription statuses and auto-suspend
 * covered restaurants after grace. Restaurant-level trial_ends_at is never
 * rewritten; covered locations follow the canonical owner row.
 */
export async function syncAllSubscriptionLifecycles(): Promise<LifecycleSyncResult> {
  const result: LifecycleSyncResult = {
    scanned: 0,
    updated: 0,
    suspendedRestaurants: 0,
    reactivatedRestaurants: 0,
    errors: [],
  };

  const supabase = createServiceSupabaseClient();
  const withCoverage = await supabase.from("restaurant_subscriptions").select(SUB_SELECT);
  const subResult = withCoverage.error
    ? await supabase.from("restaurant_subscriptions").select(SUB_SELECT_LEGACY)
    : withCoverage;

  if (subResult.error) {
    result.errors.push(subResult.error.message);
    return result;
  }

  const rows = (subResult.data ?? []) as SubRow[];
  result.scanned = rows.length;

  const { data: restaurantData, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, owner_id, created_at, restaurant_name, is_active, is_archived");

  if (restaurantError) {
    result.errors.push(restaurantError.message);
    return result;
  }

  const restaurants = (restaurantData ?? []) as RestaurantRow[];
  const restaurantsByOwner = new Map<string, RestaurantRow[]>();
  for (const restaurant of restaurants) {
    const list = restaurantsByOwner.get(restaurant.owner_id) ?? [];
    list.push(restaurant);
    restaurantsByOwner.set(restaurant.owner_id, list);
  }

  const subsByRestaurant = new Map(rows.map((row) => [row.restaurant_id, row]));
  const now = new Date();

  for (const [ownerId, ownerRestaurants] of restaurantsByOwner) {
    try {
      const subscriptions = ownerRestaurants
        .map((restaurant) => subsByRestaurant.get(restaurant.id))
        .filter((row): row is SubRow => Boolean(row));

      const effective = buildEffectiveOwnerSubscription(
        ownerId,
        ownerRestaurants,
        subscriptions,
      );
      if (!effective) continue;

      const canonicalStatus = resolveCanonicalEffectiveStatus(
        effective.canonical,
        now,
      );
      const covered = new Set(effective.coveredRestaurantIds);

      for (const restaurant of ownerRestaurants) {
        if (!covered.has(restaurant.id)) continue;
        const row = subsByRestaurant.get(restaurant.id);
        if (!row) continue;

        if (canonicalStatus !== row.status) {
          const payload: Record<string, unknown> = { status: canonicalStatus };
          if (canonicalStatus === "cancelled") {
            payload.cancelled_at = row.cancelled_at ?? now.toISOString();
          } else {
            payload.cancelled_at = null;
          }

          const { error: updateError } = await supabase
            .from("restaurant_subscriptions")
            .update(payload)
            .eq("id", row.id);

          if (updateError) {
            result.errors.push(`${row.id}: ${updateError.message}`);
            continue;
          }
          result.updated += 1;
        }

        const shouldSuspend =
          canonicalStatus === "suspended" ||
          canonicalStatus === "expired" ||
          canonicalStatus === "cancelled";

        if (shouldSuspend && restaurant.is_active !== false) {
          const { error: suspendError } = await supabase
            .from("restaurants")
            .update({ is_active: false })
            .eq("id", restaurant.id);
          if (suspendError) {
            result.errors.push(`suspend ${restaurant.id}: ${suspendError.message}`);
          } else {
            result.suspendedRestaurants += 1;
          }
        }

        const shouldKeepOnline =
          canonicalStatus === "active" ||
          canonicalStatus === "trial" ||
          canonicalStatus === "grace";

        if (
          shouldKeepOnline &&
          restaurant.is_active === false &&
          restaurant.is_archived !== true &&
          (row.status === "suspended" ||
            row.status === "expired" ||
            canonicalStatus === "active")
        ) {
          if (
            (canonicalStatus === "active" || canonicalStatus === "trial") &&
            (row.status as SubscriptionStatus) !== "cancelled"
          ) {
            const { error: reactivateError } = await supabase
              .from("restaurants")
              .update({ is_active: true })
              .eq("id", restaurant.id);
            if (reactivateError) {
              result.errors.push(
                `reactivate ${restaurant.id}: ${reactivateError.message}`,
              );
            } else {
              result.reactivatedRestaurants += 1;
            }
          }
        }
      }
    } catch (err) {
      result.errors.push(
        `${ownerId}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return result;
}
