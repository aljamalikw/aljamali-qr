"use client";

import type { RestaurantSettingsData } from "@/lib/dashboard/settings/types";
import { SettingsSection, SettingsToggle } from "../ui/SettingsSection";

interface NotificationsSectionProps {
  data: RestaurantSettingsData["notifications"];
  onChange: (notifications: RestaurantSettingsData["notifications"]) => void;
}

export function NotificationsSection({
  data,
  onChange,
}: NotificationsSectionProps) {
  const update = <K extends keyof typeof data>(
    key: K,
    value: (typeof data)[K],
  ) => onChange({ ...data, [key]: value });

  return (
    <SettingsSection
      title="Notification Preferences"
      description="Choose how you'd like to stay informed about your menu activity."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <SettingsToggle
          label="Email notifications"
          description="Order alerts and account updates via email"
          checked={data.email}
          onChange={(v) => update("email", v)}
        />
        <SettingsToggle
          label="WhatsApp notifications"
          description="Instant alerts on WhatsApp"
          checked={data.whatsapp}
          onChange={(v) => update("whatsapp", v)}
        />
        <SettingsToggle
          label="Daily analytics email"
          description="Summary of scans and views each morning"
          checked={data.dailyAnalytics}
          onChange={(v) => update("dailyAnalytics", v)}
        />
        <SettingsToggle
          label="Weekly report"
          description="Full performance report every Monday"
          checked={data.weeklyReport}
          onChange={(v) => update("weeklyReport", v)}
        />
      </div>
    </SettingsSection>
  );
}
