"use client";

import type { RestaurantSettingsData } from "@/lib/dashboard/settings/types";
import {
  SettingsField,
  SettingsSection,
  settingsInputClass,
} from "../ui/SettingsSection";

interface SocialSectionProps {
  data: RestaurantSettingsData["social"];
  onChange: (social: RestaurantSettingsData["social"]) => void;
}

export function SocialSection({ data, onChange }: SocialSectionProps) {
  const update = (key: keyof typeof data, value: string) =>
    onChange({ ...data, [key]: value });

  const fields = [
    { key: "instagram" as const, label: "Instagram", placeholder: "https://instagram.com/..." },
    { key: "facebook" as const, label: "Facebook", placeholder: "https://facebook.com/..." },
    { key: "tiktok" as const, label: "TikTok", placeholder: "https://tiktok.com/@..." },
    { key: "twitter" as const, label: "X (Twitter)", placeholder: "https://x.com/..." },
  ];

  return (
    <SettingsSection
      title="Social Media"
      description="Link your social profiles — they'll appear on your guest menu footer."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <SettingsField key={field.key} label={field.label}>
            <input
              type="url"
              value={data[field.key]}
              onChange={(e) => update(field.key, e.target.value)}
              className={settingsInputClass}
              placeholder={field.placeholder}
            />
          </SettingsField>
        ))}
      </div>
    </SettingsSection>
  );
}
