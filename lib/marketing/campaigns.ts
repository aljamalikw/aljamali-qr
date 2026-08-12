import { logActivity } from "@/lib/admin/activity-log";
import { fetchCustomers } from "@/lib/customers/queries";
import type { Customer } from "@/lib/customers/sync-customer";
import { resolveMarketingAccess } from "@/lib/marketing/access";
import {
  DEFAULT_MARKETING_TEMPLATES,
} from "@/lib/marketing/templates";
import {
  estimateCampaignRevenue,
  filterAudience,
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
import { supabase } from "@/lib/supabase";

const ERROR = "Unable to manage marketing campaigns. Please try again.";

export type {
  AudienceFilters,
  MarketingCampaign,
  MarketingSummary,
  MarketingTemplate,
  CreateCampaignInput,
};

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
): Promise<
  { ok: true; data: MarketingCampaign[] } | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const { data, error } = await supabase
      .from("marketing_campaigns")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return {
      ok: true,
      data: ((data ?? []) as MarketingCampaignRecord[]).map(mapCampaign),
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
      estimatedRevenue: number;
      sample: Array<{ id: string; name: string | null }>;
    }
  | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const customersResult = await fetchCustomers(restaurantId);
    if (!customersResult.ok) return customersResult;

    const matched = filterAudience(customersResult.data, filters);
    return {
      ok: true,
      count: matched.length,
      estimatedRevenue: estimateCampaignRevenue(matched),
      sample: matched.slice(0, 5).map((c) => ({
        id: c.id,
        name: c.fullName,
      })),
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
    customers: filterAudience(customersResult.data, filters),
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
  { ok: true; data: MarketingCampaign } | { ok: false; message: string }
> {
  try {
    const { access, session } = await requireMarketingAccess(input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const filters = input.audienceFilters ?? {};
    const channels =
      input.channels && input.channels.length > 0
        ? input.channels.filter((c) => c === "whatsapp" || c === "email")
        : (["whatsapp", "email"] as MarketingChannel[]);

    const recipients = await resolveRecipients(input.restaurantId, filters);
    if (!recipients.ok) return recipients;

    let status: CampaignStatus = "draft";
    let scheduledAt: string | null = null;
    let sentAt: string | null = null;

    if (input.scheduleMode === "later") {
      if (!input.scheduledAt) {
        return { ok: false, message: "Please choose a schedule date." };
      }
      status = "scheduled";
      scheduledAt = input.scheduledAt;
    } else if (input.scheduleMode === "now") {
      status = "sent";
      sentAt = new Date().toISOString();
    }

    const estimated =
      input.estimatedRevenue ?? estimateCampaignRevenue(recipients.customers);

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
          providers: {
            whatsapp: { provider: null, status: "ready" },
            email: { provider: null, status: "ready" },
            sms: { provider: null, status: "reserved" },
            push: { provider: null, status: "reserved" },
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

    if (status === "sent") {
      await supabase
        .from("marketing_campaign_recipients")
        .update({ status: "queued", sent_at: sentAt })
        .eq("campaign_id", campaign.id);
    }

    void logActivity({
      action:
        status === "sent"
          ? "campaign_sent"
          : status === "scheduled"
            ? "campaign_scheduled"
            : "campaign_created",
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

    return { ok: true, data: { ...campaign, status, scheduledAt, sentAt } };
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
    if (current.status === "sent") {
      return { ok: false, message: "Sent campaigns cannot be edited." };
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

export async function sendMarketingCampaign(input: {
  restaurantId: string;
  campaignId: string;
}): Promise<
  { ok: true; data: MarketingCampaign } | { ok: false; message: string }
> {
  try {
    const { access } = await requireMarketingAccess(input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const sentAt = new Date().toISOString();
    const { data, error } = await supabase
      .from("marketing_campaigns")
      .update({
        status: "sent",
        sent_at: sentAt,
      })
      .eq("id", input.campaignId)
      .eq("restaurant_id", input.restaurantId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message ?? "Unable to send." };
    }

    await supabase
      .from("marketing_campaign_recipients")
      .update({ status: "queued", sent_at: sentAt })
      .eq("campaign_id", input.campaignId)
      .eq("status", "pending");

    // Provider plug-in point: enqueue WhatsApp / Email / SMS / Push here.
    void logActivity({
      action: "campaign_sent",
      restaurantId: input.restaurantId,
      entityType: "marketing_campaign",
      entityId: input.campaignId,
      newValues: {
        status: "sent",
        note: "Queued for provider delivery (WhatsApp/Email ready).",
      },
    });

    return { ok: true, data: mapCampaign(data as MarketingCampaignRecord) };
  } catch {
    return { ok: false, message: ERROR };
  }
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
