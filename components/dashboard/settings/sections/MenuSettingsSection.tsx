"use client";

import type { RestaurantSettingsData } from "@/lib/dashboard/settings/types";
import {
  SettingsField,
  SettingsSection,
  settingsInputClass,
  SettingsToggle,
} from "../ui/SettingsSection";

interface MenuSettingsSectionProps {
  data: RestaurantSettingsData["menuSettings"];
  onChange: (menuSettings: RestaurantSettingsData["menuSettings"]) => void;
}

export function MenuSettingsSection({ data, onChange }: MenuSettingsSectionProps) {
  const update = <K extends keyof typeof data>(key: K, value: (typeof data)[K]) =>
    onChange({ ...data, [key]: value });

  return (
    <SettingsSection
      title="Menu Settings"
      description="Configure language, display options, and guest menu behavior."
    >
      <div className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <SettingsField label="Default Language">
            <select
              value={data.defaultLanguage}
              onChange={(e) =>
                update("defaultLanguage", e.target.value as "en" | "ar")
              }
              className={settingsInputClass}
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </SettingsField>
          <SettingsField label="Secondary Language">
            <select
              value={data.secondaryLanguage}
              onChange={(e) =>
                update("secondaryLanguage", e.target.value as "en" | "ar")
              }
              className={settingsInputClass}
            >
              <option value="en">English</option>
              <option value="ar">Arabic</option>
            </select>
          </SettingsField>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <SettingsToggle
            label="Enable Arabic"
            description="Show Arabic language option to guests"
            checked={data.enableArabic}
            onChange={(v) => update("enableArabic", v)}
          />
          <SettingsToggle
            label="Enable English"
            description="Show English language option to guests"
            checked={data.enableEnglish}
            onChange={(v) => update("enableEnglish", v)}
          />
          <SettingsToggle
            label="RTL Layout"
            description="Right-to-left layout for Arabic"
            checked={data.rtl}
            onChange={(v) => update("rtl", v)}
          />
          <SettingsToggle
            label="Show Prices"
            description="Display item prices on the menu"
            checked={data.showPrices}
            onChange={(v) => update("showPrices", v)}
          />
          <SettingsToggle
            label="Show Badges"
            description="Chef's Special, Vegetarian, Spicy badges"
            checked={data.showBadges}
            onChange={(v) => update("showBadges", v)}
          />
          <SettingsToggle
            label="Show WhatsApp Button"
            description="Floating order button on guest menu"
            checked={data.showWhatsApp}
            onChange={(v) => update("showWhatsApp", v)}
          />
        </div>
      </div>
    </SettingsSection>
  );
}
