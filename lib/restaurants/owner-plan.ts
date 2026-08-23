import type { SupabaseClient } from "@supabase/supabase-js";
import {
  entitledLocationPlan,
  resolveEffectiveOwnerSubscription,
} from "@/lib/subscriptions/owner-subscription";
import {
  DEFAULT_TRIAL_PLAN,
  type SubscriptionPlanId,
} from "@/lib/subscriptions/plans";

/**
 * Resolve the owner's entitled plan from restaurant_subscriptions.
 * Expired trials do not keep Professional restaurant limits.
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
    return DEFAULT_TRIAL_PLAN;
  }

  const sourceId =
    (sourceRestaurantId &&
      restaurants.some((row) => row.id === sourceRestaurantId) &&
      sourceRestaurantId) ||
    (restaurants[0]?.id as string);

  const effective = await resolveEffectiveOwnerSubscription(admin, sourceId);
  if (!effective) return "Starter";
  return entitledLocationPlan(effective);
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
