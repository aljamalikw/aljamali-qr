"use client";

import type { ReactNode } from "react";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { planAllowsOnlineOrdering } from "@/lib/subscriptions/plans";
import { OnlineOrderingUpgradeCard } from "./OnlineOrderingUpgradeCard";

/**
 * Keeps Orders / Kitchen nav visible, but replaces page content for Starter
 * using the shared planAllowsOnlineOrdering() gate.
 */
export function OnlineOrderingFeatureGate({
  children,
}: {
  children: ReactNode;
}) {
  const { access, loading } = useSubscriptionAccess();

  if (loading) {
    return (
      <div className="dashboard-card rounded-2xl p-6 sm:p-8">
        <FormSkeleton />
      </div>
    );
  }

  if (!planAllowsOnlineOrdering(access.plan)) {
    return <OnlineOrderingUpgradeCard />;
  }

  return <>{children}</>;
}
