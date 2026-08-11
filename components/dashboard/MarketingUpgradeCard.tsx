"use client";

import Link from "next/link";

const INCLUDED_PLANS = ["Enterprise"] as const;

export function MarketingUpgradeCard() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-2 py-10">
      <div className="dashboard-card w-full max-w-lg rounded-2xl p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/80">
          Plan feature
        </p>
        <h1 className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">
          Marketing Center
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          Create customer campaigns from your CRM — birthday, win-back, VIP, and
          more — with WhatsApp and Email-ready delivery architecture.
        </p>

        <div className="mx-auto mt-8 max-w-sm text-start">
          <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
            Included in
          </p>
          <ul className="mt-3 space-y-2.5">
            {INCLUDED_PLANS.map((plan) => (
              <li
                key={plan}
                className="flex items-center gap-2.5 text-sm text-white/70"
              >
                <span className="text-gold" aria-hidden="true">
                  ✓
                </span>
                <span>{plan}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8">
          <Link
            href="/dashboard/subscription"
            className="menu-btn-primary inline-flex"
          >
            Upgrade Plan
          </Link>
        </div>
      </div>
    </div>
  );
}
