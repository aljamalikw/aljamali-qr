"use client";

import { plansWithFeature } from "@/lib/subscriptions/plans";
import { PlanRequiredCard } from "./PlanRequiredCard";

const FEATURES = [
  "Online Ordering",
  "Order Management",
  "Kitchen Display",
  "Order Analytics",
  "Revenue Reports",
] as const;

const INCLUDED_PLANS = plansWithFeature("onlineOrdering");

export function OnlineOrderingUpgradeCard() {
  return (
    <PlanRequiredCard
      title="Online Ordering is not available on your current plan"
      description="Upgrade to unlock online ordering and order management on plans that include this feature."
      features={FEATURES}
      includedIn={INCLUDED_PLANS}
    />
  );
}
