"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  defaultSettings,
  type RestaurantSettings as SettingsForm,
} from "@/lib/dashboard/settings/types";
import { useToast } from "@/components/ui/ToastProvider";
import { FormSkeleton } from "@/components/ui/Skeleton";
import {
  mapRestaurantToSettings,
  updateRestaurantSettings,
} from "@/lib/restaurants/settings";
import { getSafeRestaurantName } from "@/lib/restaurants/display";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { CURRENCY_OPTIONS, TIMEZONE_OPTIONS } from "@/lib/restaurants/constants";
import { restartOnboarding } from "@/lib/onboarding/progress-actions";
import { ToggleSwitch } from "./ToggleSwitch";
import { ListEditor } from "./ListEditor";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

const tabs = [
  { id: "general", label: "General" },
  { id: "branding", label: "Branding & Media" },
  { id: "about", label: "About & Cuisine" },
  { id: "hours", label: "Hours & Delivery" },
  { id: "business", label: "Business Info" },
  { id: "online", label: "Online Presence" },
  { id: "seo", label: "SEO" },
  { id: "features", label: "Features" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

const labelClass = "mb-1.5 block text-xs uppercase tracking-wider text-white/45";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {children}
    </div>
  );
}

export function RestaurantSettings() {
  const router = useRouter();
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const [settings, setSettings] = useState<SettingsForm>(defaultSettings);
  const [savedSnapshot, setSavedSnapshot] = useState(defaultSettings);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [saving, setSaving] = useState(false);
  const [restartOpen, setRestartOpen] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    const mapped = mapRestaurantToSettings(restaurant);
    setSettings(mapped);
    setSavedSnapshot(mapped);
  }, [restaurant]);

  const hasChanges = useMemo(
    () => JSON.stringify(settings) !== JSON.stringify(savedSnapshot),
    [settings, savedSnapshot],
  );

  const update = <K extends keyof SettingsForm>(
    key: K,
    value: SettingsForm[K],
  ) => {
    setSettings((p) => ({ ...p, [key]: value }));
  };

  const toggleLanguage = (code: string) => {
    setSettings((prev) => {
      const has = prev.languages.includes(code);
      if (has && prev.languages.length === 1) return prev;
      return {
        ...prev,
        languages: has
          ? prev.languages.filter((l) => l !== code)
          : [...prev.languages, code],
      };
    });
  };

  const handleSave = async () => {
    if (!restaurant?.id) {
      showToast("Restaurant not found", "error");
      return;
    }
    setSaving(true);
    const result = await updateRestaurantSettings(restaurant.id, settings);
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    const mapped = mapRestaurantToSettings(result.data);
    setSettings(mapped);
    setSavedSnapshot(mapped);
    showToast("Settings saved successfully");
  };

  const handleReset = () => {
    setSettings(savedSnapshot);
    showToast("Changes discarded", "info");
  };

  const handleRestartWizard = async () => {
    if (!restaurant?.id) {
      showToast("Restaurant not found", "error");
      return;
    }
    setRestarting(true);
    const result = await restartOnboarding(restaurant.id);
    setRestarting(false);
    setRestartOpen(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    showToast("Setup Wizard restarted");
    router.push("/restaurant/setup");
  };

  if (restaurantLoading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="dashboard-card rounded-2xl p-6 sm:p-8">
          <FormSkeleton />
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-white/50">
          Complete onboarding to configure restaurant settings.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Restaurant Settings
          </h1>
          <p className="mt-1 text-sm text-white/45">
            {getSafeRestaurantName(restaurant)} · Configure your menu, hours,
            branding, and business details
          </p>
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
              <Field label="Name (English)">
                <input
                  value={settings.nameEn}
                  onChange={(e) => update("nameEn", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Name (Arabic)">
                <input
                  value={settings.nameAr}
                  onChange={(e) => update("nameAr", e.target.value)}
                  dir="rtl"
                  className={inputClass}
                />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone">
                <input
                  value={settings.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="WhatsApp">
                <input
                  value={settings.whatsapp}
                  onChange={(e) => update("whatsapp", e.target.value)}
                  className={inputClass}
                  placeholder="9655…"
                />
              </Field>
            </div>
            <Field label="Email">
              <input
                value={settings.email}
                onChange={(e) => update("email", e.target.value)}
                type="email"
                className={inputClass}
              />
            </Field>
            <Field label="Address (English)">
              <textarea
                value={settings.addressEn}
                onChange={(e) => update("addressEn", e.target.value)}
                rows={2}
                className={`${inputClass} resize-none`}
              />
            </Field>
            <Field label="Address (Arabic)">
              <textarea
                value={settings.addressAr}
                onChange={(e) => update("addressAr", e.target.value)}
                rows={2}
                dir="rtl"
                className={`${inputClass} resize-none`}
              />
            </Field>
            <div>
              <p className="mb-2 text-xs uppercase tracking-wider text-white/45">
                Languages
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  { code: "en", label: "English" },
                  { code: "ar", label: "Arabic" },
                ].map((lang) => {
                  const active = settings.languages.includes(lang.code);
                  return (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => toggleLanguage(lang.code)}
                      className={`rounded-xl px-3 py-1.5 text-xs ${
                        active
                          ? "border border-gold/30 bg-gold/10 text-gold"
                          : "border border-white/10 text-white/50"
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {activeTab === "branding" && (
          <>
            <div>
              <label className={labelClass}>Tagline (English)</label>
              <input
                value={settings.taglineEn}
                onChange={(e) => update("taglineEn", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Tagline (Arabic)</label>
              <input
                value={settings.taglineAr}
                onChange={(e) => update("taglineAr", e.target.value)}
                dir="rtl"
                className={inputClass}
              />
            </div>
            <Field label="Logo URL">
              <input
                value={settings.logoUrl}
                onChange={(e) => update("logoUrl", e.target.value)}
                className={inputClass}
                placeholder="https://…"
              />
            </Field>
            <Field label="Cover image URL">
              <input
                value={settings.coverUrl}
                onChange={(e) => update("coverUrl", e.target.value)}
                className={inputClass}
                placeholder="https://…"
              />
            </Field>
            {settings.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.coverUrl}
                alt=""
                className="mt-2 h-32 w-full rounded-xl object-cover"
              />
            ) : null}
            <div>
              <label className={labelClass}>Gallery images</label>
              <p className="mb-2 text-xs text-white/35">
                Shown on your public menu header. Paste an image URL and press Add.
              </p>
              <ListEditor
                items={settings.galleryUrls}
                onChange={(items) => update("galleryUrls", items)}
                placeholder="https://…"
                renderPreview={(url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={url} alt="" className="h-full w-full object-cover" />
                )}
              />
            </div>
            <div>
              <label className={labelClass}>Theme color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.themePrimaryColor || "#d4af37"}
                  onChange={(e) => update("themePrimaryColor", e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-white/10 bg-transparent"
                />
                <input
                  value={settings.themePrimaryColor}
                  onChange={(e) => update("themePrimaryColor", e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </>
        )}

        {activeTab === "about" && (
          <>
            <Field label="About us">
              <textarea
                value={settings.aboutUs}
                onChange={(e) => update("aboutUs", e.target.value)}
                rows={5}
                className={`${inputClass} resize-y`}
                placeholder="Tell guests about your restaurant's story, atmosphere, and specialties…"
              />
            </Field>
            <Field label="Cuisine type">
              <input
                value={settings.cuisineType}
                onChange={(e) => update("cuisineType", e.target.value)}
                className={inputClass}
                placeholder="e.g. Levantine, Italian, Seafood"
              />
            </Field>
            <div>
              <label className={labelClass}>Branches</label>
              <p className="mb-2 text-xs text-white/35">
                Add one line per branch, e.g. &quot;Salmiya — 22 224 444&quot;.
              </p>
              <ListEditor
                items={settings.branches}
                onChange={(items) => update("branches", items)}
                placeholder="Branch name and phone / address"
                addLabel="Add branch"
              />
            </div>
          </>
        )}

        {activeTab === "hours" && (
          <>
            <Field label="Opening hours">
              <textarea
                value={settings.openingHours}
                onChange={(e) => update("openingHours", e.target.value)}
                rows={4}
                className={`${inputClass} resize-y`}
                placeholder={"Sat–Thu: 12:00–23:00\nFri: 13:00–23:30"}
              />
            </Field>
            <Field label="Holiday schedule">
              <textarea
                value={settings.holidaySchedule}
                onChange={(e) => update("holidaySchedule", e.target.value)}
                rows={3}
                className={`${inputClass} resize-y`}
                placeholder={"Eid Al Fitr: Closed\nNational Day: 16:00–23:00"}
              />
            </Field>
            <ToggleSwitch
              checked={settings.deliveryEnabled}
              onChange={(v) => update("deliveryEnabled", v)}
              label="Delivery available"
              description="Show delivery information on your public menu"
            />
            <Field label="Delivery notes">
              <textarea
                value={settings.deliveryNotes}
                onChange={(e) => update("deliveryNotes", e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Delivery areas, minimum order, fees…"
              />
            </Field>
            <div>
              <label className={labelClass}>Delivery platforms</label>
              <p className="mb-2 text-xs text-white/35">
                e.g. &quot;Talabat&quot;, &quot;Deliveroo — https://…&quot;
              </p>
              <ListEditor
                items={settings.deliveryPlatforms}
                onChange={(items) => update("deliveryPlatforms", items)}
                placeholder="Platform name or link"
                addLabel="Add platform"
              />
            </div>
          </>
        )}

        {activeTab === "business" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Currency">
                <select
                  value={settings.currency}
                  onChange={(e) => update("currency", e.target.value)}
                  className={inputClass}
                >
                  {CURRENCY_OPTIONS.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Timezone">
                <select
                  value={settings.timezone}
                  onChange={(e) => update("timezone", e.target.value)}
                  className={inputClass}
                >
                  {TIMEZONE_OPTIONS.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Tax number">
              <input
                value={settings.taxNumber}
                onChange={(e) => update("taxNumber", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Commercial registration">
              <input
                value={settings.commercialRegistration}
                onChange={(e) => update("commercialRegistration", e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="VAT number">
              <input
                value={settings.vatNumber}
                onChange={(e) => update("vatNumber", e.target.value)}
                className={inputClass}
              />
            </Field>
          </>
        )}

        {activeTab === "online" && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              {(
                [
                  ["socialInstagram", "Instagram"],
                  ["socialFacebook", "Facebook"],
                  ["socialTiktok", "TikTok"],
                ] as const
              ).map(([key, label]) => (
                <Field key={key} label={label}>
                  <input
                    value={settings[key]}
                    onChange={(e) => update(key, e.target.value)}
                    className={inputClass}
                    placeholder="@handle or URL"
                  />
                </Field>
              ))}
            </div>
            <Field label="Website">
              <input
                value={settings.website}
                onChange={(e) => update("website", e.target.value)}
                className={inputClass}
                placeholder="https://…"
              />
            </Field>
            <Field label="Google Maps link">
              <input
                value={settings.googleMapsUrl}
                onChange={(e) => update("googleMapsUrl", e.target.value)}
                className={inputClass}
                placeholder="https://maps.google.com/…"
              />
            </Field>
          </>
        )}

        {activeTab === "seo" && (
          <>
            <Field label="SEO title">
              <input
                value={settings.seoTitle}
                onChange={(e) => update("seoTitle", e.target.value)}
                className={inputClass}
                placeholder="Falls back to your restaurant name"
              />
            </Field>
            <Field label="SEO description">
              <textarea
                value={settings.seoDescription}
                onChange={(e) => update("seoDescription", e.target.value)}
                rows={3}
                className={`${inputClass} resize-none`}
                placeholder="Shown in search engine results and social shares"
              />
            </Field>
            <Field label="SEO keywords">
              <input
                value={settings.seoKeywords}
                onChange={(e) => update("seoKeywords", e.target.value)}
                className={inputClass}
                placeholder="comma, separated, keywords"
              />
            </Field>
            <Field label="Open Graph image URL">
              <input
                value={settings.ogImageUrl}
                onChange={(e) => update("ogImageUrl", e.target.value)}
                className={inputClass}
                placeholder="https://… (shown when your menu link is shared)"
              />
            </Field>
            {settings.ogImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={settings.ogImageUrl}
                alt=""
                className="mt-2 h-32 w-full rounded-xl object-cover"
              />
            ) : null}
          </>
        )}

        {activeTab === "features" && (
          <div className="space-y-3">
            <ToggleSwitch
              checked={settings.showPrices}
              onChange={(v) => update("showPrices", v)}
              label="Show prices"
              description="Display item prices on the public menu"
            />
            <ToggleSwitch
              checked={settings.bilingualMenu}
              onChange={(v) => update("bilingualMenu", v)}
              label="Bilingual menu"
              description="Enable English and Arabic toggle"
            />
            <ToggleSwitch
              checked={settings.whatsappOrders}
              onChange={(v) => update("whatsappOrders", v)}
              label="WhatsApp orders"
              description="Show WhatsApp order button"
            />
            <ToggleSwitch
              checked={settings.tableQrOrdering}
              onChange={(v) => update("tableQrOrdering", v)}
              label="Table QR ordering"
              description="Allow guests to order via table QR"
            />
            <ToggleSwitch
              checked={settings.showNutrition}
              onChange={(v) => update("showNutrition", v)}
              label="Nutrition info"
              description="Show dietary and nutrition badges"
            />
            <ToggleSwitch
              checked={settings.darkModeDefault}
              onChange={(v) => update("darkModeDefault", v)}
              label="Dark mode default"
              description="Start guests in dark theme"
            />
          </div>
        )}
      </motion.div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasChanges || saving}
          className="menu-btn-secondary flex-1 disabled:opacity-40"
        >
          Reset Changes
        </button>
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={!hasChanges || saving}
          className="menu-btn-primary flex-1 disabled:opacity-40"
        >
          {saving ? "Saving…" : "Save Settings"}
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-white/10 bg-black/20 p-5">
        <h3 className="text-sm font-semibold text-white">Setup Wizard</h3>
        <p className="mt-1 text-sm text-white/50">
          Restart the guided restaurant onboarding for this location only.
          Existing menu data is kept.
        </p>
        <button
          type="button"
          onClick={() => setRestartOpen(true)}
          className="menu-btn-secondary mt-4 inline-flex"
        >
          Restart Setup Wizard
        </button>
      </div>

      <ConfirmModal
        open={restartOpen}
        title="Restart Setup Wizard?"
        description="Progress will reset for this restaurant. You can walk through setup again without deleting menu items or QR codes."
        confirmLabel="Restart Wizard"
        loading={restarting}
        onConfirm={() => void handleRestartWizard()}
        onCancel={() => setRestartOpen(false)}
      />
    </div>
  );
}
