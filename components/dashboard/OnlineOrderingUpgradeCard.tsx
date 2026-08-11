"use client";

import Link from "next/link";
import { plansWithFeature } from "@/lib/subscriptions/plans";

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
    <div className="flex min-h-[60vh] items-center justify-center px-2 py-10">
      <div className="dashboard-card w-full max-w-lg rounded-2xl p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/80">
          Plan feature
        </p>
        <h1 className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">
          Online Ordering is not available on your current plan
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          Upgrade to unlock online ordering and order management on plans that
          include this feature.
        </p>

        <ul className="mx-auto mt-8 max-w-sm space-y-2.5 text-start">
          {FEATURES.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2.5 text-sm text-white/70"
            >
              <span className="text-gold" aria-hidden="true">
                ✓
              </span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="mx-auto mt-6 max-w-sm text-start">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
            Included in
          </p>
          <ul className="mt-2 space-y-1.5">
            {INCLUDED_PLANS.map((plan) => (
              <li key={plan} className="text-sm text-white/60">
                {plan}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <Link href="/dashboard/subscription" className="menu-btn-primary inline-flex">
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
