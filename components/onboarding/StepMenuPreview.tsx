"use client";

import Link from "next/link";
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
          Open your public menu in a new tab to confirm everything looks right
          before finishing setup.
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

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <AuthButton type="button" variant="secondary" onClick={onBack}>
          Back
        </AuthButton>
        <AuthButton type="button" onClick={() => void onContinue()}>
          Continue
        </AuthButton>
      </div>
    </div>
  );
}
