import type { Customer } from "@/lib/customers/sync-customer";

export const CAMPAIGN_TYPES = [
  "Birthday",
  "Win Back",
  "VIP",
  "Loyalty",
  "New Customer",
  "Custom",
] as const;

export type CampaignType = (typeof CAMPAIGN_TYPES)[number];

export const CAMPAIGN_STATUSES = [
  "draft",
  "scheduled",
  "sent",
  "cancelled",
] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const MARKETING_CHANNELS = [
  "whatsapp",
  "email",
  "sms",
  "push",
] as const;

export type MarketingChannel = (typeof MARKETING_CHANNELS)[number];

/** UI-ready channels for v1 (sms/push reserved). */
export const MARKETING_CHANNELS_UI: MarketingChannel[] = ["whatsapp", "email"];

export type AudienceFilters = {
  visitedWithinDays?: number | null;
  noVisitDays?: number | null;
  birthdayMonth?: number | null;
  minTotalSpent?: number | null;
  maxTotalSpent?: number | null;
  minOrderCount?: number | null;
  minReservationCount?: number | null;
  tagsAny?: string[];
  customTags?: string[];
  minLoyaltyPoints?: number | null;
};

export type CampaignMetadata = {
  providers?: {
    whatsapp?: { provider?: string; status?: string; [key: string]: unknown };
    email?: { provider?: string; status?: string; [key: string]: unknown };
    sms?: { provider?: string; status?: string; [key: string]: unknown };
    push?: { provider?: string; status?: string; [key: string]: unknown };
  };
  templateSlug?: string | null;
  [key: string]: unknown;
};

export type MarketingCampaign = {
  id: string;
  restaurantId: string;
  name: string;
  campaignType: CampaignType;
  status: CampaignStatus;
  subject: string | null;
  message: string;
  notes: string | null;
  channels: MarketingChannel[];
  audienceFilters: AudienceFilters;
  recipientCount: number;
  estimatedRevenue: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdBy: string | null;
  createdByName: string | null;
  createdByEmail: string | null;
  metadata: CampaignMetadata;
  createdAt: string;
  updatedAt: string;
};

export type MarketingCampaignRecord = {
  id: string;
  restaurant_id: string;
  name: string;
  campaign_type: string;
  status: string;
  subject: string | null;
  message: string;
  notes: string | null;
  channels: string[] | null;
  audience_filters: AudienceFilters | null;
  recipient_count: number;
  estimated_revenue: number | string;
  scheduled_at: string | null;
  sent_at: string | null;
  created_by: string | null;
  created_by_name: string | null;
  created_by_email: string | null;
  metadata: CampaignMetadata | null;
  created_at: string;
  updated_at: string;
};

export type MarketingTemplate = {
  slug: string;
  name: string;
  subject: string;
  message: string;
};

export type MarketingSummary = {
  campaigns: number;
  recipients: number;
  messagesSent: number;
  estimatedRevenue: number;
  upcoming: number;
};

export type CreateCampaignInput = {
  restaurantId: string;
  name: string;
  campaignType: CampaignType;
  subject?: string;
  message: string;
  notes?: string;
  channels?: MarketingChannel[];
  audienceFilters?: AudienceFilters;
  scheduleMode: "now" | "later" | "draft";
  scheduledAt?: string | null;
  estimatedRevenue?: number;
  templateSlug?: string | null;
};

function asFilters(value: unknown): AudienceFilters {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as AudienceFilters;
  }
  return {};
}

function asMetadata(value: unknown): CampaignMetadata {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as CampaignMetadata;
  }
  return {};
}

export function mapCampaign(row: MarketingCampaignRecord): MarketingCampaign {
  const channels = (row.channels ?? []).filter((channel): channel is MarketingChannel =>
    (MARKETING_CHANNELS as readonly string[]).includes(channel),
  );
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    name: row.name,
    campaignType: (CAMPAIGN_TYPES as readonly string[]).includes(row.campaign_type)
      ? (row.campaign_type as CampaignType)
      : "Custom",
    status: (CAMPAIGN_STATUSES as readonly string[]).includes(row.status)
      ? (row.status as CampaignStatus)
      : "draft",
    subject: row.subject,
    message: row.message ?? "",
    notes: row.notes,
    channels: channels.length > 0 ? channels : ["whatsapp", "email"],
    audienceFilters: asFilters(row.audience_filters),
    recipientCount: Number(row.recipient_count ?? 0),
    estimatedRevenue: Number(row.estimated_revenue ?? 0),
    scheduledAt: row.scheduled_at,
    sentAt: row.sent_at,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    createdByEmail: row.created_by_email,
    metadata: asMetadata(row.metadata),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function daysBetween(fromIso: string | null, now = Date.now()): number | null {
  if (!fromIso) return null;
  const t = new Date(fromIso).getTime();
  if (!Number.isFinite(t)) return null;
  return (now - t) / (1000 * 60 * 60 * 24);
}

/**
 * Batch audience matching against already-loaded CRM customers (no N+1).
 */
export function filterAudience(
  customers: Customer[],
  filters: AudienceFilters,
): Customer[] {
  const now = Date.now();
  const tagsAny = (filters.tagsAny ?? []).map((t) => t.trim()).filter(Boolean);
  const customTags = (filters.customTags ?? [])
    .map((t) => t.trim())
    .filter(Boolean);

  return customers.filter((customer) => {
    const daysSinceVisit = daysBetween(customer.lastVisit, now);

    if (
      filters.visitedWithinDays != null &&
      Number.isFinite(filters.visitedWithinDays)
    ) {
      if (daysSinceVisit == null || daysSinceVisit > filters.visitedWithinDays) {
        return false;
      }
    }

    if (filters.noVisitDays != null && Number.isFinite(filters.noVisitDays)) {
      if (daysSinceVisit != null && daysSinceVisit < filters.noVisitDays) {
        return false;
      }
      if (daysSinceVisit == null && customer.firstVisit) {
        // never visited after create — treat as inactive enough
      } else if (daysSinceVisit == null) {
        return true;
      }
    }

    if (
      filters.birthdayMonth != null &&
      filters.birthdayMonth >= 1 &&
      filters.birthdayMonth <= 12
    ) {
      if (!customer.birthday) return false;
      const month = new Date(customer.birthday).getUTCMonth() + 1;
      if (month !== filters.birthdayMonth) return false;
    }

    if (
      filters.minTotalSpent != null &&
      customer.totalSpent < filters.minTotalSpent
    ) {
      return false;
    }
    if (
      filters.maxTotalSpent != null &&
      customer.totalSpent > filters.maxTotalSpent
    ) {
      return false;
    }
    if (
      filters.minOrderCount != null &&
      customer.totalOrders < filters.minOrderCount
    ) {
      return false;
    }
    if (
      filters.minReservationCount != null &&
      customer.totalReservations < filters.minReservationCount
    ) {
      return false;
    }
    if (
      filters.minLoyaltyPoints != null &&
      customer.loyaltyPoints < filters.minLoyaltyPoints
    ) {
      return false;
    }

    if (tagsAny.length > 0) {
      const has = tagsAny.some((tag) => customer.tags.includes(tag));
      if (!has) return false;
    }

    if (customTags.length > 0) {
      const has = customTags.some((tag) => customer.tags.includes(tag));
      if (!has) return false;
    }

    return true;
  });
}

export function estimateCampaignRevenue(
  recipients: Customer[],
  averageUplift = 0.15,
): number {
  if (recipients.length === 0) return 0;
  const avgSpend =
    recipients.reduce((sum, c) => sum + c.averageOrder, 0) / recipients.length;
  return Math.round(avgSpend * recipients.length * averageUplift * 1000) / 1000;
}

export function computeMarketingSummary(
  campaigns: MarketingCampaign[],
): MarketingSummary {
  const recipients = campaigns.reduce((sum, c) => sum + c.recipientCount, 0);
  const messagesSent = campaigns
    .filter((c) => c.status === "sent")
    .reduce((sum, c) => sum + c.recipientCount * Math.max(1, c.channels.length), 0);
  const estimatedRevenue = campaigns.reduce(
    (sum, c) => sum + (c.status === "cancelled" ? 0 : c.estimatedRevenue),
    0,
  );
  const upcoming = campaigns.filter(
    (c) =>
      c.status === "scheduled" ||
      (c.status === "draft" && Boolean(c.scheduledAt)),
  ).length;

  return {
    campaigns: campaigns.length,
    recipients,
    messagesSent,
    estimatedRevenue,
    upcoming,
  };
}
