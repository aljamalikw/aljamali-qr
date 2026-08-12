"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchCustomers } from "@/lib/customers/queries";
import type { Customer } from "@/lib/customers/sync-customer";
import {
  createMarketingCampaign,
  fetchMarketingTemplates,
  previewAudience,
} from "@/lib/marketing/campaigns";
import {
  applyCampaignPlaceholders,
  buildPreviewVars,
} from "@/lib/marketing/templates";
import {
  AUDIENCE_PRESET_LABELS,
  CAMPAIGN_TYPES,
  type AudienceFilters,
  type AudiencePresetId,
  type CampaignType,
  type MarketingTemplate,
} from "@/lib/marketing/types";
import {
  copyTextToClipboard,
  openWhatsAppShare,
} from "@/lib/marketing/whatsapp/share";
import {
  planAllowsMarketingScheduling,
  planAllowsMarketingTemplates,
} from "@/lib/subscriptions/plans";

type WhatsAppCampaignBuilderProps = {
  open: boolean;
  restaurantId: string;
  restaurantName: string;
  plan: string;
  bypassAdmin?: boolean;
  onClose: () => void;
  onCreated?: () => void;
};

const PLACEHOLDERS = [
  "{{customer_name}}",
  "{{first_name}}",
  "{{restaurant_name}}",
  "{{loyalty_points}}",
  "{{last_order_date}}",
  "{{total_orders}}",
] as const;

function emptyFilters(): AudienceFilters {
  return {
    requireMarketingOptIn: true,
    audiencePreset: AUDIENCE_PRESET_LABELS.all_opted_in,
    visitedWithinDays: null,
    noVisitDays: null,
    birthdayMonth: null,
    minTotalSpent: null,
    maxTotalSpent: null,
    minOrderCount: null,
    maxOrderCount: null,
    minReservationCount: null,
    tagsAny: [],
    customTags: [],
    minLoyaltyPoints: null,
    loyaltyEnrolled: null,
    newCustomersOnly: null,
    customCustomerIds: null,
  };
}

function buildFiltersFromPreset(
  preset: AudiencePresetId,
  extras: {
    inactiveDays?: number;
    minOrders?: number;
    minSpent?: number;
    customIds?: string[];
  },
): AudienceFilters {
  const base = emptyFilters();
  base.audiencePreset = AUDIENCE_PRESET_LABELS[preset];

  switch (preset) {
    case "all_opted_in":
      return base;
    case "loyalty":
      return { ...base, loyaltyEnrolled: true };
    case "vip":
      return { ...base, tagsAny: ["VIP"] };
    case "new":
      return { ...base, newCustomersOnly: true };
    case "birthday_month":
      return { ...base, birthdayMonth: new Date().getMonth() + 1 };
    case "inactive":
      return { ...base, noVisitDays: extras.inactiveDays ?? 30 };
    case "orders":
      return { ...base, minOrderCount: extras.minOrders ?? 3 };
    case "spent":
      return { ...base, minTotalSpent: extras.minSpent ?? 25 };
    case "custom":
      return {
        ...base,
        customCustomerIds: extras.customIds ?? [],
        audiencePreset: AUDIENCE_PRESET_LABELS.custom,
      };
    default:
      return base;
  }
}

export function WhatsAppCampaignBuilder({
  open,
  restaurantId,
  restaurantName,
  plan,
  bypassAdmin = false,
  onClose,
  onCreated,
}: WhatsAppCampaignBuilderProps) {
  const { showToast } = useToast();
  const schedulingAllowed =
    bypassAdmin || planAllowsMarketingScheduling(plan);
  const templatesAllowed =
    bypassAdmin || planAllowsMarketingTemplates(plan);

  const [name, setName] = useState("");
  const [campaignType, setCampaignType] = useState<CampaignType>("Custom");
  const [message, setMessage] = useState(
    "Hello {{first_name}} 👋\n\nWe have a special offer just for you!\nEnjoy 20% OFF this weekend.\n\nWe look forward to serving you!\n\n{{restaurant_name}}",
  );
  const [preset, setPreset] = useState<AudiencePresetId>("all_opted_in");
  const [inactiveDays, setInactiveDays] = useState(30);
  const [minOrders, setMinOrders] = useState(3);
  const [minSpent, setMinSpent] = useState(25);
  const [customIds, setCustomIds] = useState<string[]>([]);
  const [optedInCustomers, setOptedInCustomers] = useState<Customer[]>([]);
  const [optedInTotal, setOptedInTotal] = useState(0);
  const [excludedCount, setExcludedCount] = useState(0);
  const [previewCount, setPreviewCount] = useState(0);
  const [enableWhatsAppShare, setEnableWhatsAppShare] = useState(true);
  const [enableCopy, setEnableCopy] = useState(true);
  const [scheduleMode, setScheduleMode] = useState<"now" | "later" | "draft">(
    "draft",
  );
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("10:00");
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kuwait",
  );
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [busy, setBusy] = useState(false);

  const filters = useMemo(
    () =>
      buildFiltersFromPreset(preset, {
        inactiveDays,
        minOrders,
        minSpent,
        customIds,
      }),
    [preset, inactiveDays, minOrders, minSpent, customIds],
  );

  const previewText = useMemo(() => {
    return applyCampaignPlaceholders(
      message,
      buildPreviewVars(restaurantName, optedInCustomers[0] ?? null),
    );
  }, [message, restaurantName, optedInCustomers]);

  const refreshPreview = useCallback(async () => {
    const result = await previewAudience(restaurantId, filters);
    if (!result.ok) return;
    setPreviewCount(result.count);
    setOptedInTotal(result.optedInTotal);
    setExcludedCount(result.excludedCount);
  }, [restaurantId, filters]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      const [customersResult, templatesResult] = await Promise.all([
        fetchCustomers(restaurantId),
        fetchMarketingTemplates(restaurantId),
      ]);
      if (customersResult.ok) {
        const opted = customersResult.data.filter(
          (c) => c.metadata?.marketing_opt_in === true,
        );
        setOptedInCustomers(opted);
        setOptedInTotal(opted.length);
        setExcludedCount(customersResult.data.length - opted.length);
      }
      if (templatesResult.ok) setTemplates(templatesResult.data);
    })();
  }, [open, restaurantId]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void refreshPreview();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, refreshPreview]);

  useEffect(() => {
    if (!schedulingAllowed && scheduleMode === "later") {
      setScheduleMode("draft");
    }
  }, [schedulingAllowed, scheduleMode]);

  if (!open) return null;

  const reset = () => {
    setName("");
    setCampaignType("Custom");
    setPreset("all_opted_in");
    setCustomIds([]);
    setScheduleMode("draft");
    setScheduledDate("");
    setScheduledTime("10:00");
    setEnableWhatsAppShare(true);
    setEnableCopy(true);
  };

  const insertPlaceholder = (token: string) => {
    setMessage((prev) => `${prev}${prev.endsWith("\n") || !prev ? "" : " "}${token}`);
  };

  const applyTemplate = (template: MarketingTemplate) => {
    setMessage(template.message);
    if (!name.trim()) setName(template.name);
    const matched = CAMPAIGN_TYPES.find((type) => type === template.name);
    if (matched) setCampaignType(matched);
    showToast(`Loaded “${template.name}” template`);
  };

  const handleCopyCampaign = async () => {
    const ok = await copyTextToClipboard(previewText);
    if (ok) showToast("Message copied successfully.");
    else showToast("Unable to copy message.", "error");
  };

  const handleSubmit = async (mode: "draft" | "later" | "now" = scheduleMode) => {
    if (!name.trim() || !message.trim()) {
      showToast("Campaign name and message are required.", "error");
      return;
    }
    if (!enableWhatsAppShare && !enableCopy) {
      showToast("Enable WhatsApp Share or Copy Message.", "error");
      return;
    }
    if (preset === "custom" && customIds.length === 0) {
      showToast("Select at least one opted-in customer.", "error");
      return;
    }
    if (mode === "later" && !scheduledDate) {
      showToast("Choose a schedule date.", "error");
      return;
    }

    let scheduledAt: string | null = null;
    if (mode === "later" && scheduledDate) {
      scheduledAt = new Date(
        `${scheduledDate}T${scheduledTime || "10:00"}:00`,
      ).toISOString();
    }

    setBusy(true);
    const result = await createMarketingCampaign({
      restaurantId,
      name,
      campaignType,
      message,
      channels: ["whatsapp"],
      audienceFilters: filters,
      scheduleMode: mode,
      scheduledAt,
      estimatedRevenue: 0,
    });
    setBusy(false);

    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }

    if (mode === "now" && enableWhatsAppShare && result.shareText) {
      openWhatsAppShare(result.shareText);
      showToast("Campaign shared — WhatsApp opened with your message.");
    } else if (mode === "now" && enableCopy && result.shareText) {
      await copyTextToClipboard(result.shareText);
      showToast("Message copied successfully.");
    } else {
      showToast(
        mode === "later"
          ? "Campaign scheduled — share from history when ready."
          : "Draft saved",
      );
    }

    reset();
    onCreated?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close campaign builder"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="whatsapp-campaign-title"
        className="dashboard-card relative z-10 flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-t-2xl border border-gold/15 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <h2
              id="whatsapp-campaign-title"
              className="font-serif text-xl font-bold text-white"
            >
              Create WhatsApp Campaign
            </h2>
            <p className="mt-1 text-sm text-white/45">
              Free WhatsApp Share — no API credentials required.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
          <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
            Only customers who have opted in to receive promotions will receive
            this campaign.
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <DashboardCard className="space-y-4 p-4">
              <Field label="Campaign name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  placeholder="Weekend offer"
                />
              </Field>
              <Field label="Type">
                <select
                  value={campaignType}
                  onChange={(e) =>
                    setCampaignType(e.target.value as CampaignType)
                  }
                  className={inputClass}
                >
                  {CAMPAIGN_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </Field>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Recipient summary
                </p>
                <div className="space-y-2 rounded-xl border border-gold/20 bg-gold/10 px-4 py-3 text-sm">
                  <p className="text-gold">
                    {previewCount} eligible · {optedInTotal} customers opted in
                  </p>
                  <p className="text-xs text-white/55">
                    {excludedCount} excluded (no marketing consent)
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Audience
                </p>
                <div className="space-y-2">
                  {(
                    Object.keys(AUDIENCE_PRESET_LABELS) as AudiencePresetId[]
                  ).map((id) => (
                    <label
                      key={id}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white/80"
                    >
                      <input
                        type="radio"
                        name="audience-preset"
                        checked={preset === id}
                        onChange={() => setPreset(id)}
                        className="mt-0.5 text-gold focus:ring-gold/30"
                      />
                      <span>{AUDIENCE_PRESET_LABELS[id]}</span>
                    </label>
                  ))}
                </div>

                {preset === "inactive" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[7, 30, 60, 90].map((days) => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => setInactiveDays(days)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          inactiveDays === days
                            ? "border-gold/40 bg-gold/15 text-gold"
                            : "border-white/10 text-white/55"
                        }`}
                      >
                        {days} days
                      </button>
                    ))}
                  </div>
                ) : null}

                {preset === "orders" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[1, 3, 5, 10].map((count) => (
                      <button
                        key={count}
                        type="button"
                        onClick={() => setMinOrders(count)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          minOrders === count
                            ? "border-gold/40 bg-gold/15 text-gold"
                            : "border-white/10 text-white/55"
                        }`}
                      >
                        {count}+
                      </button>
                    ))}
                  </div>
                ) : null}

                {preset === "spent" ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[10, 25, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => setMinSpent(amount)}
                        className={`rounded-full border px-3 py-1 text-xs ${
                          minSpent === amount
                            ? "border-gold/40 bg-gold/15 text-gold"
                            : "border-white/10 text-white/55"
                        }`}
                      >
                        KD {amount}+
                      </button>
                    ))}
                  </div>
                ) : null}

                {preset === "custom" ? (
                  <div className="mt-3 max-h-40 space-y-1 overflow-y-auto rounded-xl border border-white/10 p-2">
                    {optedInCustomers.length === 0 ? (
                      <p className="p-2 text-xs text-white/45">
                        No opted-in customers yet.
                      </p>
                    ) : (
                      optedInCustomers.map((customer) => {
                        const checked = customIds.includes(customer.id);
                        return (
                          <label
                            key={customer.id}
                            className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/75 hover:bg-white/5"
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setCustomIds((prev) =>
                                  checked
                                    ? prev.filter((id) => id !== customer.id)
                                    : [...prev, customer.id],
                                );
                              }}
                            />
                            <span className="truncate">
                              {customer.fullName || "Guest"} ·{" "}
                              {customer.phone || "no phone"}
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                ) : null}
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Send via
                </p>
                <div className="space-y-2">
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={enableWhatsAppShare}
                      onChange={(e) => setEnableWhatsAppShare(e.target.checked)}
                      className="rounded border-white/20 text-gold focus:ring-gold/30"
                    />
                    WhatsApp Share
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 text-sm text-white/80">
                    <input
                      type="checkbox"
                      checked={enableCopy}
                      onChange={(e) => setEnableCopy(e.target.checked)}
                      className="rounded border-white/20 text-gold focus:ring-gold/30"
                    />
                    Copy Message
                  </label>
                  <p className="flex items-center gap-3 text-sm text-white/35">
                    <input type="checkbox" disabled className="rounded opacity-40" />
                    Email (coming soon)
                  </p>
                  <p className="flex items-center gap-3 text-sm text-white/35">
                    <input type="checkbox" disabled className="rounded opacity-40" />
                    SMS (coming soon)
                  </p>
                  <p className="flex items-center gap-3 text-sm text-white/35">
                    <input type="checkbox" disabled className="rounded opacity-40" />
                    Push Notifications (coming soon)
                  </p>
                </div>
              </div>
            </DashboardCard>

            <div className="space-y-4">
              <DashboardCard className="space-y-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                    Message
                  </p>
                  {templatesAllowed ? (
                    <select
                      className="rounded-lg border border-white/10 bg-black/30 px-2 py-1 text-xs text-white"
                      defaultValue=""
                      onChange={(e) => {
                        const template = templates.find(
                          (item) => item.slug === e.target.value,
                        );
                        if (template) applyTemplate(template);
                        e.target.value = "";
                      }}
                    >
                      <option value="">Load template…</option>
                      {templates.map((template) => (
                        <option key={template.slug} value={template.slug}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-[11px] text-white/35">
                      Templates · Enterprise
                    </span>
                  )}
                </div>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={10}
                  className={inputClass}
                  placeholder="Write your WhatsApp message…"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PLACEHOLDERS.map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => insertPlaceholder(token)}
                      className="rounded-full border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/55 hover:border-gold/30 hover:text-gold"
                    >
                      {token}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyCampaign()}
                  className="menu-btn-secondary w-full"
                >
                  Copy Campaign
                </button>
              </DashboardCard>

              <DashboardCard className="p-4">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  WhatsApp preview
                </p>
                <div className="mx-auto w-full max-w-[280px] rounded-[1.75rem] border border-white/15 bg-[#0b141a] p-3 shadow-xl">
                  <div className="mb-3 flex items-center gap-2 border-b border-white/10 pb-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/20 text-xs text-gold">
                      QR
                    </span>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {restaurantName || "Restaurant"}
                      </p>
                      <p className="text-[10px] text-white/40">WhatsApp Business</p>
                    </div>
                  </div>
                  <div className="rounded-2xl rounded-tl-sm bg-[#005c4b] px-3 py-2 text-sm leading-relaxed whitespace-pre-wrap text-white/95">
                    {previewText || "Your message preview appears here."}
                  </div>
                </div>
              </DashboardCard>

              <DashboardCard className="space-y-3 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  When to share
                </p>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["draft", "Save draft"],
                      ["now", "Share on WhatsApp"],
                      ["later", "Schedule later"],
                    ] as const
                  ).map(([mode, label]) => {
                    const locked = mode === "later" && !schedulingAllowed;
                    return (
                      <button
                        key={mode}
                        type="button"
                        disabled={locked}
                        title={
                          locked
                            ? "Scheduling is available on Enterprise"
                            : undefined
                        }
                        onClick={() => setScheduleMode(mode)}
                        className={`rounded-full border px-3 py-1.5 text-xs ${
                          scheduleMode === mode
                            ? "border-gold/40 bg-gold/15 text-gold"
                            : locked
                              ? "cursor-not-allowed border-white/5 text-white/25"
                              : "border-white/10 text-white/55"
                        }`}
                      >
                        {label}
                        {locked ? " · Enterprise" : ""}
                      </button>
                    );
                  })}
                </div>
                {scheduleMode === "later" && schedulingAllowed ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      className={inputClass}
                      placeholder="Timezone"
                    />
                  </div>
                ) : null}
                <p className="text-xs text-white/40">
                  Sharing opens WhatsApp with your message pre-filled. Nothing is
                  sent automatically.
                </p>
              </DashboardCard>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="menu-btn-secondary"
            disabled={busy}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit(scheduleMode)}
            className="menu-btn-primary"
            disabled={busy}
          >
            {busy
              ? "Working…"
              : scheduleMode === "now"
                ? "Share on WhatsApp"
                : scheduleMode === "later"
                  ? "Schedule Campaign"
                  : "Save Draft"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}
