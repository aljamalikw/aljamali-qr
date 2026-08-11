import { supabase } from "@/lib/supabase";
import { logAdminActivity } from "@/lib/admin/activity-log";
import { planAllowsLoyalty } from "@/lib/subscriptions/plans";
import {
  ensureRestaurantSubscription,
  fetchOwnerSubscription,
  updateSubscription,
  type RestaurantSubscription,
  type SubscriptionPlan,
} from "@/lib/admin/subscriptions";
import {
  deriveRestaurantManagementStatus,
  type RestaurantStatusFilter,
} from "@/lib/admin/restaurant-status";
import type { Restaurant } from "@/lib/restaurants/types";

export type ManageRestaurantDetails = {
  restaurant: Restaurant;
  subscription: RestaurantSubscription | null;
  status: RestaurantStatusFilter;
  counts: {
    qrCodes: number;
    menuItems: number;
    categories: number;
    orders: number;
    reservations: number;
  };
  publicMenuUrl: string | null;
};

export async function fetchManageRestaurantDetails(
  restaurantId: string,
): Promise<
  | { ok: true; data: ManageRestaurantDetails }
  | { ok: false; message: string }
> {
  try {
    const { data: restaurant, error } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .maybeSingle();

    if (error || !restaurant) {
      return {
        ok: false,
        message: error?.message || "Restaurant not found.",
      };
    }

    const typed = restaurant as Restaurant;
    const subResult = await fetchOwnerSubscription(restaurantId);
    if (!subResult.ok) {
      return { ok: false, message: subResult.message };
    }

    const subscription = subResult.data;
    const status = deriveRestaurantManagementStatus({
      isActive: typed.is_active !== false,
      isArchived: Boolean(typed.is_archived),
      restaurantName: typed.restaurant_name,
      subscriptionStatus: subscription?.status,
      trialEndsAt: subscription?.trialEndsAt,
      trialStartedAt: subscription?.trialStartedAt,
      gracePeriodDays: subscription?.gracePeriodDays,
      renewalDate: subscription?.renewalDate,
      cancelledAt: subscription?.cancelledAt,
      plan: subscription?.plan ?? typed.subscription_plan,
    });

    const [
      qrResult,
      menuResult,
      categoryResult,
      orderResult,
      reservationResult,
    ] = await Promise.all([
      supabase
        .from("qr_codes")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId)
        .neq("is_archived", true),
      supabase
        .from("menu_items")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId),
      supabase
        .from("categories")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId),
      supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId),
      supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("restaurant_id", restaurantId),
    ]);

    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const publicMenuUrl = typed.slug
      ? `${origin}/menu/${typed.slug}`
      : null;

    return {
      ok: true,
      data: {
        restaurant: typed,
        subscription,
        status,
        counts: {
          qrCodes: qrResult.count ?? 0,
          menuItems: menuResult.count ?? 0,
          categories: categoryResult.count ?? 0,
          orders: orderResult.count ?? 0,
          reservations: reservationResult.count ?? 0,
        },
        publicMenuUrl,
      },
    };
  } catch {
    return { ok: false, message: "Unable to load restaurant details." };
  }
}

export async function adminUpgradeRestaurantPlan(
  restaurantId: string,
  plan: SubscriptionPlan,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const ensured = await ensureRestaurantSubscription(restaurantId, plan);
    if (!ensured.ok) return ensured;

    const updated = await updateSubscription({
      id: ensured.data.id,
      restaurantId,
      plan,
      status: "active",
    });

    if (!updated.ok) return updated;

    const previousPlan = ensured.data.plan;
    const rank: Record<string, number> = {
      Starter: 1,
      Professional: 2,
      Enterprise: 3,
    };
    const action =
      (rank[plan] ?? 0) < (rank[previousPlan] ?? 0)
        ? "plan_downgraded"
        : "plan_upgraded";

    void logAdminActivity({
      action,
      restaurantId,
      entityType: "subscription",
      entityId: ensured.data.id,
      oldValues: { plan: previousPlan },
      newValues: { plan },
      details: { plan, previousPlan },
    });
    void logAdminActivity({
      action: "subscription_changed",
      restaurantId,
      entityType: "subscription",
      entityId: ensured.data.id,
      oldValues: { plan: previousPlan },
      newValues: { plan, status: "active" },
    });

    const loyaltyWasOn = planAllowsLoyalty(previousPlan);
    const loyaltyNowOn = planAllowsLoyalty(plan);
    if (!loyaltyWasOn && loyaltyNowOn) {
      void logAdminActivity({
        action: "loyalty_enabled",
        restaurantId,
        entityType: "subscription",
        entityId: ensured.data.id,
        oldValues: { plan: previousPlan, loyalty: false },
        newValues: { plan, loyalty: true },
      });
    } else if (loyaltyWasOn && !loyaltyNowOn) {
      void logAdminActivity({
        action: "loyalty_disabled",
        restaurantId,
        entityType: "subscription",
        entityId: ensured.data.id,
        oldValues: { plan: previousPlan, loyalty: true },
        newValues: { plan, loyalty: false },
      });
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to upgrade plan." };
  }
}

export async function adminExtendTrial(
  restaurantId: string,
  days = 7,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const ensured = await ensureRestaurantSubscription(restaurantId);
    if (!ensured.ok) return ensured;

    const currentEnd = ensured.data.trialEndsAt
      ? new Date(ensured.data.trialEndsAt)
      : new Date();
    const base =
      !Number.isNaN(currentEnd.getTime()) && currentEnd.getTime() > Date.now()
        ? currentEnd
        : new Date();
    base.setUTCDate(base.getUTCDate() + days);

    const updated = await updateSubscription({
      id: ensured.data.id,
      restaurantId,
      status: "trial",
      trialEndsAt: base.toISOString(),
    });

    if (!updated.ok) return updated;
    void logAdminActivity({
      action: "trial_extended",
      restaurantId,
      details: { days },
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to extend trial." };
  }
}

export async function adminResetTrial(
  restaurantId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const ensured = await ensureRestaurantSubscription(restaurantId);
    if (!ensured.ok) return ensured;

    const updated = await updateSubscription({
      id: ensured.data.id,
      restaurantId,
      status: "trial",
    });

    if (!updated.ok) return updated;
    void logAdminActivity({
      action: "subscription_changed",
      restaurantId,
      entityType: "subscription",
      entityId: ensured.data.id,
      oldValues: { status: ensured.data.status },
      newValues: { status: "trial" },
      details: { resetTrial: true },
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to reset trial." };
  }
}

export async function adminCancelSubscription(
  restaurantId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const ensured = await ensureRestaurantSubscription(restaurantId);
    if (!ensured.ok) return ensured;

    const updated = await updateSubscription({
      id: ensured.data.id,
      restaurantId,
      status: "cancelled",
    });

    if (!updated.ok) return updated;
    void logAdminActivity({
      action: "subscription_cancelled",
      restaurantId,
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to cancel subscription." };
  }
}

export async function adminReactivateSubscription(
  restaurantId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const ensured = await ensureRestaurantSubscription(restaurantId);
    if (!ensured.ok) return ensured;

    const updated = await updateSubscription({
      id: ensured.data.id,
      restaurantId,
      status: "active",
    });

    if (!updated.ok) return updated;
    void logAdminActivity({
      action: "subscription_reactivated",
      restaurantId,
    });
    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to reactivate subscription." };
  }
}
