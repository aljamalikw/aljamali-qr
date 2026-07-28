import { supabase } from "@/lib/supabase";
import {
  DEFAULT_PLAN_PRICES,
  type SubscriptionPlanPrices,
} from "@/lib/subscriptions/pricing";

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
  subscriptionPlanPrices: SubscriptionPlanPrices;
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
  subscription_plan_prices?: unknown;
  updated_at: string | null;
};

const ERROR = "Unable to load platform settings. Please try again.";

function normalizePrices(raw: unknown): SubscriptionPlanPrices {
  const source =
    raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result = { ...DEFAULT_PLAN_PRICES };
  for (const plan of ["Starter", "Professional", "Enterprise"] as const) {
    const entry = source[plan];
    if (!entry || typeof entry !== "object") continue;
    const monthly = Number((entry as { monthly?: unknown }).monthly);
    const yearly = Number((entry as { yearly?: unknown }).yearly);
    result[plan] = {
      monthly: Number.isFinite(monthly)
        ? monthly
        : DEFAULT_PLAN_PRICES[plan].monthly,
      yearly: Number.isFinite(yearly)
        ? yearly
        : DEFAULT_PLAN_PRICES[plan].yearly,
    };
  }
  return result;
}

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
  subscriptionPlanPrices: DEFAULT_PLAN_PRICES,
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
    subscriptionPlanPrices: normalizePrices(row.subscription_plan_prices),
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
      subscription_plan_prices: form.subscriptionPlanPrices,
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
