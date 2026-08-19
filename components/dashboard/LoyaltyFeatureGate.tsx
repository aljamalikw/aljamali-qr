"use client";

import type { ReactNode } from "react";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { isAdminRole } from "@/lib/auth/roles";
import { planAllowsLoyalty } from "@/lib/subscriptions/plans";
import { LoyaltyUpgradeCard } from "./LoyaltyUpgradeCard";

/**
 * Keeps Loyalty nav visible, but replaces page content for plans without
 * PLAN_FEATURES.loyalty. Platform admins always retain access.
 *
 * Compose inside the feature client module so gated UI is not passed through
 * an RSC children slot (same pattern as OnlineOrderingFeatureGate).
 */
export function LoyaltyFeatureGate({ children }: { children: ReactNode }) {
  const { access, loading: accessLoading } = useSubscriptionAccess();
  const { role, loading: authLoading } = useAuthUser();

  if (accessLoading || authLoading) {
    return (
      <div className="dashboard-card rounded-2xl p-6 sm:p-8">
        <FormSkeleton />
      </div>
    );
  }

  if (isAdminRole(role) || planAllowsLoyalty(access.locationPlan)) {
    return <>{children}</>;
  }

  return <LoyaltyUpgradeCard />;
}
