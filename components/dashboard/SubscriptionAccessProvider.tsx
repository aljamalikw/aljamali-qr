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
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import {
  getSubscriptionAccess,
  isNavAllowed,
  type SubscriptionAccess,
} from "@/lib/subscriptions/engine";
import type { DashboardNavId } from "@/lib/dashboard/types";

const FULL_ACCESS: SubscriptionAccess = {
  effectiveStatus: "active",
  plan: "Starter",
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
    const result = await fetchOwnerSubscription(restaurant.id);
    if (!result.ok || !result.data) {
      // Missing row: ensure path may create later; allow access meanwhile.
      setAccess(
        getSubscriptionAccess({
          plan: restaurant.subscription_plan ?? "Starter",
          status: "trial",
          trialEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
          gracePeriodDays: 3,
        }),
      );
      setLoading(false);
      return;
    }

    const sub = result.data;
    setAccess(
      getSubscriptionAccess({
        plan: sub.plan,
        status: sub.status,
        trialStartedAt: sub.trialStartedAt,
        trialEndsAt: sub.trialEndsAt,
        gracePeriodDays: sub.gracePeriodDays,
        renewalDate: sub.renewalDate,
        cancelledAt: sub.cancelledAt,
      }),
    );
    setLoading(false);
  }, [restaurant]);

  useEffect(() => {
    if (restaurantLoading) return;
    void refresh();
  }, [restaurantLoading, refresh]);

  useEffect(() => {
    if (loading || restaurantLoading) return;
    if (!access.dashboardLocked) return;
    if (pathname.startsWith("/dashboard/subscription")) return;
    router.replace("/dashboard/subscription");
  }, [
    access.dashboardLocked,
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
    return {
      access: FULL_ACCESS,
      loading: false,
      refresh: async () => undefined,
      canAccessNav: () => true,
    };
  }
  return ctx;
}
