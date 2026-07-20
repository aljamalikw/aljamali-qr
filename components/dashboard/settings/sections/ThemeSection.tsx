"use client";

import type {
  BorderRadiusOption,
  CardStyleOption,
  RestaurantSettingsData,
} from "@/lib/dashboard/settings/types";
import {
  SettingsField,
  SettingsSection,
  settingsInputClass,
} from "../ui/SettingsSection";

interface ThemeSectionProps {
  data: RestaurantSettingsData["theme"];
  onChange: (theme: RestaurantSettingsData["theme"]) => void;
}

const radiusOptions: { value: BorderRadiusOption; label: string }[] = [
  { value: "sm", label: "Small" },
  { value: "md", label: "Medium" },
  { value: "lg", label: "Large" },
  { value: "xl", label: "Extra Large" },
];

const cardStyles: { value: CardStyleOption; label: string; desc: string }[] = [
  { value: "minimal", label: "Minimal", desc: "Clean flat cards" },
  { value: "premium", label: "Premium", desc: "Gold accents & shadows" },
  { value: "elevated", label: "Elevated", desc: "Deep layered look" },
];

export function ThemeSection({ data, onChange }: ThemeSectionProps) {
  const update = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <SettingsSection
      title="Theme"
      description="Customize colors and visual style for your guest menu."
    >
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <SettingsField label="Primary Color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={data.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-gold/15 bg-transparent"
              />
              <input
                type="text"
                value={data.primaryColor}
                onChange={(e) => update("primaryColor", e.target.value)}
                className={settingsInputClass}
              />
            </div>
          </SettingsField>
          <SettingsField label="Accent Color">
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={data.accentColor}
                onChange={(e) => update("accentColor", e.target.value)}
                className="h-11 w-14 cursor-pointer rounded-lg border border-gold/15 bg-transparent"
              />
              <input
                type="text"
                value={data.accentColor}
                onChange={(e) => update("accentColor", e.target.value)}
                className={settingsInputClass}
              />
            </div>
          </SettingsField>
        </div>

        <SettingsField label="Border Radius">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {radiusOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => update("borderRadius", opt.value)}
                className={`rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  data.borderRadius === opt.value
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-white/10 bg-black/20 text-white/50 hover:border-gold/20"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </SettingsField>

        <SettingsField label="Card Style">
          <div className="grid gap-3 sm:grid-cols-3">
            {cardStyles.map((style) => (
              <button
                key={style.value}
                type="button"
                onClick={() => update("cardStyle", style.value)}
                className={`rounded-xl border p-4 text-start transition-all duration-200 ${
                  data.cardStyle === style.value
                    ? "border-gold/40 bg-gold/10 ring-1 ring-gold/20"
                    : "border-white/10 bg-black/20 hover:border-gold/20"
                }`}
              >
                <p
                  className={`text-sm font-semibold ${
                    data.cardStyle === style.value ? "text-gold" : "text-white/70"
                  }`}
                >
                  {style.label}
                </p>
                <p className="mt-1 text-xs text-white/40">{style.desc}</p>
              </button>
            ))}
          </div>
        </SettingsField>

        <div
          className="rounded-2xl border border-gold/15 p-5"
          style={{
            background: `linear-gradient(135deg, ${data.primaryColor}15, ${data.accentColor}08)`,
          }}
        >
          <p className="text-xs uppercase tracking-wider text-white/40">
            Theme Preview
          </p>
          <p
            className="mt-2 font-serif text-xl font-bold"
            style={{ color: data.primaryColor }}
          >
            Saffron Garden
          </p>
          <div
            className="mt-3 inline-block rounded-lg px-3 py-1.5 text-xs font-medium text-black"
            style={{ backgroundColor: data.accentColor }}
          >
            Sample badge
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
