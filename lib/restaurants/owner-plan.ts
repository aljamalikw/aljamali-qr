import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizePlanId,
  type SubscriptionPlanId,
} from "@/lib/subscriptions/plans";

const PLAN_RANK: Record<SubscriptionPlanId, number> = {
  Starter: 1,
  Professional: 2,
  Enterprise: 3,
};

/**
 * Resolve the owner's entitlement plan from restaurant_subscriptions
 * (never restaurants.subscription_plan). Prefers the source restaurant's
 * subscription when provided and owned; otherwise the highest plan among
 * all owned restaurants. Defaults to Starter when none exist.
 */
export async function resolveOwnerSubscriptionPlan(
  admin: SupabaseClient,
  ownerId: string,
  sourceRestaurantId?: string | null,
): Promise<SubscriptionPlanId> {
  const { data: restaurants, error } = await admin
    .from("restaurants")
    .select("id")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (error || !restaurants?.length) {
    return "Starter";
  }

  const ids = restaurants.map((r) => r.id as string);
  const preferred =
    sourceRestaurantId && ids.includes(sourceRestaurantId)
      ? sourceRestaurantId
      : null;

  const { data: subs } = await admin
    .from("restaurant_subscriptions")
    .select("restaurant_id, plan")
    .in("restaurant_id", ids);

  if (!subs?.length) {
    return "Starter";
  }

  if (preferred) {
    const preferredSub = subs.find((s) => s.restaurant_id === preferred);
    if (preferredSub?.plan) {
      return normalizePlanId(preferredSub.plan as string);
    }
  }

  let best: SubscriptionPlanId = "Starter";
  for (const row of subs) {
    const plan = normalizePlanId(row.plan as string | null);
    if (PLAN_RANK[plan] > PLAN_RANK[best]) {
      best = plan;
    }
  }
  return best;
}

export async function countOwnerRestaurants(
  admin: SupabaseClient,
  ownerId: string,
): Promise<number> {
  const { count, error } = await admin
    .from("restaurants")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", ownerId);

  if (error) return 0;
  return count ?? 0;
}
