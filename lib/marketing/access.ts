import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdminRole, type AppRole } from "@/lib/auth/roles";
import {
  MARKETING_UPGRADE_MESSAGE,
  planAllowsMarketing,
} from "@/lib/subscriptions/plans";
import {
  entitledLocationPlan,
  resolveEffectiveOwnerSubscription,
} from "@/lib/subscriptions/owner-subscription";

export { MARKETING_UPGRADE_MESSAGE, planAllowsMarketing };

export type MarketingAccessResult =
  | { ok: true; plan: string; bypassAdmin: boolean }
  | { ok: false; message: string; plan: string };

/**
 * Server-side marketing gate. Platform admins always pass.
 * Restaurant owners require planAllowsMarketing(plan) (Professional + Enterprise).
 */
export async function resolveMarketingAccess(
  client: SupabaseClient,
  restaurantId: string,
  actorUserId?: string | null,
): Promise<MarketingAccessResult> {
  let bypassAdmin = false;

  if (actorUserId) {
    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", actorUserId)
      .maybeSingle();
    const role = (profile as { role?: AppRole } | null)?.role ?? null;
    if (isAdminRole(role)) bypassAdmin = true;
  }

  const effective = await resolveEffectiveOwnerSubscription(client, restaurantId);
  let plan = effective ? entitledLocationPlan(effective) : "";

  if (!plan) {
    const { data: restaurant } = await client
      .from("restaurants")
      .select("subscription_plan")
      .eq("id", restaurantId)
      .maybeSingle();
    plan =
      typeof restaurant?.subscription_plan === "string" &&
      restaurant.subscription_plan.trim()
        ? restaurant.subscription_plan.trim()
        : "Starter";
  }

  if (bypassAdmin || planAllowsMarketing(plan)) {
    return { ok: true, plan, bypassAdmin };
  }

  return { ok: false, message: MARKETING_UPGRADE_MESSAGE, plan };
}
