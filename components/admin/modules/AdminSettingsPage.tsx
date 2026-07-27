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
      description="Platform company profile and default configuration."
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
          className="grid max-w-2xl gap-4 sm:grid-cols-2"
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
