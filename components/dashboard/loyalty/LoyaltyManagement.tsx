"use client";

import Link from "next/link";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { LoyaltyFeatureGate } from "@/components/dashboard/LoyaltyFeatureGate";
import { RewardsCatalog } from "@/components/dashboard/loyalty/RewardsCatalog";

/** Public entry — Starter sees upgrade card; Pro/Enterprise/Admin see loyalty UI. */
export function LoyaltyManagement() {
  return (
    <LoyaltyFeatureGate>
      <LoyaltyManagementContent />
    </LoyaltyFeatureGate>
  );
}

function LoyaltyManagementContent() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Loyalty & Rewards
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Reward repeat customers with points, discounts, and exclusive rewards.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            label: "Points",
            body: "Award and track loyalty points per customer from the CRM.",
          },
          {
            label: "Rewards",
            body: "Prepare discounts and exclusive rewards for high-value guests.",
          },
          {
            label: "Membership tiers",
            body: "Use metadata.loyalty.tier for Bronze, Silver, and Gold programs.",
          },
        ].map((card, index) => (
          <DashboardCard key={card.label} delay={index * 0.05} className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
              {card.label}
            </p>
            <p className="mt-2 text-sm text-white/70">{card.body}</p>
          </DashboardCard>
        ))}
      </div>

      <DashboardCard className="p-5 sm:p-6">
        <p className="text-sm text-white/60">
          Customer loyalty balances live on each CRM profile. Open Customers to
          review points, tiers, and visit history for this restaurant.
        </p>
        <Link
          href="/dashboard/customers"
          className="menu-btn-secondary mt-4 inline-flex"
        >
          Open Customers
        </Link>
      </DashboardCard>

      <RewardsCatalog />
    </div>
  );
}
