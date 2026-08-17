import { logActivity } from "@/lib/admin/activity-log";
import type { Customer } from "@/lib/customers/sync-customer";
import { applyCampaignPlaceholders } from "@/lib/marketing/templates";
import {
  buildWhatsAppShareUrl,
  openWhatsAppShare,
} from "@/lib/marketing/whatsapp/share";
import { normalizeWhatsAppPhone } from "@/lib/marketing/whatsapp/phone";

export const DEFAULT_CUSTOMER_WHATSAPP_TEMPLATE = `Hello {{first_name}} 👋

Thank you for being a valued customer at {{restaurant_name}}.

How can we help you today?

We look forward to serving you again!`;

export function customerHasMarketingOptIn(customer: Customer): boolean {
  return customer.metadata?.marketing_opt_in === true;
}

export function renderCustomerWhatsAppMessage(input: {
  template: string;
  customer: Customer;
  restaurantName: string;
}): string {
  const lastVisit = input.customer.lastVisit
    ? new Date(input.customer.lastVisit).toLocaleDateString()
    : "recently";

  return applyCampaignPlaceholders(input.template, {
    customerName: input.customer.fullName,
    restaurantName: input.restaurantName,
    loyaltyPoints: input.customer.loyaltyPoints,
    lastOrderDate: lastVisit,
    lastVisit,
    totalOrders: input.customer.totalOrders,
  });
}

export async function logWhatsAppOpened(input: {
  restaurantId: string;
  customerId: string;
  customerName?: string | null;
  campaignId?: string | null;
  messagePreview: string;
}): Promise<void> {
  const preview = input.messagePreview.trim().slice(0, 280);
  await logActivity({
    action: "whatsapp_opened",
    restaurantId: input.restaurantId,
    entityType: "customer",
    entityId: input.customerId,
    newValues: {
      customer_id: input.customerId,
      customer_name: input.customerName ?? null,
      campaign_id: input.campaignId ?? null,
      message_preview: preview,
    },
    metadata: {
      customer_id: input.customerId,
      campaign_id: input.campaignId ?? null,
      message_preview: preview,
    },
  });
}

/**
 * Open WhatsApp chat for a customer and record interaction history.
 * Does not claim message delivery — only that WhatsApp was opened.
 */
export async function openCustomerWhatsAppChat(input: {
  restaurantId: string;
  restaurantName: string;
  customer: Customer;
  message: string;
  campaignId?: string | null;
}): Promise<
  { ok: true; url: string } | { ok: false; message: string }
> {
  const phone = normalizeWhatsAppPhone(input.customer.phone);
  if (!phone) {
    return { ok: false, message: "This customer has no valid phone number." };
  }

  const body = input.message.trim();
  if (!body) {
    return { ok: false, message: "Message cannot be empty." };
  }

  // Campaign / promo sends must respect marketing consent server-side.
  if (input.campaignId && !customerHasMarketingOptIn(input.customer)) {
    return {
      ok: false,
      message: "This customer has not opted in to marketing messages.",
    };
  }

  const url = openWhatsAppShare(body, { phone });

  void logWhatsAppOpened({
    restaurantId: input.restaurantId,
    customerId: input.customer.id,
    customerName: input.customer.fullName,
    campaignId: input.campaignId,
    messagePreview: body,
  });

  return { ok: true, url };
}

export function previewCustomerWhatsAppUrl(input: {
  customer: Customer;
  message: string;
}): string | null {
  const phone = normalizeWhatsAppPhone(input.customer.phone);
  if (!phone) return null;
  return buildWhatsAppShareUrl(input.message, { phone });
}
