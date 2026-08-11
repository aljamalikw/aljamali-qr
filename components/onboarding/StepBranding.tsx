"use client";

import { useRef, useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthInput } from "@/components/auth/AuthInput";
import { ToggleSwitch } from "@/components/dashboard/settings/ToggleSwitch";
import { FONT_STYLE_OPTIONS } from "@/lib/onboarding/constants";
import type { BrandingFormData } from "@/lib/onboarding/types";
import { uploadBrandingAsset } from "@/lib/onboarding/uploadBrandingAsset";
import type { Restaurant } from "@/lib/restaurants/types";

interface StepBrandingProps {
  restaurant: Restaurant | null;
  onBack: () => void;
  onContinue: (values: BrandingFormData) => Promise<string | null>;
  onSkip?: () => Promise<string | null> | string | null | Promise<void> | void;
}

const selectClass = "auth-input w-full appearance-none cursor-pointer";

function buildInitialForm(restaurant: Restaurant | null): BrandingFormData {
  return {
    logoUrl: restaurant?.logo_url?.trim() ?? "",
    coverUrl: restaurant?.cover_url?.trim() ?? "",
    faviconUrl: restaurant?.favicon_url?.trim() ?? "",
    themePrimaryColor: restaurant?.theme_primary_color?.trim() || "#d4af37",
    menuAccentColor: restaurant?.menu_accent_color?.trim() || "#d4af37",
    fontStyle: restaurant?.font_style?.trim() || "serif",
    darkModeDefault: restaurant?.dark_mode_default ?? true,
  };
}

interface AssetFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

function AssetField({ label, value, onChange }: AssetFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const result = await uploadBrandingAsset(file);
    setUploading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    onChange(result.url);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
        {label}
      </label>
      <div className="flex items-center gap-3">
        {value.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-12 w-12 shrink-0 rounded-lg border border-gold/15 object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-gold/20 bg-black/20 text-[9px] uppercase tracking-wider text-white/30">
            None
          </div>
        )}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://…"
          className="auth-input min-w-0 flex-1"
        />
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="auth-btn-secondary shrink-0 whitespace-nowrap !w-auto px-3 py-2 text-xs disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function StepBranding({
  restaurant,
  onBack,
  onContinue,
  onSkip,
}: StepBrandingProps) {
  const [form, setForm] = useState<BrandingFormData>(() =>
    buildInitialForm(restaurant),
  );
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = <K extends keyof BrandingFormData>(
    key: K,
    value: BrandingFormData[K],
  ) => {
    setForm((previous) => ({ ...previous, [key]: value }));
    setFormError("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setFormError("");
    const message = await onContinue(form);
    setLoading(false);
    if (message) setFormError(message);
  };

  const previewName = restaurant?.restaurant_name?.trim() || "Your Restaurant";
  const fontClass =
    form.fontStyle === "sans"
      ? "font-sans"
      : form.fontStyle === "rounded"
        ? "font-sans"
        : "font-serif";

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Upload your logo
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-white/50">
          Add a logo and optional branding. You can skip and finish this later.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AssetField
          label="Logo"
          value={form.logoUrl}
          onChange={(url) => update("logoUrl", url)}
        />
        <AssetField
          label="Cover Image"
          value={form.coverUrl}
          onChange={(url) => update("coverUrl", url)}
        />
        <AssetField
          label="Favicon"
          value={form.faviconUrl}
          onChange={(url) => update("faviconUrl", url)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
              Theme Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.themePrimaryColor}
                onChange={(event) => update("themePrimaryColor", event.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent"
              />
              <input
                value={form.themePrimaryColor}
                onChange={(event) => update("themePrimaryColor", event.target.value)}
                className="auth-input min-w-0 flex-1"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
              Menu Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.menuAccentColor}
                onChange={(event) => update("menuAccentColor", event.target.value)}
                className="h-10 w-12 shrink-0 cursor-pointer rounded border border-white/10 bg-transparent"
              />
              <input
                value={form.menuAccentColor}
                onChange={(event) => update("menuAccentColor", event.target.value)}
                className="auth-input min-w-0 flex-1"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
            Font Style
          </label>
          <select
            value={form.fontStyle}
            onChange={(event) => update("fontStyle", event.target.value)}
            className={selectClass}
          >
            {FONT_STYLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <ToggleSwitch
          checked={form.darkModeDefault}
          onChange={(value) => update("darkModeDefault", value)}
          label="Dark theme by default"
          description="Guests will see your menu in dark mode first (they can switch)"
        />

        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wider text-white/45">
            Live Preview
          </p>
          <div
            className="overflow-hidden rounded-2xl border p-5 transition-colors duration-300"
            style={{
              borderColor: `${form.themePrimaryColor}33`,
              background: form.darkModeDefault
                ? "linear-gradient(145deg, rgba(20,20,20,0.95), rgba(8,8,8,0.98))"
                : "linear-gradient(145deg, #fafafa, #f0f0f0)",
            }}
          >
            <div className="flex items-center gap-3">
              {form.logoUrl.trim() ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.logoUrl}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover"
                  style={{ border: `1.5px solid ${form.themePrimaryColor}` }}
                />
              ) : (
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold"
                  style={{
                    border: `1.5px solid ${form.themePrimaryColor}`,
                    color: form.themePrimaryColor,
                  }}
                >
                  {previewName.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p
                  className={`${fontClass} text-base font-bold ${form.darkModeDefault ? "text-white" : "text-black"}`}
                >
                  {previewName}
                </p>
                <p className="text-[11px]" style={{ color: form.themePrimaryColor }}>
                  Digital Menu
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-3 py-2">
              <span
                className={`${fontClass} text-sm ${form.darkModeDefault ? "text-white/80" : "text-black/80"}`}
              >
                Grilled Salmon
              </span>
              <span className="text-sm font-semibold" style={{ color: form.menuAccentColor }}>
                6.500 KD
              </span>
            </div>
          </div>
        </div>

        {formError && (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        )}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <AuthButton type="button" variant="secondary" onClick={onBack} className="flex-1">
            Back
          </AuthButton>
          {onSkip ? (
            <AuthButton
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={loading}
              onClick={async () => {
                setLoading(true);
                setFormError("");
                const message = await onSkip();
                setLoading(false);
                if (typeof message === "string" && message) setFormError(message);
              }}
            >
              Skip for now
            </AuthButton>
          ) : null}
          <AuthButton type="submit" loading={loading} className="flex-1">
            Save & Continue
          </AuthButton>
        </div>
      </form>
    </div>
  );
}
