"use client";

import { useCallback, useEffect, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { FormSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  defaultPlatformSettings,
  getPlatformSettings,
  upsertPlatformSettings,
  type PlatformSettings,
} from "@/lib/admin/platform-settings";
import { SUBSCRIPTION_PLANS } from "@/lib/admin/subscriptions";

export function AdminSettingsPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState<PlatformSettings>(defaultPlatformSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await getPlatformSettings();
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setForm(result.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = <K extends keyof PlatformSettings>(
    key: K,
    value: PlatformSettings[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const updatePrice = (
    plan: (typeof SUBSCRIPTION_PLANS)[number],
    field: "monthly" | "yearly",
    value: string,
  ) => {
    const numeric = Number(value);
    setForm((prev) => ({
      ...prev,
      subscriptionPlanPrices: {
        ...prev.subscriptionPlanPrices,
        [plan]: {
          ...prev.subscriptionPlanPrices[plan],
          [field]: Number.isFinite(numeric) ? numeric : 0,
        },
      },
    }));
  };

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    const result = await upsertPlatformSettings({
      platformName: form.platformName,
      brandLogoUrl: form.brandLogoUrl,
      smtpHost: form.smtpHost,
      smtpPort: form.smtpPort,
      smtpUser: form.smtpUser,
      supportEmail: form.supportEmail,
      whatsappNumber: form.whatsappNumber,
      currency: form.currency,
      timezone: form.timezone,
      subscriptionPlanPrices: form.subscriptionPlanPrices,
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setForm(result.data);
    showToast("Platform settings saved");
  };

  return (
    <AdminPlaceholder
      title="Settings"
      description="Platform company profile, plan pricing, and default configuration."
    >
      {loading ? (
        <FormSkeleton />
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-sm text-white/50">{error}</p>
          <button
            type="button"
            className="menu-btn-primary mt-6"
            onClick={() => void load()}
          >
            Try Again
          </button>
        </div>
      ) : (
        <form
          className="grid max-w-3xl gap-4 sm:grid-cols-2"
          onSubmit={(e) => void handleSave(e)}
        >
          {(
            [
              ["platformName", "Platform Name", "Aljamali QR"],
              ["brandLogoUrl", "Brand Logo URL", "https://…"],
              ["supportEmail", "Support Email", "hello@aljamaliqr.com"],
              ["whatsappNumber", "WhatsApp Number", "+965…"],
              ["smtpHost", "SMTP Host", "smtp.example.com"],
              ["smtpPort", "SMTP Port", "587"],
              ["smtpUser", "SMTP User", "noreply@…"],
              ["currency", "Currency", "KWD"],
              ["timezone", "Timezone", "Asia/Kuwait"],
            ] as const
          ).map(([key, label, placeholder]) => (
            <div key={key} className="space-y-1.5">
              <label className="block text-xs font-medium uppercase tracking-wider text-white/40">
                {label}
              </label>
              <input
                className="auth-input w-full"
                placeholder={placeholder}
                value={form[key] ?? ""}
                onChange={(e) => update(key, e.target.value)}
              />
            </div>
          ))}

          <div className="sm:col-span-2 mt-2 space-y-3 rounded-2xl border border-gold/15 bg-black/20 p-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">
                Subscription plan prices
              </p>
              <p className="mt-1 text-xs text-white/45">
                Used for new trials and admin plan changes. Amounts are in the
                platform currency.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {SUBSCRIPTION_PLANS.map((plan) => (
                <div
                  key={plan}
                  className="space-y-2 rounded-xl border border-white/5 bg-black/25 p-3"
                >
                  <p className="font-serif text-base text-white">{plan}</p>
                  <label className="block space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-white/40">
                      Monthly
                    </span>
                    <input
                      className="auth-input w-full"
                      type="number"
                      min={0}
                      step="0.001"
                      value={form.subscriptionPlanPrices[plan].monthly}
                      onChange={(e) =>
                        updatePrice(plan, "monthly", e.target.value)
                      }
                    />
                  </label>
                  <label className="block space-y-1">
                    <span className="text-[11px] uppercase tracking-wider text-white/40">
                      Yearly
                    </span>
                    <input
                      className="auth-input w-full"
                      type="number"
                      min={0}
                      step="0.001"
                      value={form.subscriptionPlanPrices[plan].yearly}
                      onChange={(e) =>
                        updatePrice(plan, "yearly", e.target.value)
                      }
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="menu-btn-primary"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save Settings"}
            </button>
          </div>
        </form>
      )}
    </AdminPlaceholder>
  );
}
