"use client";

import type {
  DayOfWeek,
  RestaurantSettingsData,
  RestaurantStatus,
} from "@/lib/dashboard/settings/types";
import { dayLabels } from "@/lib/dashboard/settings/seed-data";
import {
  SettingsSection,
  settingsInputClass,
  SettingsToggle,
} from "../ui/SettingsSection";

const days: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

const statusOptions: { value: RestaurantStatus; label: string; color: string }[] =
  [
    { value: "open", label: "Open", color: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" },
    { value: "busy", label: "Busy", color: "border-amber-500/40 bg-amber-500/10 text-amber-300" },
    { value: "closed", label: "Closed", color: "border-white/15 bg-white/5 text-white/50" },
    { value: "vacation", label: "Vacation", color: "border-blue-500/40 bg-blue-500/10 text-blue-300" },
  ];

interface BusinessHoursSectionProps {
  businessHours: RestaurantSettingsData["businessHours"];
  status: RestaurantStatus;
  onHoursChange: (
    hours: RestaurantSettingsData["businessHours"],
  ) => void;
  onStatusChange: (status: RestaurantStatus) => void;
}

export function BusinessHoursSection({
  businessHours,
  status,
  onHoursChange,
  onStatusChange,
}: BusinessHoursSectionProps) {
  const updateDay = (
    day: DayOfWeek,
    field: "open" | "close" | "closed",
    value: string | boolean,
  ) => {
    onHoursChange({
      ...businessHours,
      [day]: { ...businessHours[day], [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Business Hours"
        description="Set opening and closing times for each day of the week."
      >
        <div className="space-y-3">
          {days.map((day) => {
            const hours = businessHours[day];
            return (
              <div
                key={day}
                className="grid items-center gap-3 rounded-xl border border-white/5 bg-black/20 p-4 transition-colors hover:border-gold/10 sm:grid-cols-[120px_1fr_1fr_auto]"
              >
                <p className="font-medium text-white/80">{dayLabels[day]}</p>
                <input
                  type="time"
                  value={hours.open}
                  disabled={hours.closed}
                  onChange={(e) => updateDay(day, "open", e.target.value)}
                  className={`${settingsInputClass} disabled:opacity-40`}
                />
                <input
                  type="time"
                  value={hours.close}
                  disabled={hours.closed}
                  onChange={(e) => updateDay(day, "close", e.target.value)}
                  className={`${settingsInputClass} disabled:opacity-40`}
                />
                <SettingsToggle
                  id={`closed-${day}`}
                  label="Closed"
                  checked={hours.closed}
                  onChange={(v) => updateDay(day, "closed", v)}
                  compact
                />
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Restaurant Status"
        description="Display your current operating status to guests on the menu."
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => onStatusChange(opt.value)}
              className={`rounded-xl border px-4 py-4 text-sm font-semibold transition-all duration-200 ${
                status === opt.value
                  ? `${opt.color} ring-2 ring-gold/30`
                  : "border-white/10 bg-black/20 text-white/50 hover:border-gold/20"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
