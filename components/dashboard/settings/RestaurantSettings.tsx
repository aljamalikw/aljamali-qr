"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  RestaurantSettingsData,
  SettingsTabId,
} from "@/lib/dashboard/settings/types";
import {
  cloneSettings,
  initialSettings,
} from "@/lib/dashboard/settings/seed-data";
import { SettingsTabs } from "./SettingsTabs";
import { SettingsToast } from "./ui/SettingsToast";
import { ButtonSpinner } from "./ui/ButtonSpinner";
import { DeleteRestaurantModal } from "./DeleteRestaurantModal";
import { ResetConfirmModal } from "./ResetConfirmModal";
import { ProfileSection } from "./sections/ProfileSection";
import { ContactLocationSection } from "./sections/ContactLocationSection";
import { BusinessHoursSection } from "./sections/BusinessHoursSection";
import { SocialSection } from "./sections/SocialSection";
import { MenuSettingsSection } from "./sections/MenuSettingsSection";
import { ThemeSection } from "./sections/ThemeSection";
import { NotificationsSection } from "./sections/NotificationsSection";
import { DangerZoneSection } from "./sections/DangerZoneSection";

const MOCK_SAVE_DELAY_MS = 900;

export function RestaurantSettings() {
  const savedRef = useRef<RestaurantSettingsData>(cloneSettings(initialSettings));
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [settings, setSettings] = useState<RestaurantSettingsData>(
    cloneSettings(initialSettings),
  );
  const [activeTab, setActiveTab] = useState<SettingsTabId>("profile");
  const [toast, setToast] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  const showToast = useCallback((message: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(message);
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);

  const updateSettings = useCallback(
    (updater: (prev: RestaurantSettingsData) => RestaurantSettingsData) => {
      setSettings((prev) => {
        const next = updater(prev);
        setDirty(true);
        return next;
      });
    },
    [],
  );

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_SAVE_DELAY_MS));
      savedRef.current = cloneSettings(settings);
      setDirty(false);
      showToast("Settings saved successfully");
    } finally {
      setSaving(false);
    }
  };

  const confirmReset = () => {
    setSettings(cloneSettings(savedRef.current));
    setDirty(false);
    setResetOpen(false);
    showToast("Changes discarded");
  };

  const handleDelete = () => {
    setDeleteOpen(false);
    showToast("Restaurant deletion is disabled in demo mode");
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <ProfileSection
            data={settings.profile}
            onChange={(profile) =>
              updateSettings((s) => ({ ...s, profile }))
            }
          />
        );
      case "contact":
        return (
          <ContactLocationSection
            contact={settings.contact}
            location={settings.location}
            onContactChange={(contact) =>
              updateSettings((s) => ({ ...s, contact }))
            }
            onLocationChange={(location) =>
              updateSettings((s) => ({ ...s, location }))
            }
          />
        );
      case "hours":
        return (
          <BusinessHoursSection
            businessHours={settings.businessHours}
            status={settings.status}
            onHoursChange={(businessHours) =>
              updateSettings((s) => ({ ...s, businessHours }))
            }
            onStatusChange={(status) =>
              updateSettings((s) => ({ ...s, status }))
            }
          />
        );
      case "social":
        return (
          <SocialSection
            data={settings.social}
            onChange={(social) => updateSettings((s) => ({ ...s, social }))}
          />
        );
      case "menu":
        return (
          <MenuSettingsSection
            data={settings.menuSettings}
            onChange={(menuSettings) =>
              updateSettings((s) => ({ ...s, menuSettings }))
            }
          />
        );
      case "theme":
        return (
          <ThemeSection
            data={settings.theme}
            onChange={(theme) => updateSettings((s) => ({ ...s, theme }))}
          />
        );
      case "notifications":
        return (
          <NotificationsSection
            data={settings.notifications}
            onChange={(notifications) =>
              updateSettings((s) => ({ ...s, notifications }))
            }
          />
        );
      case "danger":
        return <DangerZoneSection onDelete={() => setDeleteOpen(true)} />;
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl pb-24">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Configuration
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl">
          Restaurant Settings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/45 sm:text-base">
          Manage your restaurant profile, contact details, hours, menu
          preferences, and branding.
        </p>
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SettingsTabs active={activeTab} onChange={setActiveTab} />
        </aside>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/10 bg-black/90 px-4 py-4 backdrop-blur-xl sm:px-6"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <p className="hidden text-sm text-white/40 sm:block">
            {saving
              ? "Saving changes..."
              : dirty
                ? "You have unsaved changes"
                : "All changes saved"}
          </p>
          <div className="flex w-full justify-end gap-3 sm:w-auto">
            <button
              type="button"
              onClick={() => setResetOpen(true)}
              disabled={!dirty || saving}
              className="menu-btn-secondary disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !dirty}
              className="menu-btn-primary min-w-[140px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <ButtonSpinner className="h-4 w-4 text-black/70" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </div>
      </motion.div>

      <SettingsToast message={toast ?? ""} visible={toast !== null} />

      <ResetConfirmModal
        open={resetOpen}
        onConfirm={confirmReset}
        onCancel={() => setResetOpen(false)}
      />

      <DeleteRestaurantModal
        open={deleteOpen}
        restaurantName={settings.profile.name}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}
