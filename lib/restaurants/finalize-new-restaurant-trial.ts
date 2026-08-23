import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_TRIAL_PLAN,
  getPlanMonthlyAmount,
} from "@/lib/subscriptions/plans";

const SIGNUP_WINDOW_MS = 15 * 60 * 1000;

/**
 * Ensures a restaurant created during signup is on a Professional trial.
 * Does not charge, does not change trial dates, and ignores paid rows.
 */
export async function finalizeNewRestaurantTrial(
  client: SupabaseClient,
  restaurantId: string,
  ownerId: string,
): Promise<void> {
  const { data: restaurant } = await client
    .from("restaurants")
    .select("id, owner_id, created_at")
    .eq("id", restaurantId)
    .maybeSingle();

  if (!restaurant || restaurant.owner_id !== ownerId) return;

  const createdAt = restaurant.created_at
    ? new Date(restaurant.created_at as string).getTime()
    : 0;
  if (!createdAt || Date.now() - createdAt > SIGNUP_WINDOW_MS) return;

  await client
    .from("restaurants")
    .update({ subscription_plan: DEFAULT_TRIAL_PLAN })
    .eq("id", restaurantId)
    .eq("owner_id", ownerId);

  const { data: subscription } = await client
    .from("restaurant_subscriptions")
    .select("id, plan, status")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();

  if (!subscription || subscription.status !== "trial") return;
  if (subscription.plan === DEFAULT_TRIAL_PLAN) return;

  await client
    .from("restaurant_subscriptions")
    .update({
      plan: DEFAULT_TRIAL_PLAN,
      monthly_price: getPlanMonthlyAmount(DEFAULT_TRIAL_PLAN) ?? 15,
    })
    .eq("id", subscription.id)
    .eq("status", "trial");
}
