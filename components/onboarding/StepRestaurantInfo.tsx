"use client";

import { useEffect, useState, type ReactNode } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import {
  PREFERRED_LANGUAGE_OPTIONS,
  RESTAURANT_TYPE_OPTIONS,
} from "@/lib/onboarding/constants";
import type { RestaurantInfoFormData } from "@/lib/onboarding/types";
import { TIMEZONE_OPTIONS } from "@/lib/restaurants/constants";
import type { Restaurant } from "@/lib/restaurants/types";
import type { OnboardingPreviewData } from "./OnboardingPreview";

interface StepRestaurantInfoProps {
  restaurant: Restaurant | null;
  onContinue: (values: RestaurantInfoFormData) => Promise<string | null>;
  onPreviewChange?: (partial: Partial<OnboardingPreviewData>) => void;
}

const selectClass =
  "w-full appearance-none cursor-pointer rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-sm text-white backdrop-blur-sm transition-colors focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20";

function buildInitialForm(restaurant: Restaurant | null): RestaurantInfoFormData {
  return {
    restaurantName: restaurant?.restaurant_name?.trim() ?? "",
    restaurantType: restaurant?.restaurant_type?.trim() ?? "",
    ownerName: restaurant?.owner_name?.trim() ?? "",
    phone: restaurant?.phone?.trim() ?? "",
    whatsapp: restaurant?.whatsapp_number?.trim() ?? "",
    email: restaurant?.email?.trim() ?? "",
    website: restaurant?.website?.trim() ?? "",
    addressEn: restaurant?.address_en?.trim() ?? "",
    city: restaurant?.city?.trim() ?? "",
    country: restaurant?.country?.trim() ?? "",
    googleMapsUrl: restaurant?.google_maps_url?.trim() ?? "",
    openingHours: restaurant?.opening_hours?.trim() ?? "",
    timezone: restaurant?.timezone || "Asia/Kuwait",
    preferredLanguage: restaurant?.preferred_language?.trim() || "en",
  };
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-gold/80">
      {children}
    </p>
  );
}

export function StepRestaurantInfo({
  restaurant,
  onContinue,
  onPreviewChange,
}: StepRestaurantInfoProps) {
  const [form, setForm] = useState<RestaurantInfoFormData>(() =>
    buildInitialForm(restaurant),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof RestaurantInfoFormData>(
    key: K,
    value: RestaurantInfoFormData[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) setErrors((previous) => ({ ...previous, [key]: "" }));
    setFormError("");
  };

  useEffect(() => {
    onPreviewChange?.({
      restaurantName: form.restaurantName,
      restaurantType: form.restaurantType,
      city: form.city,
    });
  }, [form.restaurantName, form.restaurantType, form.city, onPreviewChange]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.restaurantName.trim()) {
      next.restaurantName = "Please enter your restaurant name.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");
    const message = await onContinue(form);
    setLoading(false);

    if (message) {
      setFormError(message);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Restaurant Information
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/55">
          Tell us about your restaurant. This powers your public menu, QR codes,
          and dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8" noValidate>
        <section className="rounded-2xl border border-gold/15 bg-black/25 p-5 sm:p-6">
          <SectionTitle>Basics</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthInput
              label="Restaurant Name *"
              placeholder="Saffron Garden"
              value={form.restaurantName}
              onChange={(event) => update("restaurantName", event.target.value)}
              error={errors.restaurantName}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
                Restaurant Type
              </label>
              <select
                value={form.restaurantType}
                onChange={(event) => update("restaurantType", event.target.value)}
                className={selectClass}
              >
                <option value="">Select a type</option>
                {RESTAURANT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4">
            <AuthInput
              label="Owner Name"
              placeholder="Ahmed Al Jamali"
              value={form.ownerName}
              onChange={(event) => update("ownerName", event.target.value)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gold/15 bg-black/25 p-5 sm:p-6">
          <SectionTitle>Contact</SectionTitle>
          <div className="grid gap-4 sm:grid-cols-2">
            <AuthInput
              label="Phone Number"
              type="tel"
              autoComplete="tel"
              placeholder="+965 5000 0000"
              value={form.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
            <AuthInput
              label="WhatsApp Number"
              type="tel"
              placeholder="+965 5000 0000"
              value={form.whatsapp}
              onChange={(event) => update("whatsapp", event.target.value)}
            />
            <AuthInput
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="hello@restaurant.com"
              value={form.email}
              onChange={(event) => update("email", event.target.value)}
            />
            <AuthInput
              label="Website"
              type="url"
              placeholder="https://restaurant.com"
              value={form.website}
              onChange={(event) => update("website", event.target.value)}
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gold/15 bg-black/25 p-5 sm:p-6">
          <SectionTitle>Location & Hours</SectionTitle>
          <div className="space-y-4">
            <AuthInput
              label="Address"
              placeholder="Street, building, block"
              value={form.addressEn}
              onChange={(event) => update("addressEn", event.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthInput
                label="City"
                placeholder="Kuwait City"
                value={form.city}
                onChange={(event) => update("city", event.target.value)}
              />
              <AuthInput
                label="Country"
                placeholder="Kuwait"
                value={form.country}
                onChange={(event) => update("country", event.target.value)}
              />
            </div>
            <AuthInput
              label="Google Maps URL"
              type="url"
              placeholder="https://maps.google.com/…"
              value={form.googleMapsUrl}
              onChange={(event) => update("googleMapsUrl", event.target.value)}
            />
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
                Working Hours
              </label>
              <textarea
                value={form.openingHours}
                onChange={(event) => update("openingHours", event.target.value)}
                rows={2}
                placeholder={"Sat–Thu: 12:00–23:00\nFri: 13:00–23:30"}
                className="w-full resize-none rounded-xl border border-gold/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/35 backdrop-blur-sm focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
                  Timezone
                </label>
                <select
                  value={form.timezone}
                  onChange={(event) => update("timezone", event.target.value)}
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
                  Preferred Language
                </label>
                <select
                  value={form.preferredLanguage}
                  onChange={(event) =>
                    update("preferredLanguage", event.target.value)
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
          </div>
        </section>

        {formError && (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        )}

        <div className="sticky bottom-0 -mx-1 border-t border-white/[0.06] bg-black/80 px-1 pt-4 pb-1 backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
          <AuthButton type="submit" loading={loading} className="w-full py-3.5 text-base">
            Save & Continue
          </AuthButton>
        </div>
      </form>
    </div>
  );
}
