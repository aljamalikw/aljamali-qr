"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { defaultSettings, type RestaurantSettings } from "@/lib/dashboard/settings/types";
import { useToast } from "@/components/ui/ToastProvider";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { ToggleSwitch } from "./ToggleSwitch";

const tabs = [
  { id: "general", label: "General" },
  { id: "features", label: "Features" },
  { id: "branding", label: "Branding" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function RestaurantSettings() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<RestaurantSettings>(defaultSettings);
  const [savedSnapshot, setSavedSnapshot] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 550);
    return () => clearTimeout(t);
  }, []);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
    [settings, savedSnapshot],
  );

  const update = <K extends keyof RestaurantSettings>(key: K, value: RestaurantSettings[K]) => {
    setSettings((p) => ({ ...p, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 900));
    setSavedSnapshot(settings);
    setSaving(false);
    showToast("Settings saved successfully");
  };

  const handleReset = () => {
    setSettings(savedSnapshot);
    showToast("Changes discarded", "info");
  };

  const simulateUpload = async (field: "logoUrl" | "coverUrl") => {
    setUploadProgress(0);
    for (let i = 0; i <= 100; i += 20) {
      await new Promise((r) => setTimeout(r, 120));
      setUploadProgress(i);
    }
    update(field, "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&q=80");
    setUploadProgress(null);
    showToast(`${field === "logoUrl" ? "Logo" : "Cover"} uploaded`);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="dashboard-card rounded-2xl p-6 sm:p-8">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Restaurant Settings</h1>
          <p className="mt-1 text-sm text-white/45">Configure your menu and branding</p>
        </div>
        {hasChanges && (
          <motion.span
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 rounded-full border border-amber-500/25 bg-amber-500/10 px-3 py-1 text-xs text-amber-300"
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Unsaved changes
          </motion.span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 ${
              activeTab === tab.id
                ? "border border-gold/25 bg-gold/10 text-gold"
                : "border border-white/10 text-white/50 hover:border-gold/15 hover:text-white/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="dashboard-card space-y-5 rounded-2xl p-6 sm:p-8"
      >
        {activeTab === "general" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Name (English)</label>
                <input value={settings.nameEn} onChange={(e) => update("nameEn", e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Name (Arabic)</label>
                <input value={settings.nameAr} onChange={(e) => update("nameAr", e.target.value)} dir="rtl" className={inputClass} />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Phone</label>
              <input value={settings.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Email</label>
              <input value={settings.email} onChange={(e) => update("email", e.target.value)} type="email" className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Address (English)</label>
              <textarea value={settings.addressEn} onChange={(e) => update("addressEn", e.target.value)} rows={2} className={`${inputClass} resize-none`} />
            </div>
          </>
        )}

        {activeTab === "features" && (
          <div className="space-y-3">
            <ToggleSwitch checked={settings.showPrices} onChange={(v) => update("showPrices", v)} label="Show prices" description="Display item prices on the public menu" />
            <ToggleSwitch checked={settings.bilingualMenu} onChange={(v) => update("bilingualMenu", v)} label="Bilingual menu" description="Enable English and Arabic toggle" />
            <ToggleSwitch checked={settings.whatsappOrders} onChange={(v) => update("whatsappOrders", v)} label="WhatsApp orders" description="Show WhatsApp order button" />
            <ToggleSwitch checked={settings.tableQrOrdering} onChange={(v) => update("tableQrOrdering", v)} label="Table QR ordering" description="Allow guests to order via table QR" />
            <ToggleSwitch checked={settings.showNutrition} onChange={(v) => update("showNutrition", v)} label="Nutrition info" description="Show dietary and nutrition badges" />
            <ToggleSwitch checked={settings.darkModeDefault} onChange={(v) => update("darkModeDefault", v)} label="Dark mode default" description="Start guests in dark theme" />
          </div>
        )}

        {activeTab === "branding" && (
          <>
            <div>
              <label className="mb-1.5 block text-xs uppercase tracking-wider text-white/45">Tagline (English)</label>
              <input value={settings.taglineEn} onChange={(e) => update("taglineEn", e.target.value)} className={inputClass} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-white/45">Logo</p>
                <button type="button" onClick={() => simulateUpload("logoUrl")} disabled={uploadProgress !== null} className="menu-btn-secondary w-full text-xs">
                  {uploadProgress !== null ? `Uploading ${uploadProgress}%` : "Upload Logo"}
                </button>
                {uploadProgress !== null && (
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      className="h-full rounded-full bg-gold"
                    />
                  </div>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-wider text-white/45">Cover Image</p>
                <button type="button" onClick={() => simulateUpload("coverUrl")} disabled={uploadProgress !== null} className="menu-btn-secondary w-full text-xs">
                  Upload Cover
                </button>
              </div>
            </div>
            {settings.coverUrl && (
              <img src={settings.coverUrl} alt="" className="mt-2 h-32 w-full rounded-xl object-cover" />
            )}
          </>
        )}
      </motion.div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button type="button" onClick={handleReset} disabled={!hasChanges || saving} className="menu-btn-secondary flex-1 disabled:opacity-40">
          Reset Changes
        </button>
        <button type="button" onClick={handleSave} disabled={!hasChanges || saving} className="menu-btn-primary flex-1 disabled:opacity-40">
          {saving ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
              Saving...
            </span>
          ) : (
            "Save Settings"
          )}
        </button>
      </div>
    </div>
  );
}
