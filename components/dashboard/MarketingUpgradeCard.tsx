"use client";

import { plansWithFeature } from "@/lib/subscriptions/plans";
import { PlanRequiredCard } from "./PlanRequiredCard";

const INCLUDED_PLANS = plansWithFeature("marketing");

export function MarketingUpgradeCard() {
  return (
    <PlanRequiredCard
      title="Marketing Center"
      description="Send WhatsApp Share campaigns to opted-in CRM customers — free WhatsApp Web / Business app workflow for Professional and Enterprise."
      includedIn={INCLUDED_PLANS}
    />
  );
}
