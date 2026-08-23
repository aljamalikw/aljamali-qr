"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { fetchOwnerSubscription } from "@/lib/admin/subscriptions";
import { getNavIdFromPath } from "@/lib/dashboard/nav-items";
import { resolveEffectiveOwnerSubscription } from "@/lib/subscriptions/owner-subscription";
import { supabase } from "@/lib/supabase";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import {
  getSubscriptionAccess,
  isEntitledSubscriptionStatus,
  isNavAllowed,
  type SubscriptionAccess,
} from "@/lib/subscriptions/engine";
import { DEFAULT_TRIAL_PLAN } from "@/lib/subscriptions/plans";
import type { DashboardNavId } from "@/lib/dashboard/types";

const FULL_ACCESS: SubscriptionAccess = {
  effectiveStatus: "active",
  plan: "Starter",
  locationPlan: "Starter",
  locationCovered: true,
  publicMenuOnline: true,
  dashboardLocked: false,
  allowedNavIds: [],
  inGrace: false,
  trialDaysLeft: null,
  graceDaysLeft: null,
  message: null,
};

type SubscriptionAccessContextValue = {
  access: SubscriptionAccess;
  loading: boolean;
  refresh: () => Promise<void>;
  canAccessNav: (navId: DashboardNavId) => boolean;
};

const SubscriptionAccessContext =
  createContext<SubscriptionAccessContextValue | null>(null);

export function SubscriptionAccessProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const [access, setAccess] = useState<SubscriptionAccess>(FULL_ACCESS);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!restaurant?.id) {
      setAccess(FULL_ACCESS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const [result, effective] = await Promise.all([
      fetchOwnerSubscription(restaurant.id),
      resolveEffectiveOwnerSubscription(supabase, restaurant.id),
    ]);
    if (!result.ok || !result.data) {
      // Missing row: ensure path may create later; allow access meanwhile.
      setAccess(
        getSubscriptionAccess({
          plan: restaurant.subscription_plan ?? DEFAULT_TRIAL_PLAN,
          status: "trial",
          trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          gracePeriodDays: 3,
        }),
      );
      setLoading(false);
      return;
    }

    const sub = result.data;
    const ownerPlan = effective?.ownerPlan ?? sub.plan;
    const locationCovered = effective?.locationCovered ?? true;
    const coveredLocationPlan = effective?.locationPlan ?? ownerPlan;
    const ownerAccess = getSubscriptionAccess({
      plan: ownerPlan,
      status: sub.status,
      trialStartedAt: sub.trialStartedAt,
      trialEndsAt: sub.trialEndsAt,
      gracePeriodDays: sub.gracePeriodDays,
      renewalDate: sub.renewalDate,
      cancelledAt: sub.cancelledAt,
    });
    const locationAccess = getSubscriptionAccess({
      plan: coveredLocationPlan,
      status: sub.status,
      trialStartedAt: sub.trialStartedAt,
      trialEndsAt: sub.trialEndsAt,
      gracePeriodDays: sub.gracePeriodDays,
      renewalDate: sub.renewalDate,
      cancelledAt: sub.cancelledAt,
    });
    const featurePlan = isEntitledSubscriptionStatus(ownerAccess.effectiveStatus)
      ? coveredLocationPlan
      : "Starter";
    setAccess({
      ...ownerAccess,
      locationPlan: featurePlan,
      locationCovered,
      publicMenuOnline: locationAccess.publicMenuOnline,
    });
    setLoading(false);
  }, [restaurant]);

  useEffect(() => {
    if (restaurantLoading) return;
    void refresh();
  }, [restaurantLoading, refresh]);

  useEffect(() => {
    if (loading || restaurantLoading) return;
    if (!access.dashboardLocked) return;
    if (pathname.startsWith("/restaurant/setup")) return;
    if (isNavAllowed(access, getNavIdFromPath(pathname))) return;
    router.replace("/dashboard/subscription");
  }, [
    access,
    loading,
    pathname,
    restaurantLoading,
    router,
  ]);

  const value = useMemo<SubscriptionAccessContextValue>(
    () => ({
      access,
      loading: loading || restaurantLoading,
      refresh,
      canAccessNav: (navId) => isNavAllowed(access, navId),
    }),
    [access, loading, refresh, restaurantLoading],
  );

  return (
    <SubscriptionAccessContext.Provider value={value}>
      {children}
    </SubscriptionAccessContext.Provider>
  );
}

export function useSubscriptionAccess(): SubscriptionAccessContextValue {
  const ctx = useContext(SubscriptionAccessContext);
  if (!ctx) {
    // Outside the provider (e.g. premature render): stay in loading/deny state.
    // Never report loading:false with a synthetic plan that could unlock features.
    return {
      access: FULL_ACCESS,
      loading: true,
      refresh: async () => undefined,
      canAccessNav: () => false,
    };
  }
  return ctx;
}
