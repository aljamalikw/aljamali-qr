"use client";

import { AuthButton } from "@/components/auth/AuthButton";

interface StepWelcomeProps {
  onContinue: () => Promise<void> | void;
}

export function StepWelcome({ onContinue }: StepWelcomeProps) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
          Welcome
        </p>
        <h1 className="mt-2 font-serif text-3xl font-bold text-white">
          Let&apos;s set up your restaurant
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-white/55">
          In a few guided steps you&apos;ll add restaurant details, branding,
          categories, menu items, and your first QR code. Progress is saved
          automatically — you can leave and resume anytime.
        </p>
      </div>

      <ul className="space-y-2 rounded-2xl border border-gold/15 bg-black/25 px-4 py-4 text-sm text-white/70">
        {[
          "Restaurant details",
          "Branding",
          "Categories & menu",
          "QR code + public menu preview",
        ].map((item) => (
          <li key={item} className="flex items-center gap-2">
            <span className="text-gold">✓</span>
            {item}
          </li>
        ))}
      </ul>

      <AuthButton type="button" onClick={() => void onContinue()}>
        Get Started
      </AuthButton>
    </div>
  );
}
