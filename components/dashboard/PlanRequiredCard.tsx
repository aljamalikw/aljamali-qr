"use client";

import Link from "next/link";
import { useSubscriptionAccess } from "./SubscriptionAccessProvider";
import { isExpiredTrialStatus } from "@/lib/subscriptions/engine";
import type { SubscriptionPlanId } from "@/lib/subscriptions/plans";

type PlanRequiredCardProps = {
  title: string;
  description: string;
  features?: readonly string[];
  includedIn?: readonly SubscriptionPlanId[];
};

export function PlanRequiredCard({
  title,
  description,
  features,
  includedIn,
}: PlanRequiredCardProps) {
  const { access } = useSubscriptionAccess();
  const trialEnded = isExpiredTrialStatus(access.effectiveStatus);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-2 py-10">
      <div className="dashboard-card w-full max-w-lg rounded-2xl p-8 text-center sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold/80">
          {trialEnded ? "Trial ended" : "Plan feature"}
        </p>
        <h1 className="mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">
          {trialEnded ? `${title} needs a paid plan` : title}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          {trialEnded
            ? "Your Professional trial has ended. Choose Starter or Professional to continue. This feature is included on Professional and Enterprise."
            : description}
        </p>

        {features && features.length > 0 ? (
          <ul className="mx-auto mt-8 max-w-sm space-y-2.5 text-start">
            {features.map((feature) => (
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
        ) : null}

        {includedIn && includedIn.length > 0 ? (
          <div className="mx-auto mt-6 max-w-sm text-start">
            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/40">
              Included in
            </p>
            <ul className="mt-2 space-y-1.5">
              {includedIn.map((plan) => (
                <li key={plan} className="text-sm text-white/60">
                  {plan}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-8">
          <Link
            href="/dashboard/subscription"
            className="menu-btn-primary inline-flex"
          >
            {trialEnded ? "Choose a plan" : "Upgrade Plan"}
          </Link>
        </div>
      </div>
    </div>
  );
}
