import {
  campaignStatusLabel,
  describeAudienceFilters,
  type MarketingCampaign,
} from "@/lib/marketing/types";
import type { CampaignRecipientListItem } from "@/lib/marketing/campaigns";
import { customerHasMarketingOptIn } from "@/lib/customers/whatsapp-chat";
import type { ExportDataset } from "../types";

export function buildMarketingCampaignsExportDataset(input: {
  campaigns: MarketingCampaign[];
  restaurantName: string;
}): ExportDataset {
  const rows = input.campaigns.map((campaign) => ({
    name: campaign.name,
    channel: campaign.channels.join(", "),
    audience: describeAudienceFilters(campaign.audienceFilters),
    recipients: campaign.recipientCount,
    status: campaignStatusLabel(campaign.status),
    createdDate: campaign.createdAt,
    scheduledDate: campaign.scheduledAt ?? "",
    sentDate: campaign.sentAt ?? "",
    restaurant: input.restaurantName,
  }));

  return {
    filenamePrefix: "marketing_campaigns",
    meta: {
      title: "Marketing Campaign History",
      restaurantName: input.restaurantName,
    },
    columns: [
      { key: "name", header: "Campaign Name" },
      { key: "channel", header: "Channel" },
      { key: "audience", header: "Audience" },
      { key: "recipients", header: "Recipients", type: "number" },
      { key: "status", header: "Status" },
      { key: "createdDate", header: "Created Date", type: "datetime" },
      { key: "scheduledDate", header: "Scheduled Date", type: "datetime" },
      { key: "sentDate", header: "Sent Date", type: "datetime" },
      { key: "restaurant", header: "Restaurant" },
    ],
    rows,
    summary: [{ label: "Campaigns", value: String(rows.length) }],
  };
}

export function buildMarketingRecipientsExportDataset(input: {
  campaignName: string;
  recipients: CampaignRecipientListItem[];
  restaurantName: string;
}): ExportDataset {
  const rows = input.recipients
    .filter((recipient) => customerHasMarketingOptIn(recipient.customer))
    .map((recipient) => ({
      customerName: recipient.customer.fullName ?? "",
      phone: recipient.customer.phone ?? "",
      consent: "Yes",
      campaign: input.campaignName,
      status: recipient.status,
      channel: recipient.channel,
      restaurant: input.restaurantName,
    }));

  return {
    filenamePrefix: "marketing_recipients",
    meta: {
      title: "Campaign Recipients",
      restaurantName: input.restaurantName,
      filterSummary: [`Campaign: ${input.campaignName}`, "Marketing opt-in only"],
    },
    columns: [
      { key: "customerName", header: "Customer Name" },
      { key: "phone", header: "Phone" },
      { key: "consent", header: "Consent" },
      { key: "campaign", header: "Campaign" },
      { key: "status", header: "Status" },
      { key: "channel", header: "Channel" },
      { key: "restaurant", header: "Restaurant" },
    ],
    rows,
    summary: [{ label: "Recipients", value: String(rows.length) }],
  };
}
