"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepMenuPreviewProps {
  restaurant: Restaurant | null;
  onBack: () => void;
  onContinue: () => Promise<void> | void;
}

export function StepMenuPreview({
  restaurant,
  onBack,
  onContinue,
}: StepMenuPreviewProps) {
  const slug = restaurant?.slug?.trim();
  const href = slug ? `/menu/${slug}` : null;
  const [reviewed, setReviewed] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
          Public Menu Preview
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">
          Preview your live menu
        </h2>
        <p className="mt-2 text-sm text-white/55">
          Open your public menu and confirm everything looks right before
          continuing.
        </p>
      </div>

      <div className="rounded-2xl border border-gold/15 bg-black/25 px-4 py-5">
        <p className="text-xs uppercase tracking-wider text-white/40">
          Public URL
        </p>
        <p className="mt-2 break-all text-sm text-gold">
          {href ? href : "Complete restaurant details to generate a menu URL."}
        </p>
        {href ? (
          <Link
            href={href}
            target="_blank"
            className="menu-btn-secondary mt-4 inline-flex"
          >
            Open Public Menu
          </Link>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
        <input
          type="checkbox"
          checked={reviewed}
          onChange={(event) => {
            setReviewed(event.target.checked);
            setError("");
          }}
          className="mt-0.5 h-4 w-4 accent-[var(--gold,#d4af37)]"
        />
        <span>I have reviewed my menu.</span>
      </label>

      {error ? (
        <p className="text-sm text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <AuthButton type="button" variant="secondary" onClick={onBack}>
          Back
        </AuthButton>
        <AuthButton
          type="button"
          onClick={() => {
            if (!reviewed) {
              setError("Please confirm you have reviewed your menu.");
              return;
            }
            void onContinue();
          }}
        >
          Continue
        </AuthButton>
      </div>
    </div>
  );
}
