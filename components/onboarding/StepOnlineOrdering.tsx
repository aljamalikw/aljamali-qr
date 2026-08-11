"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { ToggleSwitch } from "@/components/dashboard/settings/ToggleSwitch";
import { planAllowsOnlineOrdering } from "@/lib/subscriptions/plans";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepOnlineOrderingProps {
  restaurant: Restaurant | null;
  plan: string | null | undefined;
  onBack: () => void;
  onContinue: (enabled: boolean) => Promise<string | null>;
  onSkip: () => Promise<void>;
}

export function StepOnlineOrdering({
  restaurant,
  plan,
  onBack,
  onContinue,
  onSkip,
}: StepOnlineOrderingProps) {
  const allowed = planAllowsOnlineOrdering(plan);
  const [enabled, setEnabled] = useState(
    restaurant?.online_ordering_enabled ?? false,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setLoading(true);
    setError("");
    const message = await onContinue(allowed ? enabled : false);
    setLoading(false);
    if (message) setError(message);
  };

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
            Online Ordering
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-white">
            Upgrade to unlock ordering
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Online ordering and Kitchen Display are included on Professional and
            Enterprise. You can finish setup now and upgrade later — this step
            will not block onboarding.
          </p>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-5 text-sm text-white/70">
          <p className="font-medium text-gold">Included via plan features</p>
          <ul className="mt-3 list-disc space-y-1 ps-5 text-white/55">
            <li>Guest cart on the public menu</li>
            <li>Orders dashboard</li>
            <li>Kitchen Display</li>
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
          Online Ordering
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">
          Enable online ordering?
        </h2>
        <p className="mt-2 text-sm text-white/55">
          Let guests place orders from your QR menu and manage them in Orders /
          Kitchen Display.
        </p>
      </div>

      <div className="rounded-2xl border border-gold/15 bg-black/25 p-4">
        <ToggleSwitch
          checked={enabled}
          onChange={setEnabled}
          label="Enable online ordering"
          description="Also turns on Kitchen Display for your team"
        />
      </div>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

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
        <AuthButton type="button" onClick={() => void handleContinue()} loading={loading}>
          Save & Continue
        </AuthButton>
      </div>
    </div>
  );
}
