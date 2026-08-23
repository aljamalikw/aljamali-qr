"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MarketingFeatureGate } from "@/components/dashboard/MarketingFeatureGate";
import { WhatsAppCampaignBuilder } from "@/components/dashboard/marketing/WhatsAppCampaignBuilder";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { isAdminRole } from "@/lib/auth/roles";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { WhatsAppChatModal } from "@/components/dashboard/customers/WhatsAppChatModal";
import { ExportMenu, exportFormatSuccessLabel } from "@/components/dashboard/ExportMenu";
import {
  buildMarketingCampaignsExportDataset,
  buildMarketingRecipientsExportDataset,
} from "@/lib/export/datasets/marketing";
import {
  cancelMarketingCampaign,
  deleteMarketingCampaign,
  fetchCampaignAnalytics,
  fetchCampaignRecipients,
  fetchMarketingCampaigns,
  fetchMarketingTemplates,
  getMarketingSummary,
  saveMarketingTemplate,
  scheduleMarketingCampaign,
  shareMarketingCampaign,
  type CampaignAnalytics,
  type CampaignRecipientListItem,
} from "@/lib/marketing/campaigns";
import {
  campaignStatusLabel,
  describeAudienceFilters,
  isCampaignSharedStatus,
  type MarketingCampaign,
  type MarketingTemplate,
} from "@/lib/marketing/types";
import { customerHasMarketingOptIn } from "@/lib/customers/whatsapp-chat";
import type { Customer } from "@/lib/customers/sync-customer";
import { openWhatsAppShare } from "@/lib/marketing/whatsapp/share";
import { formatDemoDateTime } from "@/lib/demo-requests/utils";
import { getSafeRestaurantName } from "@/lib/restaurants/display";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import {
  planAllowsMarketingAnalytics,
  planAllowsMarketingScheduling,
  planAllowsMarketingTemplates,
} from "@/lib/subscriptions/plans";

type Tab = "overview" | "campaigns" | "templates" | "analytics";

const PAGE_SIZE = 10;

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
  const { access } = useSubscriptionAccess();
  const { role } = useAuthUser();
  const bypassAdmin = isAdminRole(role);
  const plan = access.locationPlan;
  const templatesAllowed =
    bypassAdmin || planAllowsMarketingTemplates(plan);
  const schedulingAllowed =
    bypassAdmin || planAllowsMarketingScheduling(plan);
  const analyticsAllowed =
    bypassAdmin || planAllowsMarketingAnalytics(plan);

  const tabs = useMemo(() => {
    const items: { id: Tab; label: string }[] = [
      { id: "overview", label: "Overview" },
      { id: "campaigns", label: "Campaign History" },
    ];
    if (templatesAllowed) items.push({ id: "templates", label: "Templates" });
    if (analyticsAllowed) items.push({ id: "analytics", label: "Analytics" });
    return items;
  }, [templatesAllowed, analyticsAllowed]);

  const [tab, setTab] = useState<Tab>("overview");
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [page, setPage] = useState(1);
  const [selectedCampaign, setSelectedCampaign] =
    useState<MarketingCampaign | null>(null);
  const [templates, setTemplates] = useState<MarketingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<MarketingCampaign | null>(
    null,
  );
  const [editingTemplate, setEditingTemplate] =
    useState<MarketingTemplate | null>(null);
  const [analyticsCampaignId, setAnalyticsCampaignId] = useState<string>("");
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [scheduleDraft, setScheduleDraft] = useState({
    campaignId: "",
    date: "",
    time: "10:00",
  });
  const [recipientsOpen, setRecipientsOpen] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [recipientsCampaignName, setRecipientsCampaignName] = useState("");
  const [recipientsCampaignId, setRecipientsCampaignId] = useState<string | null>(
    null,
  );
  const [recipientsMessage, setRecipientsMessage] = useState("");
  const [recipients, setRecipients] = useState<CampaignRecipientListItem[]>([]);
  const [chatCustomer, setChatCustomer] = useState<Customer | null>(null);
  const loadedRestaurantId = useRef<string | null>(null);

  const load = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      setCampaigns([]);
      return;
    }
    if (loadedRestaurantId.current !== restaurant.id) {
      loadedRestaurantId.current = restaurant.id;
      setPage(1);
      setSelectedCampaign(null);
      setAnalyticsCampaignId("");
      setRecipientsOpen(false);
      setDeleteTarget(null);
      setScheduleDraft({ campaignId: "", date: "", time: "10:00" });
      setChatCustomer(null);
    }
    setLoading(true);
    const [campaignsResult, templatesResult] = await Promise.all([
      fetchMarketingCampaigns(restaurant.id, { all: true }),
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

  useEffect(() => {
    if ((!templatesAllowed && tab === "templates") || (!analyticsAllowed && tab === "analytics")) {
      setTab("overview");
    }
  }, [templatesAllowed, analyticsAllowed, tab]);

  const summary = useMemo(() => getMarketingSummary(campaigns), [campaigns]);
  const totalCampaigns = campaigns.length;
  const totalPages = Math.max(1, Math.ceil(totalCampaigns / PAGE_SIZE));
  const pageCampaigns = useMemo(
    () => campaigns.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [campaigns, page],
  );

  const upcomingCampaigns = useMemo(
    () =>
      campaigns.filter(
        (c) =>
          c.status === "scheduled" || (c.status === "draft" && c.scheduledAt),
      ),
    [campaigns],
  );

  useEffect(() => {
    if (!analyticsAllowed || !restaurant?.id || !analyticsCampaignId) {
      setAnalytics(null);
      return;
    }
    void (async () => {
      const result = await fetchCampaignAnalytics(
        restaurant.id,
        analyticsCampaignId,
      );
      if (result.ok) setAnalytics(result.data);
      else setAnalytics(null);
    })();
  }, [analyticsAllowed, restaurant?.id, analyticsCampaignId]);

  useEffect(() => {
    if (analyticsAllowed && campaigns[0] && !analyticsCampaignId) {
      setAnalyticsCampaignId(campaigns[0].id);
    }
  }, [analyticsAllowed, campaigns, analyticsCampaignId]);

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

  const restaurantName = getSafeRestaurantName(restaurant);

  const getCampaignsExportDataset = useCallback(
    () =>
      buildMarketingCampaignsExportDataset({
        campaigns,
        restaurantName,
      }),
    [campaigns, restaurantName],
  );

  const getRecipientsExportDataset = useCallback(
    () =>
      buildMarketingRecipientsExportDataset({
        campaignName: recipientsCampaignName,
        recipients,
        restaurantName,
      }),
    [recipientsCampaignName, recipients, restaurantName],
  );

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
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Marketing Center
          </h1>
          <p className="mt-1 text-sm text-white/45">
            {restaurantName} · WhatsApp Share campaigns for opted-in CRM
            customers — free, no API credentials required.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportMenu
            getDataset={getCampaignsExportDataset}
            onEmpty={() =>
              showToast("No data matches the current filters.", "error")
            }
            onError={(message) => showToast(message, "error")}
            onSuccess={(format, rowCount) =>
              showToast(
                format === "pdf"
                  ? exportFormatSuccessLabel(format)
                  : `✓ Exported ${rowCount} campaigns`,
              )
            }
          />
          <button
            type="button"
            onClick={() => setBuilderOpen(true)}
            className="menu-btn-primary shrink-0"
          >
            New Campaign
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
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
              {
                label: "Campaigns",
                value: String(totalCampaigns),
                opensHistory: true,
              },
              {
                label: "Recipients",
                value: String(summary.recipients),
                opensHistory: true,
              },
              { label: "Messages Shared", value: String(summary.messagesSent) },
              {
                label: "Estimated Revenue",
                value: `KD ${summary.estimatedRevenue.toFixed(3)}`,
              },
              { label: "Upcoming", value: String(summary.upcoming) },
            ].map((card, index) => (
              <DashboardCard key={card.label} delay={index * 0.04} className="p-5">
                <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
                  {card.label}
                </p>
                <p className="mt-2 font-serif text-2xl font-bold text-white">
                  {card.value}
                </p>
                {card.opensHistory && totalCampaigns > 0 ? (
                  <button
                    type="button"
                    onClick={() => setTab("campaigns")}
                    className="mt-3 text-xs text-gold hover:underline"
                  >
                    View campaign history
                  </button>
                ) : null}
              </DashboardCard>
            ))}
          </div>

          <DashboardCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-white/45">
                {upcomingCampaigns.length > 0
                  ? "Upcoming campaigns"
                  : "Recent campaigns"}
              </h2>
              {totalCampaigns > 0 ? (
                <button
                  type="button"
                  onClick={() => setTab("campaigns")}
                  className="text-xs text-gold hover:underline"
                >
                  View all
                </button>
              ) : null}
            </div>
            {(upcomingCampaigns.length > 0
              ? upcomingCampaigns
              : campaigns
            ).length === 0 ? (
              <p className="mt-4 text-sm text-white/45">
                {restaurant
                  ? `No campaigns for ${restaurantName} yet.`
                  : "No campaigns created yet."}
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {(upcomingCampaigns.length > 0
                  ? upcomingCampaigns
                  : campaigns
                )
                  .slice(0, 5)
                  .map((campaign) => (
                  <li key={campaign.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedCampaign(campaign)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/25 px-4 py-3 text-start text-sm transition hover:border-gold/25"
                    >
                      <span className="text-white/85">{campaign.name}</span>
                      <span className="text-white/45">
                        {campaign.scheduledAt
                          ? formatDemoDateTime(campaign.scheduledAt)
                          : `${campaignStatusLabel(campaign.status)} · ${formatDemoDateTime(campaign.createdAt)}`}
                      </span>
                    </button>
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
              {restaurant
                ? `No campaigns for ${restaurantName} yet.`
                : "No campaigns created yet."}
            </p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1100px] text-left">
                  <thead>
                    <tr className="border-b border-gold/10">
                      {[
                        "Campaign Name",
                        "Type",
                        "Created",
                        "Audience",
                        "Recipients",
                        "Status",
                        "Message",
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
                    {pageCampaigns.map((campaign) => (
                      <tr
                        key={campaign.id}
                        className="cursor-pointer border-b border-white/5 last:border-0 hover:bg-white/[0.03]"
                        onClick={() => setSelectedCampaign(campaign)}
                      >
                        <td className="px-3 py-3">
                          <p className="text-sm text-white/85">{campaign.name}</p>
                        </td>
                        <td className="px-3 py-3 text-sm text-white/55">
                          {campaign.campaignType}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/50">
                          {formatDemoDateTime(campaign.createdAt)}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/65">
                          {audienceLabel(campaign)}
                        </td>
                        <td className="px-3 py-3 text-sm text-white/65">
                          {campaign.recipientCount}
                        </td>
                        <td className="px-3 py-3">
                          <StatusPill status={campaign.status} />
                        </td>
                        <td className="max-w-[220px] px-3 py-3 text-xs text-white/45">
                          <p className="line-clamp-2 whitespace-pre-wrap">
                            {campaign.message || "—"}
                          </p>
                        </td>
                        <td className="px-3 py-3">
                          <div
                            className="flex flex-wrap gap-1.5"
                            onClick={(event) => event.stopPropagation()}
                          >
                            <button
                              type="button"
                              className="menu-btn-secondary !px-2 !py-1 text-[11px]"
                              onClick={() => setSelectedCampaign(campaign)}
                            >
                              View
                            </button>
                            <button
                              type="button"
                              disabled={busy || recipientsLoading}
                              className="menu-btn-secondary !px-2 !py-1 text-[11px]"
                              onClick={async () => {
                                if (!restaurant?.id) return;
                                setRecipientsLoading(true);
                                const result = await fetchCampaignRecipients(
                                  restaurant.id,
                                  campaign.id,
                                );
                                setRecipientsLoading(false);
                                if (!result.ok) {
                                  showToast(result.message, "error");
                                  return;
                                }
                                setRecipientsCampaignId(result.data.campaignId);
                                setRecipientsCampaignName(
                                  result.data.campaignName,
                                );
                                setRecipientsMessage(
                                  result.data.campaignMessage,
                                );
                                setRecipients(result.data.recipients);
                                setRecipientsOpen(true);
                              }}
                            >
                              View Recipients
                            </button>
                            {!isCampaignSharedStatus(campaign.status) &&
                            campaign.status !== "cancelled" ? (
                              <>
                                <button
                                  type="button"
                                  disabled={busy}
                                  className="menu-btn-secondary !px-2 !py-1 text-[11px]"
                                  onClick={async () => {
                                    setBusy(true);
                                    const result = await shareMarketingCampaign({
                                      restaurantId: restaurant!.id,
                                      campaignId: campaign.id,
                                      restaurantName:
                                        restaurant?.restaurant_name ?? undefined,
                                    });
                                    setBusy(false);
                                    if (!result.ok) {
                                      showToast(result.message, "error");
                                      return;
                                    }
                                    openWhatsAppShare(result.shareText);
                                    showToast(
                                      "Campaign shared — WhatsApp opened with your message.",
                                    );
                                    await load();
                                  }}
                                >
                                  Share on WhatsApp
                                </button>
                                {schedulingAllowed ? (
                                  <button
                                    type="button"
                                    disabled={busy}
                                    className="menu-btn-secondary !px-2 !py-1 text-[11px]"
                                    onClick={() =>
                                      setScheduleDraft({
                                        campaignId: campaign.id,
                                        date: "",
                                        time: "10:00",
                                      })
                                    }
                                  >
                                    Schedule
                                  </button>
                                ) : null}
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

              {totalPages > 1 ? (
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-xs text-white/40">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      className="menu-btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      disabled={page >= totalPages}
                      className="menu-btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                    >
                      Next
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </DashboardCard>
      ) : null}

      {tab === "templates" && templatesAllowed ? (
        <DashboardCard className="p-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <div
                key={template.slug}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <p className="font-serif text-base font-semibold text-white">
                  {template.name}
                </p>
                <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-xs text-white/55">
                  {template.message}
                </p>
                <button
                  type="button"
                  className="menu-btn-secondary mt-3 !px-2.5 !py-1.5 text-xs"
                  onClick={() => setEditingTemplate(template)}
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </DashboardCard>
      ) : null}

      {tab === "analytics" && analyticsAllowed ? (
        <div className="space-y-4">
          <DashboardCard className="p-5">
            <label className="block space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Campaign
              </span>
              <select
                value={analyticsCampaignId}
                onChange={(e) => setAnalyticsCampaignId(e.target.value)}
                className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
              >
                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>
            </label>
          </DashboardCard>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {[
              { label: "Created", value: analytics?.created ?? 0 },
              { label: "Shared", value: analytics?.shared ?? 0 },
              { label: "Scheduled", value: analytics?.scheduled ?? 0 },
              { label: "Cancelled", value: analytics?.cancelled ?? 0 },
              { label: "Recipients", value: analytics?.recipients ?? 0 },
              { label: "Read / Clicks (future)", value: `${analytics?.read ?? 0} / ${analytics?.clicks ?? 0}` },
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
        </div>
      ) : null}

      {selectedCampaign ? (
        <CampaignDetailsModal
          campaign={selectedCampaign}
          onClose={() => setSelectedCampaign(null)}
          onViewRecipients={async () => {
            if (!restaurant?.id) return;
            setRecipientsLoading(true);
            const result = await fetchCampaignRecipients(
              restaurant.id,
              selectedCampaign.id,
            );
            setRecipientsLoading(false);
            if (!result.ok) {
              showToast(result.message, "error");
              return;
            }
            setRecipientsCampaignId(result.data.campaignId);
            setRecipientsCampaignName(result.data.campaignName);
            setRecipientsMessage(result.data.campaignMessage);
            setRecipients(result.data.recipients);
            setSelectedCampaign(null);
            setRecipientsOpen(true);
          }}
          recipientsLoading={recipientsLoading}
        />
      ) : null}

      <WhatsAppCampaignBuilder
        open={builderOpen}
        restaurantId={restaurant!.id}
        restaurantName={restaurantName}
        plan={plan}
        bypassAdmin={bypassAdmin}
        onClose={() => setBuilderOpen(false)}
        onCreated={() => {
          setPage(1);
          void load();
          setTab("campaigns");
        }}
      />

      <ConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete campaign?"
        description={`Delete “${deleteTarget?.name ?? ""}”? This cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        loading={busy}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={async () => {
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
        }}
      />

      {scheduleDraft.campaignId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close"
            onClick={() =>
              setScheduleDraft({ campaignId: "", date: "", time: "10:00" })
            }
          />
          <div className="dashboard-card relative z-10 w-full max-w-md space-y-4 rounded-2xl p-5">
            <h3 className="font-serif text-lg font-bold text-white">
              Schedule campaign
            </h3>
            <input
              type="date"
              value={scheduleDraft.date}
              onChange={(e) =>
                setScheduleDraft((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
            />
            <input
              type="time"
              value={scheduleDraft.time}
              onChange={(e) =>
                setScheduleDraft((prev) => ({ ...prev, time: e.target.value }))
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="menu-btn-secondary"
                onClick={() =>
                  setScheduleDraft({ campaignId: "", date: "", time: "10:00" })
                }
              >
                Cancel
              </button>
              <button
                type="button"
                className="menu-btn-primary"
                disabled={busy || !scheduleDraft.date}
                onClick={async () => {
                  if (!restaurant?.id || !scheduleDraft.date) return;
                  const scheduledAt = new Date(
                    `${scheduleDraft.date}T${scheduleDraft.time || "10:00"}:00`,
                  ).toISOString();
                  setBusy(true);
                  const result = await scheduleMarketingCampaign({
                    restaurantId: restaurant.id,
                    campaignId: scheduleDraft.campaignId,
                    scheduledAt,
                  });
                  setBusy(false);
                  if (!result.ok) {
                    showToast(result.message, "error");
                    return;
                  }
                  showToast("Campaign scheduled");
                  setScheduleDraft({ campaignId: "", date: "", time: "10:00" });
                  await load();
                }}
              >
                Save schedule
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {editingTemplate ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/70"
            aria-label="Close"
            onClick={() => setEditingTemplate(null)}
          />
          <div className="dashboard-card relative z-10 w-full max-w-lg space-y-3 rounded-2xl p-5">
            <h3 className="font-serif text-lg font-bold text-white">
              Edit template
            </h3>
            <input
              value={editingTemplate.name}
              onChange={(e) =>
                setEditingTemplate({ ...editingTemplate, name: e.target.value })
              }
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
            />
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
            <textarea
              value={editingTemplate.message}
              onChange={(e) =>
                setEditingTemplate({
                  ...editingTemplate,
                  message: e.target.value,
                })
              }
              rows={8}
              className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="menu-btn-secondary"
                onClick={() => setEditingTemplate(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="menu-btn-primary"
                disabled={busy}
                onClick={() => void handleSaveTemplate()}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {recipientsOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setRecipientsOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="recipient-list-title"
            className="dashboard-card relative z-10 max-h-[85vh] w-full max-w-lg overflow-hidden rounded-t-2xl border border-gold/15 sm:rounded-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
              <div>
                <h3
                  id="recipient-list-title"
                  className="font-serif text-xl font-bold text-white"
                >
                  Recipient List
                </h3>
                <p className="mt-1 text-sm text-white/50">
                  {recipientsCampaignName} · {recipients.length} recipient
                  {recipients.length === 1 ? "" : "s"}
                </p>
              </div>
              <div className="flex items-start gap-2">
                <ExportMenu
                  getDataset={getRecipientsExportDataset}
                  onEmpty={() =>
                    showToast("No data matches the current filters.", "error")
                  }
                  onError={(message) => showToast(message, "error")}
                  onSuccess={(format, rowCount) =>
                    showToast(
                      format === "pdf"
                        ? exportFormatSuccessLabel(format)
                        : `✓ Exported ${rowCount} recipients`,
                    )
                  }
                />
                <button
                  type="button"
                  onClick={() => setRecipientsOpen(false)}
                  className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto px-5 py-4">
              {recipients.length === 0 ? (
                <p className="py-8 text-center text-sm text-white/45">
                  No recipients for this campaign.
                </p>
              ) : (
                recipients.map((row) => {
                  const optedIn = customerHasMarketingOptIn(row.customer);
                  const name = row.customer.fullName?.trim() || "Guest";
                  return (
                    <div
                      key={row.customerId}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-black/25 px-3 py-2.5"
                    >
                      <p className="min-w-0 truncate text-sm font-medium text-white">
                        {name}
                      </p>
                      <button
                        type="button"
                        disabled={!optedIn || !row.customer.phone}
                        title={
                          !optedIn
                            ? "Customer has not opted in to promotional messaging."
                            : "Chat on WhatsApp"
                        }
                        onClick={() => setChatCustomer(row.customer)}
                        className={`inline-flex shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium ${
                          optedIn && row.customer.phone
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:border-emerald-400/50"
                            : "cursor-not-allowed border-white/10 bg-white/5 text-white/30"
                        }`}
                      >
                        <span aria-hidden="true">🟢</span>
                        Chat
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      ) : null}

      {restaurant?.id ? (
        <WhatsAppChatModal
          open={Boolean(chatCustomer)}
          restaurantId={restaurant.id}
          restaurantName={restaurantName}
          customer={chatCustomer}
          campaignId={recipientsCampaignId}
          campaignMessage={recipientsMessage}
          onClose={() => setChatCustomer(null)}
        />
      ) : null}
    </div>
  );
}

function audienceLabel(campaign: MarketingCampaign): string {
  const stored = campaign.metadata.audienceLabel;
  if (typeof stored === "string" && stored.trim()) return stored;
  return describeAudienceFilters(campaign.audienceFilters);
}

function CampaignDetailsModal({
  campaign,
  onClose,
  onViewRecipients,
  recipientsLoading,
}: {
  campaign: MarketingCampaign;
  onClose: () => void;
  onViewRecipients: () => void;
  recipientsLoading: boolean;
}) {
  const details = [
    { label: "Type", value: campaign.campaignType },
    { label: "Status", value: campaignStatusLabel(campaign.status) },
    { label: "Created", value: formatDemoDateTime(campaign.createdAt) },
    {
      label: "Scheduled",
      value: campaign.scheduledAt
        ? formatDemoDateTime(campaign.scheduledAt)
        : "—",
    },
    {
      label: "Shared",
      value: campaign.sentAt ? formatDemoDateTime(campaign.sentAt) : "—",
    },
    { label: "Audience", value: audienceLabel(campaign) },
    { label: "Recipients", value: String(campaign.recipientCount) },
    { label: "Channel", value: campaign.channels.join(", ") || "whatsapp" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        aria-label="Close campaign details"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="campaign-details-title"
        className="dashboard-card relative z-10 max-h-[90vh] w-full max-w-lg overflow-hidden rounded-t-2xl border border-gold/15 sm:rounded-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/5 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
              Campaign details
            </p>
            <h3
              id="campaign-details-title"
              className="mt-1 font-serif text-xl font-bold text-white"
            >
              {campaign.name}
            </h3>
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
        <div className="max-h-[70vh] space-y-4 overflow-y-auto px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {details.map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-white/5 bg-black/25 px-3 py-2.5"
              >
                <p className="text-[11px] uppercase tracking-wider text-white/40">
                  {item.label}
                </p>
                <p className="mt-1 text-sm text-white/80">{item.value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-white/5 bg-black/25 px-3 py-3">
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Message
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-white/80">
              {campaign.message || "—"}
            </p>
          </div>
          {campaign.notes ? (
            <div className="rounded-xl border border-white/5 bg-black/25 px-3 py-3">
              <p className="text-[11px] uppercase tracking-wider text-white/40">
                Notes
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-white/70">
                {campaign.notes}
              </p>
            </div>
          ) : null}
          <button
            type="button"
            disabled={recipientsLoading}
            onClick={onViewRecipients}
            className="menu-btn-secondary w-full"
          >
            {recipientsLoading ? "Loading…" : "View Recipients"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    draft: "border-white/15 bg-white/5 text-white/70",
    scheduled: "border-sky-400/30 bg-sky-400/10 text-sky-200",
    shared: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    sent: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
    cancelled: "border-red-400/30 bg-red-400/10 text-red-200",
  };
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
        styles[status] ?? styles.draft
      }`}
    >
      {campaignStatusLabel(status)}
    </span>
  );
}
