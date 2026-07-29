"use client";

import { useEffect, useRef, useState } from "react";
import { AuthButton } from "@/components/auth/AuthButton";
import { ToggleSwitch } from "@/components/dashboard/settings/ToggleSwitch";
import { FONT_STYLE_OPTIONS } from "@/lib/onboarding/constants";
import type { BrandingFormData } from "@/lib/onboarding/types";
import { uploadBrandingAsset } from "@/lib/onboarding/uploadBrandingAsset";
import type { Restaurant } from "@/lib/restaurants/types";
import type { OnboardingPreviewData } from "./OnboardingPreview";

interface StepBrandingProps {
  restaurant: Restaurant | null;
  onBack: () => void;
  onContinue: (values: BrandingFormData) => Promise<string | null>;
  onPreviewChange?: (partial: Partial<OnboardingPreviewData>) => void;
}

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
  hint?: string;
  value: string;
  onChange: (url: string) => void;
}

function AssetField({ label, hint, value, onChange }: AssetFieldProps) {
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
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
          {label}
        </label>
        {hint ? <p className="mt-1 text-xs text-white/35">{hint}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        {value.trim() ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={value}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl border border-gold/20 object-cover"
          />
        ) : (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-dashed border-gold/25 bg-black/30 text-[9px] uppercase tracking-wider text-white/30">
            Upload
          </div>
        )}
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="https://… or upload"
          className="min-w-0 flex-1 rounded-xl border border-gold/20 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/35 backdrop-blur-sm focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
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
          className="auth-btn-secondary shrink-0 whitespace-nowrap !w-auto px-3 py-2.5 text-xs disabled:opacity-60"
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
  onPreviewChange,
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

  useEffect(() => {
    onPreviewChange?.({
      logoUrl: form.logoUrl,
      coverUrl: form.coverUrl,
      themePrimaryColor: form.themePrimaryColor,
      menuAccentColor: form.menuAccentColor,
      fontStyle: form.fontStyle,
      darkModeDefault: form.darkModeDefault,
    });
  }, [
    form.logoUrl,
    form.coverUrl,
    form.themePrimaryColor,
    form.menuAccentColor,
    form.fontStyle,
    form.darkModeDefault,
    onPreviewChange,
  ]);

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
      <div className="mb-8">
        <h1 className="font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Restaurant Appearance
        </h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/55">
          Choose your colors, fonts, and visuals. The live preview updates as
          you make changes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <section className="space-y-5 rounded-2xl border border-gold/15 bg-black/25 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold/80">
            Brand Assets
          </p>
          <AssetField
            label="Logo"
            hint="Square logo works best"
            value={form.logoUrl}
            onChange={(url) => update("logoUrl", url)}
          />
          <AssetField
            label="Cover Image"
            hint="Wide hero image for your public menu"
            value={form.coverUrl}
            onChange={(url) => update("coverUrl", url)}
          />
          <AssetField
            label="Favicon"
            value={form.faviconUrl}
            onChange={(url) => update("faviconUrl", url)}
          />
        </section>

        <section className="space-y-5 rounded-2xl border border-gold/15 bg-black/25 p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold/80">
            Theme
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
                Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={form.themePrimaryColor}
                  onChange={(event) =>
                    update("themePrimaryColor", event.target.value)
                  }
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-gold/20 bg-transparent"
                />
                <input
                  value={form.themePrimaryColor}
                  onChange={(event) =>
                    update("themePrimaryColor", event.target.value)
                  }
                  className="min-w-0 flex-1 rounded-xl border border-gold/20 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
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
                  onChange={(event) =>
                    update("menuAccentColor", event.target.value)
                  }
                  className="h-11 w-12 shrink-0 cursor-pointer rounded-xl border border-gold/20 bg-transparent"
                />
                <input
                  value={form.menuAccentColor}
                  onChange={(event) =>
                    update("menuAccentColor", event.target.value)
                  }
                  className="min-w-0 flex-1 rounded-xl border border-gold/20 bg-black/40 px-3 py-2.5 text-sm text-white focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium uppercase tracking-wider text-white/45">
              Font Style
            </label>
            <div className="grid gap-2 sm:grid-cols-3">
              {FONT_STYLE_OPTIONS.map((option) => {
                const active = form.fontStyle === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => update("fontStyle", option.value)}
                    className={`rounded-xl border px-3 py-3 text-left text-sm transition-all ${
                      active
                        ? "border-gold bg-gold/15 text-gold"
                        : "border-white/10 text-white/55 hover:border-gold/25 hover:text-white/80"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          <ToggleSwitch
            checked={form.darkModeDefault}
            onChange={(value) => update("darkModeDefault", value)}
            label="Dark menu by default"
            description="Guests see dark mode first — they can still switch"
          />
        </section>

        {formError && (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        )}

        <div className="sticky bottom-0 -mx-1 flex gap-3 border-t border-white/[0.06] bg-black/80 px-1 pt-4 pb-1 backdrop-blur-xl sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:pt-2">
          <AuthButton
            type="button"
            variant="secondary"
            onClick={onBack}
            className="flex-1 py-3.5"
          >
            Back
          </AuthButton>
          <AuthButton type="submit" loading={loading} className="flex-1 py-3.5">
            Save & Continue
          </AuthButton>
        </div>
      </form>
    </div>
  );
}
