"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { buildQrDestinationUrl, getAppBaseUrl } from "@/lib/dashboard/qr/utils";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepFinishProps {
  restaurant: Restaurant | null;
  onBack: () => void;
  onFinish: () => Promise<void>;
}

export function StepFinish({ restaurant, onBack, onFinish }: StepFinishProps) {
  const [loading, setLoading] = useState(false);
  const restaurantName = restaurant?.restaurant_name?.trim() || "Your restaurant";
  const menuUrl = buildQrDestinationUrl(restaurant?.slug, getAppBaseUrl());

  const handleFinish = async () => {
    setLoading(true);
    await onFinish();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
          Ready to launch
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">
          {restaurantName} is ready
        </h2>
        <p className="mt-2 text-sm text-white/55">
          Your public menu and dashboard are set. You can keep editing anytime.
        </p>
      </div>

      <ul className="space-y-2 rounded-2xl border border-gold/15 bg-black/25 px-4 py-4 text-sm text-white/70">
        {[
          "Restaurant details saved",
          "Menu structure ready",
          "Public menu available",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="text-gold">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <div className="grid gap-3 sm:grid-cols-2">
        <a
          href={menuUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={!menuUrl}
          className={`auth-btn-secondary flex items-center justify-center ${
            !menuUrl ? "pointer-events-none opacity-50" : ""
          }`}
        >
          View public menu
        </a>
        <AuthButton type="button" onClick={() => void handleFinish()} loading={loading}>
          {loading ? "Finishing…" : "Go to dashboard"}
        </AuthButton>
      </div>

      <AuthButton type="button" variant="secondary" onClick={onBack} disabled={loading}>
        Back
      </AuthButton>
    </div>
  );
}
