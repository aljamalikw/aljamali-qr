"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { ToggleSwitch } from "@/components/dashboard/settings/ToggleSwitch";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepReservationsProps {
  restaurant: Restaurant | null;
  onBack: () => void;
  onContinue: (enabled: boolean) => Promise<string | null>;
  onSkip: () => Promise<void>;
}

export function StepReservations({
  restaurant,
  onBack,
  onContinue,
  onSkip,
}: StepReservationsProps) {
  const [enabled, setEnabled] = useState(
    restaurant?.reservations_enabled ?? true,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    setLoading(true);
    setError("");
    const message = await onContinue(enabled);
    setLoading(false);
    if (message) setError(message);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
          Reservations
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">
          Accept table reservations?
        </h2>
        <p className="mt-2 text-sm text-white/55">
          Guests can request a table from your public menu. You can change this
          anytime in Restaurant Settings.
        </p>
      </div>

      <div className="rounded-2xl border border-gold/15 bg-black/25 p-4">
        <ToggleSwitch
          checked={enabled}
          onChange={setEnabled}
          label="Enable reservations"
          description="Show the reservation request form on your public menu"
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
