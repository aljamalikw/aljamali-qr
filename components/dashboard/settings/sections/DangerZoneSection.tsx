"use client";

import { SettingsSection } from "../ui/SettingsSection";

interface DangerZoneSectionProps {
  onDelete: () => void;
}

export function DangerZoneSection({ onDelete }: DangerZoneSectionProps) {
  return (
    <SettingsSection
      title="Danger Zone"
      description="Irreversible actions that permanently affect your restaurant account."
      className="border-red-500/15 hover:border-red-500/25"
    >
      <div className="flex flex-col gap-4 rounded-xl border border-red-500/20 bg-red-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium text-white">Delete Restaurant</p>
          <p className="mt-1 text-sm text-white/45">
            Permanently remove your restaurant, menu, QR codes, and all data.
          </p>
        </div>
        <button type="button" onClick={onDelete} className="menu-btn-danger shrink-0">
          Delete Restaurant
        </button>
      </div>
    </SettingsSection>
  );
}
