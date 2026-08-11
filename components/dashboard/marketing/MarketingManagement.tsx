"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MarketingFeatureGate } from "@/components/dashboard/MarketingFeatureGate";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  cancelMarketingCampaign,
  createMarketingCampaign,
  deleteMarketingCampaign,
  fetchMarketingCampaigns,
  fetchMarketingTemplates,
  getMarketingSummary,
  previewAudience,
  saveMarketingTemplate,
  scheduleMarketingCampaign,
  sendMarketingCampaign,
} from "@/lib/marketing/campaigns";
import {
  CAMPAIGN_TYPES,
  MARKETING_CHANNELS_UI,
  type AudienceFilters,
  type CampaignType,
  type MarketingCampaign,
  type MarketingChannel,
  type MarketingTemplate,
} from "@/lib/marketing/types";
import { formatDemoDate, formatDemoDateTime } from "@/lib/demo-requests/utils";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { CUSTOMER_TAG_PRESETS } from "@/lib/customers/sync-customer";

type Tab = "overview" | "campaigns" | "create" | "templates";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "campaigns", label: "Campaigns" },
  { id: "create", label: "Create Campaign" },
  { id: "templates", label: "Templates" },
];

const emptyFilters = (): AudienceFilters => ({
  visitedWithinDays: null,
  noVisitDays: null,
  birthdayMonth: null,
  minTotalSpent: null,
  maxTotalSpent: null,
  minOrderCount: null,
  minReservationCount: null,
  tagsAny: [],
  customTags: [],
  minLoyaltyPoints: null,
});

export function MarketingManagement() {
  return (
    <MarketingFeatureGate>
      <MarketingManagementContent />
    </MarketingFeatureGate>
  );
}

function MarketingManagementContent() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const [tab, setTab] = useState<Tab>("overview");
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MarketingCampaign | null>(
    null,
  );

  // Create form
  const [name, setName] = useState("");
  const [campaignType, setCampaignType] = useState<CampaignType>("Custom");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [notes, setNotes] = useState("");
  const [channels, setChannels] = useState<MarketingChannel[]>([
    "whatsapp",
    "email",
  ]);
  const [filters, setFilters] = useState<AudienceFilters>(emptyFilters());
  const [scheduleMode, setScheduleMode] = useState<"now" | "later" | "draft">(
    "draft",
  );
  const [scheduledAt, setScheduledAt] = useState("");
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewRevenue, setPreviewRevenue] = useState(0);
  const [templateSlug, setTemplateSlug] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] =
    useState<MarketingTemplate | null>(null);

  const load = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [campaignsResult, templatesResult] = await Promise.all([
      fetchMarketingCampaigns(restaurant.id),
      fetchMarketingTemplates(restaurant.id),
    ]);
    setLoading(false);

    if (!campaignsResult.ok) {
      showToast(campaignsResult.message, "error");
      setCampaigns([]);
    } else {
      setCampaigns(campaignsResult.data);
    }

    if (templatesResult.ok) setTemplates(templatesResult.data);
  }, [restaurant?.id, showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(
    () => getMarketingSummary(campaigns),
    [campaigns],
  );

  const upcomingCampaigns = useMemo(
    () =>
      campaigns.filter(
        (c) => c.status === "scheduled" || (c.status === "draft" && c.scheduledAt),
      ),
    [campaigns],
  );

  const runPreview = async () => {
    if (!restaurant?.id) return;
    setBusy(true);
    const result = await previewAudience(restaurant.id, filters);
    setBusy(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setPreviewCount(result.count);
    setPreviewRevenue(result.estimatedRevenue);
  };

  const applyTemplate = (template: MarketingTemplate) => {
    setTemplateSlug(template.slug);
    setSubject(template.subject);
    setMessage(template.message);
    if (!name.trim()) setName(template.name);
    setTab("create");
    showToast(`Loaded “${template.name}” template`);
  };

  const toggleChannel = (channel: MarketingChannel) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel],
    );
  };

  const toggleTag = (tag: string) => {
    setFilters((prev) => {
      const tags = new Set(prev.tagsAny ?? []);
      if (tags.has(tag)) tags.delete(tag);
      else tags.add(tag);
      return { ...prev, tagsAny: [...tags] };
    });
  };

  const handleCreate = async () => {
    if (!restaurant?.id) return;
    if (!name.trim() || !message.trim()) {
      showToast("Campaign name and message are required.", "error");
      return;
    }
    if (channels.length === 0) {
      showToast("Select at least one channel.", "error");
      return;
    }
    setBusy(true);
    const result = await createMarketingCampaign({
      restaurantId: restaurant.id,
      name,
      campaignType,
      subject,
      message,
      notes,
      channels,
      audienceFilters: filters,
      scheduleMode,
      scheduledAt: scheduledAt || null,
      estimatedRevenue: previewRevenue,
      templateSlug,
    });
    setBusy(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    showToast("Campaign saved");
    setName("");
    setSubject("");
    setMessage("");
    setNotes("");
    setFilters(emptyFilters());
    setPreviewCount(null);
    setScheduleMode("draft");
    setScheduledAt("");
    setTemplateSlug(null);
    setTab("campaigns");
    await load();
  };

  const handleSaveTemplate = async () => {
    if (!restaurant?.id || !editingTemplate) return;
    setBusy(true);
    const result = await saveMarketingTemplate({
      restaurantId: restaurant.id,
      slug: editingTemplate.slug,
      name: editingTemplate.name,
      subject: editingTemplate.subject,
      message: editingTemplate.message,
    });
    setBusy(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    showToast("Template saved");
    setEditingTemplate(null);
    await load();
  };

  if (restaurantLoading || loading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Marketing Center
          </h1>
        </header>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
          Marketing Center
        </h1>
        <p className="mt-1 text-sm text-white/45">
          Build CRM-powered campaigns for WhatsApp and Email — provider-ready.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
              tab === item.id
                ? "border-gold/40 bg-gold text-black"
                : "border-white/10 bg-black/20 text-white/65 hover:border-gold/25 hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: "Campaigns", value: String(summary.campaigns) },
              { label: "Recipients", value: String(summary.recipients) },
              { label: "Messages Sent", value: String(summary.messagesSent) },
              {
                label: "Estimated Revenue",
                value: `KD ${summary.estimatedRevenue.toFixed(3)}`,
              },
              { label: "Upcoming Campaigns", value: String(summary.upcoming) },
            ].map((card, index) => (
              <DashboardCard key={card.label} delay={index * 0.04} className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
                  {card.label}
                </p>
                <p className="mt-2 font-serif text-2xl font-bold text-white">
                  {card.value}
                </p>
              </DashboardCard>
            ))}
          </div>

          <DashboardCard className="p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
              Upcoming campaigns
            </h2>
            {upcomingCampaigns.length === 0 ? (
              <p className="mt-4 text-sm text-white/45">
                No upcoming campaigns. Create one to get started.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {upcomingCampaigns.slice(0, 5).map((campaign) => (
                  <li
                    key={campaign.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/25 px-4 py-3 text-sm"
                  >
                    <span className="text-white/85">{campaign.name}</span>
                    <span className="text-white/45">
                      {campaign.scheduledAt
                        ? formatDemoDateTime(campaign.scheduledAt)
                        : campaign.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </DashboardCard>
        </>
      ) : null}

      {tab === "campaigns" ? (
        <DashboardCard className="p-5">
          {campaigns.length === 0 ? (
            <p className="py-10 text-center text-sm text-white/45">
              No campaigns yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {[
                      "Campaign",
                      "Audience",
                      "Created By",
                      "Created Date",
                      "Status",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-3 py-3 text-xs uppercase tracking-wider text-white/40"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((campaign) => (
                    <tr
                      key={campaign.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="px-3 py-3">
                        <p className="text-sm text-white/85">{campaign.name}</p>
                        <p className="text-xs text-white/40">
                          {campaign.campaignType} · {campaign.channels.join(", ")}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm text-white/65">
                        {campaign.recipientCount} recipients
                      </td>
                      <td className="px-3 py-3 text-sm text-white/65">
                        {campaign.createdByName ||
                          campaign.createdByEmail ||
                          "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {formatDemoDate(campaign.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <StatusPill status={campaign.status} />
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {campaign.status !== "sent" &&
                          campaign.status !== "cancelled" ? (
                            <>
                              <button
                                type="button"
                                disabled={busy}
                                className="menu-btn-secondary !px-2 !py-1 text-[11px]"
                                onClick={async () => {
                                  setBusy(true);
                                  const result = await sendMarketingCampaign({
                                    restaurantId: restaurant!.id,
                                    campaignId: campaign.id,
                                  });
                                  setBusy(false);
                                  if (!result.ok) {
                                    showToast(result.message, "error");
                                    return;
                                  }
                                  showToast("Campaign queued as sent");
                                  await load();
                                }}
                              >
                                Send
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                className="menu-btn-secondary !px-2 !py-1 text-[11px]"
                                onClick={async () => {
                                  const when =
                                    scheduledAt ||
                                    new Date(
                                      Date.now() + 86400000,
                                    ).toISOString();
                                  setBusy(true);
                                  const result = await scheduleMarketingCampaign(
                                    {
                                      restaurantId: restaurant!.id,
                                      campaignId: campaign.id,
                                      scheduledAt: when,
                                    },
                                  );
                                  setBusy(false);
                                  if (!result.ok) {
                                    showToast(result.message, "error");
                                    return;
                                  }
                                  showToast("Campaign scheduled");
                                  await load();
                                }}
                              >
                                Schedule
                              </button>
                              <button
                                type="button"
                                disabled={busy}
                                className="menu-btn-secondary !px-2 !py-1 text-[11px]"
                                onClick={async () => {
                                  setBusy(true);
                                  const result = await cancelMarketingCampaign(
                                    restaurant!.id,
                                    campaign.id,
                                  );
                                  setBusy(false);
                                  if (!result.ok) {
                                    showToast(result.message, "error");
                                    return;
                                  }
                                  showToast("Campaign cancelled");
                                  await load();
                                }}
                              >
                                Cancel
                              </button>
                            </>
                          ) : null}
                          <button
                            type="button"
                            disabled={busy}
                            className="menu-btn-secondary !px-2 !py-1 text-[11px]"
                            onClick={() => setDeleteTarget(campaign)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DashboardCard>
      ) : null}

      {tab === "create" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <DashboardCard className="space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
              Campaign content
            </h2>
            <Field label="Campaign name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                placeholder="Ramadan VIP offer"
              />
            </Field>
            <Field label="Type">
              <select
                value={campaignType}
                onChange={(e) =>
                  setCampaignType(e.target.value as CampaignType)
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
              >
                {CAMPAIGN_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Subject">
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                placeholder="Optional subject (email)"
              />
            </Field>
            <Field label="Message">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                placeholder="Use {{name}} for personalization"
              />
            </Field>
            <Field label="Notes">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                placeholder="Internal notes"
              />
            </Field>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">
                Channels
              </p>
              <div className="flex flex-wrap gap-2">
                {MARKETING_CHANNELS_UI.map((channel) => (
                  <button
                    key={channel}
                    type="button"
                    onClick={() => toggleChannel(channel)}
                    className={`rounded-full border px-3 py-1.5 text-xs capitalize ${
                      channels.includes(channel)
                        ? "border-gold/40 bg-gold/15 text-gold"
                        : "border-white/10 bg-black/20 text-white/55"
                    }`}
                  >
                    {channel}
                  </button>
                ))}
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/35">
                  SMS (future)
                </span>
                <span className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/35">
                  Push (future)
                </span>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">
                Schedule
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    ["draft", "Save draft"],
                    ["now", "Schedule now (send)"],
                    ["later", "Schedule later"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setScheduleMode(mode)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      scheduleMode === mode
                        ? "border-gold/40 bg-gold/15 text-gold"
                        : "border-white/10 bg-black/20 text-white/55"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {scheduleMode === "later" ? (
                <input
                  type="datetime-local"
                  value={scheduledAt.slice(0, 16)}
                  onChange={(e) =>
                    setScheduledAt(
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : "",
                    )
                  }
                  className="mt-3 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                />
              ) : null}
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={() => void handleCreate()}
              className="menu-btn-primary"
            >
              Save Campaign
            </button>
          </DashboardCard>

          <DashboardCard className="space-y-4 p-5">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
              Audience builder
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Visited in last X days">
                <input
                  type="number"
                  min={0}
                  value={filters.visitedWithinDays ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      visitedWithinDays: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                />
              </Field>
              <Field label="No visit in X days">
                <input
                  type="number"
                  min={0}
                  value={filters.noVisitDays ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      noVisitDays: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                />
              </Field>
              <Field label="Birthday month">
                <select
                  value={filters.birthdayMonth ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      birthdayMonth: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                >
                  <option value="">Any</option>
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {new Date(2000, i, 1).toLocaleString("en", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Min total spent">
                <input
                  type="number"
                  min={0}
                  step="0.001"
                  value={filters.minTotalSpent ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      minTotalSpent: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                />
              </Field>
              <Field label="Min order count">
                <input
                  type="number"
                  min={0}
                  value={filters.minOrderCount ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      minOrderCount: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                />
              </Field>
              <Field label="Min reservation count">
                <input
                  type="number"
                  min={0}
                  value={filters.minReservationCount ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      minReservationCount: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                />
              </Field>
              <Field label="Min loyalty points">
                <input
                  type="number"
                  min={0}
                  value={filters.minLoyaltyPoints ?? ""}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      minLoyaltyPoints: e.target.value
                        ? Number(e.target.value)
                        : null,
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                />
              </Field>
              <Field label="Custom tags (comma-separated)">
                <input
                  value={(filters.customTags ?? []).join(", ")}
                  onChange={(e) =>
                    setFilters((f) => ({
                      ...f,
                      customTags: e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean),
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
                  placeholder="Family, Catering"
                />
              </Field>
            </div>

            <div>
              <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">
                Tags
              </p>
              <div className="flex flex-wrap gap-2">
                {CUSTOMER_TAG_PRESETS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1.5 text-xs ${
                      (filters.tagsAny ?? []).includes(tag)
                        ? "border-gold/40 bg-gold/15 text-gold"
                        : "border-white/10 bg-black/20 text-white/55"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={busy}
                onClick={() => void runPreview()}
                className="menu-btn-secondary"
              >
                Preview recipients
              </button>
              {previewCount != null ? (
                <p className="text-sm text-white/65">
                  <span className="text-gold">{previewCount}</span> recipients ·
                  est. KD {previewRevenue.toFixed(3)}
                </p>
              ) : null}
            </div>
          </DashboardCard>
        </div>
      ) : null}

      {tab === "templates" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <DashboardCard key={template.slug} className="space-y-3 p-5">
              <h3 className="font-medium text-white">{template.name}</h3>
              <p className="text-xs text-white/40">{template.subject}</p>
              <p className="line-clamp-3 text-sm text-white/60">
                {template.message}
              </p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                  onClick={() => applyTemplate(template)}
                >
                  Use template
                </button>
                <button
                  type="button"
                  className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                  onClick={() => setEditingTemplate({ ...template })}
                >
                  Edit
                </button>
              </div>
            </DashboardCard>
          ))}
        </div>
      ) : null}

      {editingTemplate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="dashboard-card w-full max-w-lg space-y-4 rounded-2xl p-6">
            <h3 className="font-serif text-xl font-bold text-white">
              Edit template
            </h3>
            <Field label="Name">
              <input
                value={editingTemplate.name}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    name: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
              />
            </Field>
            <Field label="Subject">
              <input
                value={editingTemplate.subject}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    subject: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
              />
            </Field>
            <Field label="Message">
              <textarea
                value={editingTemplate.message}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    message: e.target.value,
                  })
                }
                rows={5}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
              />
            </Field>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSaveTemplate()}
                className="menu-btn-primary"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setEditingTemplate(null)}
                className="menu-btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={deleteTarget != null}
        title="Delete campaign?"
        description={`Delete “${deleteTarget?.name ?? ""}”? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          void (async () => {
            if (!deleteTarget || !restaurant?.id) return;
            setBusy(true);
            const result = await deleteMarketingCampaign(
              restaurant.id,
              deleteTarget.id,
            );
            setBusy(false);
            setDeleteTarget(null);
            if (!result.ok) {
              showToast(result.message, "error");
              return;
            }
            showToast("Campaign deleted");
            await load();
          })();
        }}
      />

    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm text-white/60">
      <span className="mb-1.5 block text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </span>
      {children}
    </label>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "border-white/15 bg-white/5 text-white/50",
    scheduled: "border-sky-500/35 bg-sky-500/10 text-sky-300",
    sent: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
    cancelled: "border-red-500/35 bg-red-500/10 text-red-300",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs capitalize ${styles[status] ?? styles.draft}`}
    >
      {status}
    </span>
  );
}
