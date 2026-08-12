import { logActivity } from "@/lib/admin/activity-log";
import { fetchCustomers } from "@/lib/customers/queries";
import {
  mapCustomer,
  type Customer,
  type CustomerRecord,
} from "@/lib/customers/sync-customer";
import { resolveMarketingAccess } from "@/lib/marketing/access";
import { prepareChannel } from "@/lib/marketing/channels";
import {
  applyCampaignPlaceholders,
  DEFAULT_MARKETING_TEMPLATES,
} from "@/lib/marketing/templates";
import {
  countMarketingOptIns,
  describeAudienceFilters,
  estimateCampaignRevenue,
  filterAudience,
  isCampaignSharedStatus,
  mapCampaign,
  type AudienceFilters,
  type CampaignStatus,
  type CreateCampaignInput,
  type MarketingCampaign,
  type MarketingCampaignRecord,
  type MarketingChannel,
  type MarketingSummary,
  type MarketingTemplate,
  computeMarketingSummary,
} from "@/lib/marketing/types";
import {
  planAllowsMarketingScheduling,
  planAllowsMarketingTemplates,
} from "@/lib/subscriptions/plans";
import { supabase } from "@/lib/supabase";
import { buildWhatsAppShareUrl } from "@/lib/marketing/whatsapp/share";

const ERROR = "Unable to manage marketing campaigns. Please try again.";

export type {
  AudienceFilters,
  MarketingCampaign,
  MarketingSummary,
  MarketingTemplate,
  CreateCampaignInput,
};

export type CampaignAnalytics = {
  recipients: number;
  delivered: number;
  failed: number;
  pending: number;
  skipped: number;
  read: number;
  clicks: number;
  /** Status funnel for WhatsApp Share workflow */
  created: number;
  shared: number;
  scheduled: number;
  cancelled: number;
};

export type ShareCampaignResult = {
  ok: true;
  data: MarketingCampaign;
  shareText: string;
  shareUrl: string;
};

export type PaginatedCampaigns = {
  items: MarketingCampaign[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function withConsentGate(filters: AudienceFilters): AudienceFilters {
  return {
    ...filters,
    requireMarketingOptIn: true,
  };
}

function renderShareMessage(
  template: string,
  restaurantName: string,
  sample?: Customer | null,
): string {
  const lastVisit = sample?.lastVisit
    ? new Date(sample.lastVisit).toLocaleDateString()
    : "recently";
  return applyCampaignPlaceholders(template, {
    customerName: sample?.fullName?.trim() || "valued guest",
    restaurantName: restaurantName || "our restaurant",
    loyaltyPoints: sample?.loyaltyPoints ?? 0,
    lastOrderDate: lastVisit,
    lastVisit,
    totalOrders: sample?.totalOrders ?? 0,
  });
}

async function requireMarketingAccess(restaurantId: string) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const access = await resolveMarketingAccess(
    supabase,
    restaurantId,
    session?.user?.id ?? null,
  );
  return { access, session };
}

export async function fetchMarketingCampaigns(
  restaurantId: string,
  options?: { page?: number; pageSize?: number },
): Promise<
  | { ok: true; data: MarketingCampaign[]; page: PaginatedCampaigns }
  | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const pageSize = Math.min(50, Math.max(1, options?.pageSize ?? 10));
    const page = Math.max(1, options?.page ?? 1);

    const { data, error, count } = await supabase
      .from("marketing_campaigns")
      .select("*", { count: "exact" })
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (error) return { ok: false, message: error.message || ERROR };

    const items = ((data ?? []) as MarketingCampaignRecord[]).map(mapCampaign);
    const total = count ?? items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    return {
      ok: true,
      data: items,
      page: { items, total, page, pageSize, totalPages },
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function previewAudience(
  restaurantId: string,
  filters: AudienceFilters,
): Promise<
  | {
      ok: true;
      count: number;
      optedInTotal: number;
      excludedCount: number;
      totalCustomers: number;
      estimatedRevenue: number;
      sample: Array<{ id: string; name: string | null }>;
      audienceLabel: string;
    }
  | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const customersResult = await fetchCustomers(restaurantId);
    if (!customersResult.ok) return customersResult;

    const all = customersResult.data;
    const optedInTotal = countMarketingOptIns(all);
    const gated = withConsentGate(filters);
    const matched = filterAudience(all, gated);
    const excludedCount = Math.max(0, all.length - optedInTotal);

    return {
      ok: true,
      count: matched.length,
      optedInTotal,
      excludedCount,
      totalCustomers: all.length,
      estimatedRevenue: estimateCampaignRevenue(matched),
      sample: matched.slice(0, 5).map((c) => ({
        id: c.id,
        name: c.fullName,
      })),
      audienceLabel: describeAudienceFilters(gated),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

async function resolveRecipients(
  restaurantId: string,
  filters: AudienceFilters,
): Promise<{ ok: true; customers: Customer[] } | { ok: false; message: string }> {
  const customersResult = await fetchCustomers(restaurantId);
  if (!customersResult.ok) return customersResult;
  return {
    ok: true,
    customers: filterAudience(customersResult.data, withConsentGate(filters)),
  };
}

async function insertRecipientRows(
  campaignId: string,
  restaurantId: string,
  customers: Customer[],
  channels: MarketingChannel[],
) {
  if (customers.length === 0) return;

  const rows = customers.flatMap((customer) =>
    channels.map((channel) => ({
      campaign_id: campaignId,
      restaurant_id: restaurantId,
      customer_id: customer.id,
      channel,
      status: "pending",
      metadata: {
        customerName: customer.fullName,
        phone: customer.phone,
        email: customer.email,
      },
    })),
  );

  // Batch insert in chunks to avoid payload limits
  const chunkSize = 200;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from("marketing_campaign_recipients")
      .upsert(chunk, { onConflict: "campaign_id,customer_id,channel" });
    if (error) throw new Error(error.message);
  }
}

export async function createMarketingCampaign(
  input: CreateCampaignInput,
): Promise<
  | {
      ok: true;
      data: MarketingCampaign;
      shareText?: string;
      shareUrl?: string;
    }
  | { ok: false; message: string }
> {
  try {
    const { access, session } = await requireMarketingAccess(input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const filters = withConsentGate(input.audienceFilters ?? {});
    const channels: MarketingChannel[] =
      input.channels && input.channels.length > 0
        ? input.channels.filter((c) => c === "whatsapp")
        : (["whatsapp"] as MarketingChannel[]);
    if (channels.length === 0) {
      return { ok: false, message: "WhatsApp Share channel is required." };
    }

    const recipients = await resolveRecipients(input.restaurantId, filters);
    if (!recipients.ok) return recipients;

    let status: CampaignStatus = "draft";
    let scheduledAt: string | null = null;
    let sentAt: string | null = null;

    if (input.scheduleMode === "later") {
      if (!planAllowsMarketingScheduling(access.plan) && !access.bypassAdmin) {
        return {
          ok: false,
          message:
            "Scheduled campaigns are available on the Enterprise plan. Save as draft or upgrade.",
        };
      }
      if (!input.scheduledAt) {
        return { ok: false, message: "Please choose a schedule date." };
      }
      status = "scheduled";
      scheduledAt = input.scheduledAt;
    }

    const estimated =
      input.estimatedRevenue ?? estimateCampaignRevenue(recipients.customers);

    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("restaurant_name")
      .eq("id", input.restaurantId)
      .maybeSingle();
    const restaurantName =
      (restaurant as { restaurant_name?: string } | null)?.restaurant_name?.trim() ||
      "Restaurant";

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .insert({
        restaurant_id: input.restaurantId,
        name: input.name.trim(),
        campaign_type: input.campaignType,
        status,
        subject: input.subject?.trim() || null,
        message: input.message.trim(),
        notes: input.notes?.trim() || null,
        channels,
        audience_filters: filters,
        recipient_count: recipients.customers.length,
        estimated_revenue: estimated,
        scheduled_at: scheduledAt,
        sent_at: sentAt,
        created_by: session?.user?.id ?? null,
        created_by_name:
          (session?.user?.user_metadata?.full_name as string | undefined) ??
          session?.user?.email?.split("@")[0] ??
          null,
        created_by_email: session?.user?.email ?? null,
        metadata: {
          templateSlug: input.templateSlug ?? null,
          audienceLabel: describeAudienceFilters(filters),
          shareMode: "whatsapp_share",
          providers: {
            whatsapp: { provider: "whatsapp_share", status: "ready" },
            email: { provider: null, status: "coming_soon" },
            sms: { provider: null, status: "coming_soon" },
            push: { provider: null, status: "coming_soon" },
          },
        },
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    const campaign = mapCampaign(data as MarketingCampaignRecord);
    await insertRecipientRows(
      campaign.id,
      input.restaurantId,
      recipients.customers,
      channels,
    );

    void logActivity({
      action:
        status === "scheduled" ? "campaign_scheduled" : "campaign_created",
      restaurantId: input.restaurantId,
      entityType: "marketing_campaign",
      entityId: campaign.id,
      newValues: {
        name: campaign.name,
        type: campaign.campaignType,
        status,
        recipients: campaign.recipientCount,
      },
    });

    // "now" = Share on WhatsApp — mark Shared and return share payload (no API).
    if (input.scheduleMode === "now") {
      const shareResult = await shareMarketingCampaign({
        restaurantId: input.restaurantId,
        campaignId: campaign.id,
        restaurantName,
      });
      if (!shareResult.ok) {
        const shareText = renderShareMessage(
          campaign.message,
          restaurantName,
          recipients.customers[0] ?? null,
        );
        return {
          ok: true,
          data: campaign,
          shareText,
          shareUrl: buildWhatsAppShareUrl(shareText),
        };
      }
      return shareResult;
    }

    return { ok: true, data: campaign };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : ERROR,
    };
  }
}

export async function updateMarketingCampaign(input: {
  restaurantId: string;
  campaignId: string;
  name?: string;
  subject?: string;
  message?: string;
  notes?: string | null;
  audienceFilters?: AudienceFilters;
  channels?: MarketingChannel[];
  estimatedRevenue?: number;
}): Promise<
  { ok: true; data: MarketingCampaign } | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const { data: existing } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("id", input.campaignId)
      .eq("restaurant_id", input.restaurantId)
      .maybeSingle();

    if (!existing) return { ok: false, message: "Campaign not found." };
    const current = mapCampaign(existing as MarketingCampaignRecord);
    if (isCampaignSharedStatus(current.status)) {
      return { ok: false, message: "Shared campaigns cannot be edited." };
    }

    const filters = input.audienceFilters ?? current.audienceFilters;
    const channels = input.channels ?? current.channels;
    const recipients = await resolveRecipients(input.restaurantId, filters);
    if (!recipients.ok) return recipients;

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .update({
        name: input.name?.trim() ?? current.name,
        subject:
          input.subject !== undefined
            ? input.subject.trim() || null
            : current.subject,
        message: input.message?.trim() ?? current.message,
        notes:
          input.notes !== undefined
            ? input.notes?.trim() || null
            : current.notes,
        channels,
        audience_filters: filters,
        recipient_count: recipients.customers.length,
        estimated_revenue:
          input.estimatedRevenue ??
          estimateCampaignRevenue(recipients.customers),
      })
      .eq("id", input.campaignId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    await supabase
      .from("marketing_campaign_recipients")
      .delete()
      .eq("campaign_id", input.campaignId);
    await insertRecipientRows(
      input.campaignId,
      input.restaurantId,
      recipients.customers,
      channels,
    );

    void logActivity({
      action: "campaign_edited",
      restaurantId: input.restaurantId,
      entityType: "marketing_campaign",
      entityId: input.campaignId,
      newValues: { name: input.name ?? current.name },
    });

    return { ok: true, data: mapCampaign(data as MarketingCampaignRecord) };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : ERROR,
    };
  }
}

export async function deleteMarketingCampaign(
  restaurantId: string,
  campaignId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { access } = await requireMarketingAccess(restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const { error } = await supabase
      .from("marketing_campaigns")
      .delete()
      .eq("id", campaignId)
      .eq("restaurant_id", restaurantId);

    if (error) return { ok: false, message: error.message || ERROR };

    void logActivity({
      action: "campaign_deleted",
      restaurantId,
      entityType: "marketing_campaign",
      entityId: campaignId,
    });

    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function scheduleMarketingCampaign(input: {
  restaurantId: string;
  campaignId: string;
  scheduledAt: string;
}): Promise<
  { ok: true; data: MarketingCampaign } | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };
    if (!planAllowsMarketingScheduling(access.plan) && !access.bypassAdmin) {
      return {
        ok: false,
        message: "Scheduled campaigns are available on the Enterprise plan.",
      };
    }

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .update({
        status: "scheduled",
        scheduled_at: input.scheduledAt,
        sent_at: null,
      })
      .eq("id", input.campaignId)
      .eq("restaurant_id", input.restaurantId)
      .neq("status", "sent")
      .neq("status", "shared")
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message ?? "Unable to schedule." };
    }

    void logActivity({
      action: "campaign_scheduled",
      restaurantId: input.restaurantId,
      entityType: "marketing_campaign",
      entityId: input.campaignId,
      newValues: { scheduledAt: input.scheduledAt },
    });

    return { ok: true, data: mapCampaign(data as MarketingCampaignRecord) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function shareMarketingCampaign(input: {
  restaurantId: string;
  campaignId: string;
  restaurantName?: string;
}): Promise<ShareCampaignResult | { ok: false; message: string }> {
  try {
    const { access } = await requireMarketingAccess(input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const { data: existing, error: fetchError } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("id", input.campaignId)
      .eq("restaurant_id", input.restaurantId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { ok: false, message: fetchError?.message ?? "Campaign not found." };
    }

    const campaign = mapCampaign(existing as MarketingCampaignRecord);
    if (campaign.status === "cancelled") {
      return { ok: false, message: "Cancelled campaigns cannot be shared." };
    }

    let restaurantName = input.restaurantName?.trim() || "";
    if (!restaurantName) {
      const { data: restaurant } = await supabase
        .from("restaurants")
        .select("restaurant_name")
        .eq("id", input.restaurantId)
        .maybeSingle();
      restaurantName =
        (restaurant as { restaurant_name?: string } | null)?.restaurant_name?.trim() ||
        "Restaurant";
    }

    const recipients = await resolveRecipients(
      input.restaurantId,
      campaign.audienceFilters,
    );
    const sample = recipients.ok ? (recipients.customers[0] ?? null) : null;
    const shareText = renderShareMessage(
      campaign.message,
      restaurantName,
      sample,
    );
    const prepared = await prepareChannel("whatsapp_share", {
      restaurantId: input.restaurantId,
      campaignId: input.campaignId,
      restaurantName,
      campaignName: campaign.name,
      message: shareText,
      phone: sample?.phone,
    });
    const shareUrl = prepared.url ?? buildWhatsAppShareUrl(shareText);
    const sharedAt = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("marketing_campaigns")
      .update({
        status: "shared",
        sent_at: sharedAt,
        metadata: {
          ...campaign.metadata,
          shareMode: "whatsapp_share",
          lastShare: {
            at: sharedAt,
            providerId: "whatsapp_share",
            url: shareUrl,
          },
          analytics: {
            recipients: campaign.recipientCount,
            shared: true,
            delivered: 0,
            failed: 0,
            skipped: 0,
            read: 0,
            clicks: 0,
          },
        },
      })
      .eq("id", input.campaignId)
      .eq("restaurant_id", input.restaurantId)
      .select("*")
      .maybeSingle();

    if (updateError || !updated) {
      return {
        ok: false,
        message: updateError?.message ?? "Unable to mark campaign as shared.",
      };
    }

    // Recipients stay pending — owner shares via WhatsApp app (no API delivery).
    void logActivity({
      action: "campaign_sent",
      restaurantId: input.restaurantId,
      entityType: "marketing_campaign",
      entityId: input.campaignId,
      newValues: {
        status: "shared",
        channel: "whatsapp_share",
        recipients: campaign.recipientCount,
      },
    });

    return {
      ok: true,
      data: mapCampaign(updated as MarketingCampaignRecord),
      shareText,
      shareUrl,
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

/** Alias kept for older callers — routes to WhatsApp Share. */
export async function sendMarketingCampaign(input: {
  restaurantId: string;
  campaignId: string;
}): Promise<ShareCampaignResult | { ok: false; message: string }> {
  return shareMarketingCampaign(input);
}

export async function cancelMarketingCampaign(
  restaurantId: string,
  campaignId: string,
): Promise<
  { ok: true; data: MarketingCampaign } | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .update({ status: "cancelled" })
      .eq("id", campaignId)
      .eq("restaurant_id", restaurantId)
      .neq("status", "sent")
      .neq("status", "shared")
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message ?? "Unable to cancel." };
    }

    return { ok: true, data: mapCampaign(data as MarketingCampaignRecord) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchMarketingTemplates(
  restaurantId: string,
): Promise<
  { ok: true; data: MarketingTemplate[] } | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const { data, error } = await supabase
      .from("marketing_templates")
      .select("slug, name, subject, message")
      .eq("restaurant_id", restaurantId);

    if (error) return { ok: false, message: error.message || ERROR };

    const overrides = new Map(
      ((data ?? []) as MarketingTemplate[]).map((row) => [row.slug, row]),
    );

    const merged = DEFAULT_MARKETING_TEMPLATES.map(
      (template) => overrides.get(template.slug) ?? template,
    );

    return { ok: true, data: merged };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function saveMarketingTemplate(input: {
  restaurantId: string;
  slug: string;
  name: string;
  subject: string;
  message: string;
}): Promise<
  { ok: true; data: MarketingTemplate } | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };
    if (!planAllowsMarketingTemplates(access.plan) && !access.bypassAdmin) {
      return {
        ok: false,
        message: "Saved templates are available on the Enterprise plan.",
      };
    }

    const { data, error } = await supabase
      .from("marketing_templates")
      .upsert(
        {
          restaurant_id: input.restaurantId,
          slug: input.slug,
          name: input.name.trim(),
          subject: input.subject.trim(),
          message: input.message.trim(),
        },
        { onConflict: "restaurant_id,slug" },
      )
      .select("slug, name, subject, message")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    return { ok: true, data: data as MarketingTemplate };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchCampaignAnalytics(
  restaurantId: string,
  campaignId: string,
): Promise<
  { ok: true; data: CampaignAnalytics } | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const [{ data: campaignRow }, { data, error }] = await Promise.all([
      supabase
        .from("marketing_campaigns")
        .select("status, recipient_count")
        .eq("id", campaignId)
        .eq("restaurant_id", restaurantId)
        .maybeSingle(),
      supabase
        .from("marketing_campaign_recipients")
        .select("status, metadata")
        .eq("restaurant_id", restaurantId)
        .eq("campaign_id", campaignId),
    ]);

    if (error) return { ok: false, message: error.message || ERROR };

    const rows = (data ?? []) as Array<{
      status: string;
      metadata: Record<string, unknown> | null;
    }>;

    const status = (campaignRow as { status?: string } | null)?.status ?? "draft";
    const analytics: CampaignAnalytics = {
      recipients: rows.length,
      delivered: 0,
      failed: 0,
      pending: 0,
      skipped: 0,
      read: 0,
      clicks: 0,
      created: 1,
      shared: isCampaignSharedStatus(status) ? 1 : 0,
      scheduled: status === "scheduled" ? 1 : 0,
      cancelled: status === "cancelled" ? 1 : 0,
    };

    for (const row of rows) {
      if (row.status === "sent") analytics.delivered += 1;
      else if (row.status === "failed") analytics.failed += 1;
      else if (row.status === "skipped") analytics.skipped += 1;
      else analytics.pending += 1;

      const meta = row.metadata ?? {};
      if (meta.read === true || meta.read_at) analytics.read += 1;
      if (typeof meta.clicks === "number") {
        analytics.clicks += Number(meta.clicks);
      } else if (meta.clicked === true) {
        analytics.clicks += 1;
      }
    }

    return { ok: true, data: analytics };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export type CampaignRecipientListItem = {
  customerId: string;
  customer: Customer;
  channel: string;
  status: string;
};

export async function fetchCampaignRecipients(
  restaurantId: string,
  campaignId: string,
): Promise<
  | {
      ok: true;
      data: {
        campaignId: string;
        campaignName: string;
        campaignMessage: string;
        recipients: CampaignRecipientListItem[];
      };
    }
  | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const [{ data: campaignRow, error: campaignError }, { data, error }] =
      await Promise.all([
        supabase
          .from("marketing_campaigns")
          .select("id, name, message")
          .eq("id", campaignId)
          .eq("restaurant_id", restaurantId)
          .maybeSingle(),
        supabase
          .from("marketing_campaign_recipients")
          .select("customer_id, channel, status, metadata")
          .eq("restaurant_id", restaurantId)
          .eq("campaign_id", campaignId)
          .order("created_at", { ascending: true })
          .limit(500),
      ]);

    if (campaignError || !campaignRow) {
      return {
        ok: false,
        message: campaignError?.message || "Campaign not found.",
      };
    }
    if (error) return { ok: false, message: error.message || ERROR };

    const rows = (data ?? []) as Array<{
      customer_id: string;
      channel: string;
      status: string;
      metadata: Record<string, unknown> | null;
    }>;

    const customerIds = Array.from(
      new Set(rows.map((row) => row.customer_id).filter(Boolean)),
    );

    const customersById = new Map<string, Customer>();
    if (customerIds.length > 0) {
      const { data: customerRows, error: customersError } = await supabase
        .from("customers")
        .select("*")
        .eq("restaurant_id", restaurantId)
        .in("id", customerIds);

      if (customersError) {
        return { ok: false, message: customersError.message || ERROR };
      }

      for (const row of (customerRows ?? []) as CustomerRecord[]) {
        customersById.set(row.id, mapCustomer(row));
      }
    }

    const recipients: CampaignRecipientListItem[] = [];
    const seen = new Set<string>();
    for (const row of rows) {
      if (seen.has(row.customer_id)) continue;
      seen.add(row.customer_id);
      const customer = customersById.get(row.customer_id);
      if (!customer) {
        const metaName =
          typeof row.metadata?.customerName === "string"
            ? row.metadata.customerName
            : null;
        const metaPhone =
          typeof row.metadata?.phone === "string" ? row.metadata.phone : null;
        recipients.push({
          customerId: row.customer_id,
          customer: {
            id: row.customer_id,
            restaurantId,
            fullName: metaName,
            phone: metaPhone,
            email:
              typeof row.metadata?.email === "string"
                ? row.metadata.email
                : null,
            birthday: null,
            notes: null,
            tags: [],
            loyaltyPoints: 0,
            totalOrders: 0,
            totalReservations: 0,
            totalSpent: 0,
            averageOrder: 0,
            firstVisit: null,
            lastVisit: null,
            favoriteItem: null,
            favoriteCategory: null,
            metadata: { marketing_opt_in: true },
            createdAt: new Date(0).toISOString(),
            updatedAt: new Date(0).toISOString(),
          },
          channel: row.channel,
          status: row.status,
        });
        continue;
      }
      recipients.push({
        customerId: customer.id,
        customer,
        channel: row.channel,
        status: row.status,
      });
    }

    return {
      ok: true,
      data: {
        campaignId: String((campaignRow as { id: string }).id),
        campaignName: String(
          (campaignRow as { name: string }).name ?? "Campaign",
        ),
        campaignMessage: String(
          (campaignRow as { message: string }).message ?? "",
        ),
        recipients,
      },
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchCustomerMarketingHistory(
  restaurantId: string,
  customerId: string,
): Promise<
  | {
      ok: true;
      data: Array<{
        campaignId: string;
        campaignName: string;
        campaignType: string;
        status: string;
        channel: string;
        deliveryStatus: string;
        sentAt: string | null;
        createdAt: string;
      }>;
    }
  | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("marketing_campaign_recipients")
      .select(
        "channel, status, sent_at, created_at, campaign_id, marketing_campaigns(name, campaign_type, status, created_at)",
      )
      .eq("restaurant_id", restaurantId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) return { ok: false, message: error.message || ERROR };

    type Join = {
      name: string;
      campaign_type: string;
      status: string;
      created_at: string;
    };

    const rows = ((data ?? []) as Array<{
      channel: string;
      status: string;
      sent_at: string | null;
      created_at: string;
      campaign_id: string;
      marketing_campaigns: Join | Join[] | null;
    }>).map((row) => {
      const campaign = Array.isArray(row.marketing_campaigns)
        ? row.marketing_campaigns[0]
        : row.marketing_campaigns;
      return {
        campaignId: row.campaign_id,
        campaignName: campaign?.name ?? "Campaign",
        campaignType: campaign?.campaign_type ?? "Custom",
        status: campaign?.status ?? "draft",
        channel: row.channel,
        deliveryStatus: row.status,
        sentAt: row.sent_at,
        createdAt: campaign?.created_at ?? row.created_at,
      };
    });

    return { ok: true, data: rows };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export function getMarketingSummary(
  campaigns: MarketingCampaign[],
): MarketingSummary {
  return computeMarketingSummary(campaigns);
}

/** Suggest eligibility labels for a customer profile (no extra queries). */
export function getCustomerCampaignEligibility(customer: Customer): string[] {
  const labels: string[] = [];
  if (customer.birthday) labels.push("Birthday");
  if (customer.tags.includes("VIP")) labels.push("VIP");
  if (customer.tags.includes("High Spender")) labels.push("High Spender");
  if (customer.tags.includes("Inactive") || customer.tags.includes("Regular")) {
    if (customer.tags.includes("Inactive")) labels.push("Win Back");
  }
  if (customer.loyaltyPoints > 0) labels.push("Loyalty");
  if (customer.metadata.marketing_opt_in) labels.push("Marketing Opt-In");
  if (customer.totalOrders + customer.totalReservations <= 1) {
    labels.push("New Customer");
  }
  if (labels.length === 0) labels.push("Custom");
  return labels;
}
