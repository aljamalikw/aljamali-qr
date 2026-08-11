"use client";

import type { ReactNode } from "react";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { isAdminRole } from "@/lib/auth/roles";
import { planAllowsMarketing } from "@/lib/subscriptions/plans";
import { MarketingUpgradeCard } from "./MarketingUpgradeCard";

/**
 * Keeps Marketing nav visible, but replaces page content when
 * PLAN_FEATURES.marketing is false. Platform admins always retain access.
 */
export function MarketingFeatureGate({ children }: { children: ReactNode }) {
  const { access, loading: accessLoading } = useSubscriptionAccess();
  const { role, loading: authLoading } = useAuthUser();

  if (accessLoading || authLoading) {
    return (
      <div className="dashboard-card rounded-2xl p-6 sm:p-8">
        <FormSkeleton />
      </div>
    );
  }

  if (isAdminRole(role) || planAllowsMarketing(access.plan)) {
    return <>{children}</>;
  }

  return <MarketingUpgradeCard />;
}
