"use client";

import type { RestaurantSettingsData } from "@/lib/dashboard/settings/types";
import {
  SettingsField,
  SettingsSection,
  settingsInputClass,
} from "../ui/SettingsSection";
import { SettingsImageUpload } from "../ui/SettingsImageUpload";

interface ProfileSectionProps {
  data: RestaurantSettingsData["profile"];
  onChange: (profile: RestaurantSettingsData["profile"]) => void;
}

export function ProfileSection({ data, onChange }: ProfileSectionProps) {
  const update = (key: keyof typeof data, value: string) =>
    onChange({ ...data, [key]: value });

  return (
    <SettingsSection
      title="Restaurant Profile"
      description="Your public-facing restaurant identity on the digital menu."
    >
      <div className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-[auto_1fr]">
          <SettingsImageUpload
            label="Logo"
            value={data.logo}
            onChange={(v) => update("logo", v)}
            aspect="square"
            hint="Square image, recommended 512×512px"
          />
          <SettingsImageUpload
            label="Cover Image"
            value={data.coverImage}
            onChange={(v) => update("coverImage", v)}
            aspect="wide"
            hint="Wide banner for your menu header"
          />
        </div>

        <SettingsField label="Restaurant Name">
          <input
            type="text"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            className={settingsInputClass}
            placeholder="Saffron Garden"
          />
        </SettingsField>

        <SettingsField label="Cuisine Type">
          <input
            type="text"
            value={data.cuisineType}
            onChange={(e) => update("cuisineType", e.target.value)}
            className={settingsInputClass}
            placeholder="Mediterranean & Gulf"
          />
        </SettingsField>

        <SettingsField label="Restaurant Description">
          <textarea
            value={data.description}
            onChange={(e) => update("description", e.target.value)}
            rows={4}
            className={`${settingsInputClass} resize-none`}
            placeholder="Tell guests about your restaurant..."
          />
        </SettingsField>
      </div>
    </SettingsSection>
  );
}
