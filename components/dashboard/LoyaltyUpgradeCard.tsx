"use client";

import { plansWithFeature } from "@/lib/subscriptions/plans";
import { PlanRequiredCard } from "./PlanRequiredCard";

const INCLUDED_PLANS = plansWithFeature("loyalty");

export function LoyaltyUpgradeCard() {
  return (
    <PlanRequiredCard
      title="Loyalty & Rewards"
      description="Reward repeat customers with points, discounts and exclusive rewards."
      includedIn={INCLUDED_PLANS}
    />
  );
}
