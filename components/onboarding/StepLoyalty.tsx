"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { planAllowsLoyalty } from "@/lib/subscriptions/plans";

interface StepLoyaltyProps {
  plan: string | null | undefined;
  onBack: () => void;
  onContinue: () => Promise<void>;
  onSkip: () => Promise<void>;
}

export function StepLoyalty({
  plan,
  onBack,
  onContinue,
  onSkip,
}: StepLoyaltyProps) {
  const allowed = planAllowsLoyalty(plan);
  const [loading, setLoading] = useState(false);

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
            Loyalty
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-white">
            Loyalty & Rewards
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Points, tiers, and rewards are included when your plan enables
            Loyalty. Continue setup now — upgrade anytime.
          </p>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-5 text-sm text-white/70">
          <p className="font-medium text-gold">Included via plan features</p>
          <ul className="mt-3 list-disc space-y-1 ps-5 text-white/55">
            <li>Customer loyalty points</li>
            <li>Membership tiers</li>
            <li>CRM loyalty profile</li>
          </ul>
          <Link
            href="/dashboard/subscription"
            className="menu-btn-secondary mt-4 inline-flex"
          >
            View Plans
          </Link>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <AuthButton type="button" variant="secondary" onClick={onBack}>
            Back
          </AuthButton>
          <AuthButton type="button" onClick={() => void onSkip()}>
            Continue Setup
          </AuthButton>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
          Loyalty
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">
          Loyalty is ready on your plan
        </h2>
        <p className="mt-2 text-sm text-white/55">
          Award points from Customer CRM after guests order or visit. Open
          Loyalty anytime from the dashboard to manage rewards.
        </p>
      </div>

      <ul className="space-y-2 rounded-2xl border border-gold/15 bg-black/25 px-4 py-4 text-sm text-white/70">
        {[
          "Points live on each customer profile",
          "Adjust balances from Loyalty / CRM",
          "Ready for tiers and rewards metadata",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="text-gold">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <AuthButton type="button" variant="secondary" onClick={onBack} disabled={loading}>
          Back
        </AuthButton>
        <AuthButton
          type="button"
          variant="secondary"
          onClick={() => void onSkip()}
          disabled={loading}
        >
          Skip
        </AuthButton>
        <AuthButton
          type="button"
          loading={loading}
          onClick={async () => {
            setLoading(true);
            await onContinue();
            setLoading(false);
          }}
        >
          Continue
        </AuthButton>
      </div>
    </div>
  );
}
