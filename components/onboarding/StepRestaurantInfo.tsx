"use client";

import { useRef, useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import {
  CUISINE_OPTIONS,
  RESTAURANT_TYPE_OPTIONS,
} from "@/lib/onboarding/constants";
import type { RestaurantInfoFormData } from "@/lib/onboarding/types";
import { uploadBrandingAsset } from "@/lib/onboarding/uploadBrandingAsset";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepRestaurantInfoProps {
  restaurant: Restaurant | null;
  onContinue: (values: RestaurantInfoFormData) => Promise<string | null>;
}

const selectClass = "auth-input w-full appearance-none cursor-pointer";

function buildInitialForm(restaurant: Restaurant | null): RestaurantInfoFormData {
  return {
    restaurantName: restaurant?.restaurant_name?.trim() ?? "",
    restaurantType: restaurant?.restaurant_type?.trim() ?? "",
    cuisineType: restaurant?.cuisine_type?.trim() ?? "",
    aboutUs: restaurant?.about_us?.trim() ?? "",
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
    logoUrl: restaurant?.logo_url?.trim() ?? "",
  };
}

export function StepRestaurantInfo({
  restaurant,
  onContinue,
}: StepRestaurantInfoProps) {
  const [form, setForm] = useState<RestaurantInfoFormData>(() =>
    buildInitialForm(restaurant),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const update = <K extends keyof RestaurantInfoFormData>(
    key: K,
    value: RestaurantInfoFormData[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    if (errors[key]) setErrors((previous) => ({ ...previous, [key]: "" }));
    setFormError("");
  };

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
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Tell us about your restaurant
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          This powers your public menu, QR codes, and dashboard.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
              Cuisine
            </label>
            <select
              value={form.cuisineType}
              onChange={(event) => update("cuisineType", event.target.value)}
              className={selectClass}
            >
              <option value="">Select cuisine</option>
              {CUISINE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
            Description
          </label>
          <textarea
            value={form.aboutUs}
            onChange={(event) => update("aboutUs", event.target.value)}
            rows={3}
            placeholder="Optional — tell guests about your restaurant"
            className="auth-input w-full resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
            Logo
          </label>
          <div className="flex items-center gap-3">
            {form.logoUrl.trim() ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={form.logoUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-xl border border-gold/15 object-cover"
              />
            ) : (
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-gold/20 bg-black/20 text-[9px] uppercase tracking-wider text-white/30">
                None
              </div>
            )}
            <div className="min-w-0 flex-1 space-y-2">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  setUploadingLogo(true);
                  const result = await uploadBrandingAsset(file);
                  setUploadingLogo(false);
                  if (result.ok) update("logoUrl", result.url);
                  else setFormError(result.message);
                  if (logoInputRef.current) logoInputRef.current.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
                className="menu-btn-secondary text-xs disabled:opacity-50"
              >
                {uploadingLogo ? "Uploading…" : "Upload logo"}
              </button>
              <p className="text-[11px] text-white/35">Optional — you can add this later.</p>
            </div>
          </div>
        </div>

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

        <AuthInput
          label="Owner Name"
          placeholder="Ahmed Al Jamali"
          value={form.ownerName}
          onChange={(event) => update("ownerName", event.target.value)}
        />

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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
            className="auth-input w-full resize-none"
          />
        </div>

        {formError && (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        )}

        <AuthButton type="submit" loading={loading} className="mt-2">
          Save & Continue
        </AuthButton>
      </form>
    </div>
  );
}
