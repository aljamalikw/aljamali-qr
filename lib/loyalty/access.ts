import type { SupabaseClient } from "@supabase/supabase-js";
import { isAdminRole, type AppRole } from "@/lib/auth/roles";
import {
  LOYALTY_UPGRADE_MESSAGE,
  planAllowsLoyalty,
} from "@/lib/subscriptions/plans";
import { resolveEffectiveOwnerSubscription } from "@/lib/subscriptions/owner-subscription";

export { LOYALTY_UPGRADE_MESSAGE, planAllowsLoyalty };

export type LoyaltyAccessResult =
  | { ok: true; plan: string; bypassAdmin: boolean }
  | { ok: false; message: string; plan: string };

/**
 * Server-side loyalty gate. Platform admins always pass.
 * Restaurant owners require planAllowsLoyalty(plan).
 */
export async function resolveLoyaltyAccess(
  client: SupabaseClient,
  restaurantId: string,
  actorUserId?: string | null,
): Promise<LoyaltyAccessResult> {
  let bypassAdmin = false;

  if (actorUserId) {
    const { data: profile } = await client
      .from("profiles")
      .select("role")
      .eq("id", actorUserId)
      .maybeSingle();
    const role = (profile as { role?: AppRole } | null)?.role ?? null;
    if (isAdminRole(role)) {
      bypassAdmin = true;
    }
  }

  const { data: restaurant } = await client
    .from("restaurants")
    .select("owner_id, subscription_plan")
    .eq("id", restaurantId)
    .maybeSingle();

  // Authenticated loyalty mutations must belong to the restaurant owner
  // (or a platform admin). Service paths may omit actorUserId.
  if (actorUserId && !bypassAdmin) {
    const ownerId =
      typeof (restaurant as { owner_id?: string } | null)?.owner_id === "string"
        ? (restaurant as { owner_id: string }).owner_id
        : null;
    if (!ownerId || ownerId !== actorUserId) {
      return {
        ok: false,
        message: "You do not have access to this restaurant.",
        plan: "Starter",
      };
    }
  }

  const effective = await resolveEffectiveOwnerSubscription(client, restaurantId);
  let plan = effective?.locationPlan ?? "";

  if (!plan) {
    plan =
      typeof restaurant?.subscription_plan === "string" &&
      restaurant.subscription_plan.trim()
        ? restaurant.subscription_plan.trim()
        : "Starter";
  }

  if (bypassAdmin || planAllowsLoyalty(plan)) {
    return { ok: true, plan, bypassAdmin };
  }

  return { ok: false, message: LOYALTY_UPGRADE_MESSAGE, plan };
}
