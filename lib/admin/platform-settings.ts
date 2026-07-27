import { supabase } from "@/lib/supabase";

export const PLATFORM_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

export type PlatformSettings = {
  id: string;
  platformName: string;
  brandLogoUrl: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  supportEmail: string;
  whatsappNumber: string;
  currency: string;
  timezone: string;
  updatedAt: string | null;
};

export type PlatformSettingsForm = Omit<PlatformSettings, "id" | "updatedAt">;

type SettingsRow = {
  id: string;
  platform_name: string | null;
  brand_logo_url: string | null;
  smtp_host: string | null;
  smtp_port: number | null;
  smtp_user: string | null;
  support_email: string | null;
  whatsapp_number: string | null;
  currency: string | null;
  timezone: string | null;
  updated_at: string | null;
};

const ERROR = "Unable to load platform settings. Please try again.";

export const defaultPlatformSettings: PlatformSettings = {
  id: PLATFORM_SETTINGS_ID,
  platformName: "Aljamali QR",
  brandLogoUrl: "",
  smtpHost: "",
  smtpPort: "",
  smtpUser: "",
  supportEmail: "",
  whatsappNumber: "",
  currency: "KWD",
  timezone: "Asia/Kuwait",
  updatedAt: null,
};

function mapRow(row: SettingsRow): PlatformSettings {
  return {
    id: row.id,
    platformName: row.platform_name ?? "Aljamali QR",
    brandLogoUrl: row.brand_logo_url ?? "",
    smtpHost: row.smtp_host ?? "",
    smtpPort: row.smtp_port != null ? String(row.smtp_port) : "",
    smtpUser: row.smtp_user ?? "",
    supportEmail: row.support_email ?? "",
    whatsappNumber: row.whatsapp_number ?? "",
    currency: row.currency ?? "KWD",
    timezone: row.timezone ?? "Asia/Kuwait",
    updatedAt: row.updated_at,
  };
}

export async function getPlatformSettings(): Promise<
  { ok: true; data: PlatformSettings } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("platform_settings")
      .select("*")
      .eq("id", PLATFORM_SETTINGS_ID)
      .maybeSingle();

    if (error) return { ok: false, message: error.message || ERROR };
    if (!data) return { ok: true, data: defaultPlatformSettings };
    return { ok: true, data: mapRow(data as SettingsRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function upsertPlatformSettings(
  form: PlatformSettingsForm,
): Promise<
  { ok: true; data: PlatformSettings } | { ok: false; message: string }
> {
  try {
    const port = form.smtpPort.trim();
    const payload = {
      id: PLATFORM_SETTINGS_ID,
      platform_name: form.platformName.trim() || "Aljamali QR",
      brand_logo_url: form.brandLogoUrl.trim() || null,
      smtp_host: form.smtpHost.trim() || null,
      smtp_port: port ? Number(port) : null,
      smtp_user: form.smtpUser.trim() || null,
      support_email: form.supportEmail.trim() || null,
      whatsapp_number: form.whatsappNumber.trim() || null,
      currency: form.currency.trim() || "KWD",
      timezone: form.timezone.trim() || "Asia/Kuwait",
    };

    const { data, error } = await supabase
      .from("platform_settings")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    return { ok: true, data: mapRow(data as SettingsRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}
