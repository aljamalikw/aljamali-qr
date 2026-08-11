"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepFinishProps {
  restaurant: Restaurant | null;
  onBack: () => void;
  onFinish: () => Promise<void>;
}

export function StepFinish({ restaurant, onBack, onFinish }: StepFinishProps) {
  const [loading, setLoading] = useState(false);

  const handleFinish = async () => {
    setLoading(true);
    await onFinish();
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
          Finish
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">
          Congratulations!
        </h2>
        <p className="mt-2 text-sm text-white/55">
          {restaurant?.restaurant_name
            ? `${restaurant.restaurant_name} is live and ready for guests.`
            : "Your restaurant is live and ready for guests."}
        </p>
      </div>

      <ul className="space-y-2 rounded-2xl border border-gold/15 bg-black/25 px-4 py-4 text-sm text-white/70">
        {[
          "QR generated",
          "Menu published",
          "Restaurant ready",
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
        <AuthButton type="button" onClick={() => void handleFinish()} loading={loading}>
          {loading ? "Finishing…" : "Go to Dashboard"}
        </AuthButton>
      </div>
    </div>
  );
}
