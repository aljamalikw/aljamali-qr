"use client";

import { motion } from "framer-motion";
import type { SettingsTabId } from "@/lib/dashboard/settings/types";
import { settingsTabs } from "@/lib/dashboard/settings/seed-data";

interface SettingsTabsProps {
  active: SettingsTabId;
  onChange: (tab: SettingsTabId) => void;
}

export function SettingsTabs({ active, onChange }: SettingsTabsProps) {
  return (
    <nav
      className="scrollbar-hide flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible"
      aria-label="Settings sections"
    >
      {settingsTabs.map((tab) => {
        const isActive = active === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`flex shrink-0 items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 lg:w-full ${
              isActive
                ? "bg-gold/15 text-gold shadow-sm shadow-gold/10"
                : "border border-transparent text-white/55 hover:border-gold/15 hover:bg-white/5 hover:text-white"
            } ${tab.id === "danger" && !isActive ? "text-red-400/70 hover:text-red-400" : ""}`}
          >
            <span className="text-base">{tab.icon}</span>
            <span className="whitespace-nowrap">{tab.label}</span>
            {isActive && (
              <motion.span
                layoutId="settings-tab-indicator"
                className="ms-auto hidden h-1.5 w-1.5 rounded-full bg-gold lg:block"
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
