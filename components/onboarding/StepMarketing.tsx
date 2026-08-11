"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { saveMarketingTemplate } from "@/lib/marketing/campaigns";
import { DEFAULT_MARKETING_TEMPLATES } from "@/lib/marketing/templates";
import { planAllowsMarketing } from "@/lib/subscriptions/plans";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepMarketingProps {
  restaurant: Restaurant | null;
  plan: string | null | undefined;
  onBack: () => void;
  onContinue: () => Promise<void>;
  onSkip: () => Promise<void>;
}

export function StepMarketing({
  restaurant,
  plan,
  onBack,
  onContinue,
  onSkip,
}: StepMarketingProps) {
  const allowed = planAllowsMarketing(plan);
  const welcome = DEFAULT_MARKETING_TEMPLATES.find((t) => t.slug === "welcome")!;
  const [name, setName] = useState(welcome.name);
  const [subject, setSubject] = useState(welcome.subject);
  const [message, setMessage] = useState(welcome.message);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gold">
            Marketing
          </p>
          <h2 className="mt-2 font-serif text-2xl font-bold text-white">
            Marketing Center
          </h2>
          <p className="mt-2 text-sm text-white/55">
            Campaigns from Customer CRM are available when Marketing is enabled
            on your plan. Continue setup without blocking — upgrade when you are
            ready.
          </p>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-gold/5 px-4 py-5 text-sm text-white/70">
          <p className="font-medium text-gold">Included via plan features</p>
          <ul className="mt-3 list-disc space-y-1 ps-5 text-white/55">
            <li>Audience builder</li>
            <li>Campaign templates</li>
            <li>WhatsApp & Email-ready delivery</li>
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
          Marketing
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-white">
          Create your first template
        </h2>
        <p className="mt-2 text-sm text-white/55">
          Save a Welcome template you can reuse in Marketing Center campaigns.
        </p>
      </div>

      <div className="space-y-3">
        <AuthInput
          label="Template name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <AuthInput
          label="Subject"
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
        />
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            className="auth-input w-full resize-none"
          />
        </div>
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
        <AuthButton
          type="button"
          loading={loading}
          onClick={async () => {
            if (!restaurant?.id) {
              setError("Restaurant not found.");
              return;
            }
            setLoading(true);
            setError("");
            const result = await saveMarketingTemplate({
              restaurantId: restaurant.id,
              slug: "welcome",
              name: name.trim() || welcome.name,
              subject: subject.trim(),
              message: message.trim() || welcome.message,
            });
            setLoading(false);
            if (!result.ok) {
              setError(result.message);
              return;
            }
            await onContinue();
          }}
        >
          Save Template
        </AuthButton>
      </div>
    </div>
  );
}
