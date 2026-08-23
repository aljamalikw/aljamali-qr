"use client";

import { useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { ToggleSwitch } from "@/components/dashboard/settings/ToggleSwitch";
import { PREFERRED_LANGUAGE_OPTIONS } from "@/lib/onboarding/constants";
import type { PreferencesFormData } from "@/lib/onboarding/types";
import {
  CURRENCY_OPTIONS,
  DEFAULT_CURRENCY,
  DEFAULT_TIMEZONE,
  TIMEZONE_OPTIONS,
} from "@/lib/restaurants/constants";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepPreferencesProps {
  restaurant: Restaurant | null;
  onBack: () => void;
  onContinue: (values: PreferencesFormData) => Promise<string | null>;
  onSkip: () => Promise<void>;
}

const selectClass = "auth-input w-full appearance-none cursor-pointer";

function buildInitialForm(restaurant: Restaurant | null): PreferencesFormData {
  return {
    currency: restaurant?.currency || DEFAULT_CURRENCY,
    timezone: restaurant?.timezone || DEFAULT_TIMEZONE,
    preferredLanguage: restaurant?.preferred_language?.trim() || "en",
    bilingualMenu: restaurant?.bilingual_menu ?? true,
    reservationsEnabled: restaurant?.reservations_enabled ?? true,
  };
}

export function StepPreferences({
  restaurant,
  onBack,
  onContinue,
  onSkip,
}: StepPreferencesProps) {
  const [form, setForm] = useState<PreferencesFormData>(() =>
    buildInitialForm(restaurant),
  );
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [skipping, setSkipping] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setFormError("");
    const message = await onContinue(form);
    setLoading(false);
    if (message) setFormError(message);
  };

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Restaurant preferences
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Choose how prices, language, and reservations appear. You can change
          these later in settings.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
            Currency
          </label>
          <select
            value={form.currency}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, currency: event.target.value }))
            }
            className={selectClass}
          >
            {CURRENCY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
              Timezone
            </label>
            <select
              value={form.timezone}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  timezone: event.target.value,
                }))
              }
              className={selectClass}
            >
              {TIMEZONE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
              Menu language
            </label>
            <select
              value={form.preferredLanguage}
              onChange={(event) =>
                setForm((previous) => ({
                  ...previous,
                  preferredLanguage: event.target.value,
                }))
              }
              className={selectClass}
            >
              {PREFERRED_LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-gold/15 bg-black/20 p-4">
          <ToggleSwitch
            checked={form.bilingualMenu}
            onChange={(checked) =>
              setForm((previous) => ({ ...previous, bilingualMenu: checked }))
            }
            label="Bilingual menu"
            description="Show English and Arabic on the public menu."
          />
          <ToggleSwitch
            checked={form.reservationsEnabled}
            onChange={(checked) =>
              setForm((previous) => ({
                ...previous,
                reservationsEnabled: checked,
              }))
            }
            label="Table reservations"
            description="Let guests request a table from the public menu."
          />
        </div>

        {formError ? (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <AuthButton
            type="button"
            variant="secondary"
            onClick={onBack}
            className="flex-1"
          >
            Back
          </AuthButton>
          <AuthButton type="submit" loading={loading} className="flex-1">
            Save & Continue
          </AuthButton>
        </div>

        <button
          type="button"
          disabled={skipping || loading}
          onClick={async () => {
            setSkipping(true);
            await onSkip();
            setSkipping(false);
          }}
          className="w-full text-center text-xs text-white/35 underline-offset-2 transition-colors hover:text-white/60 hover:underline disabled:opacity-50"
        >
          Skip for now
        </button>
      </form>
    </div>
  );
}
