/**
 * Channel delivery adapters for Marketing Center.
 * Free path: WhatsApp Share + Copy Message (no API credentials).
 * Future: Resend/SendGrid, Twilio SMS, Firebase Push plug in here.
 */

import { prepareChannel } from "@/lib/marketing/channels";
import type { MarketingChannel } from "@/lib/marketing/types";

export type MarketingDeliveryPayload = {
  restaurantId: string;
  campaignId: string;
  recipientId: string;
  customerId: string;
  channel: MarketingChannel;
  to: string;
  subject?: string | null;
  body: string;
  metadata?: Record<string, unknown>;
};

export type MarketingDeliveryResult = {
  ok: boolean;
  providerMessageId?: string;
  error?: string;
  raw?: unknown;
  /** Share URL when channel is WhatsApp Share. */
  shareUrl?: string;
  body?: string;
};

/**
 * Prepare a free WhatsApp Share / Copy payload.
 * Does not claim API delivery.
 */
export async function dispatchMarketingMessage(
  payload: MarketingDeliveryPayload,
): Promise<MarketingDeliveryResult> {
  if (payload.channel === "whatsapp") {
    const prepared = await prepareChannel("whatsapp_share", {
      restaurantId: payload.restaurantId,
      campaignId: payload.campaignId,
      restaurantName: String(payload.metadata?.restaurantName ?? ""),
      campaignName: String(payload.metadata?.campaignName ?? ""),
      message: payload.body,
      phone: payload.to,
    });
    return {
      ok: prepared.ok,
      shareUrl: prepared.url,
      body: prepared.body,
      error: prepared.error,
      raw: prepared,
    };
  }

  if (payload.channel === "email") {
    const prepared = await prepareChannel("email", {
      restaurantId: payload.restaurantId,
      campaignId: payload.campaignId,
      restaurantName: String(payload.metadata?.restaurantName ?? ""),
      campaignName: String(payload.metadata?.campaignName ?? ""),
      message: payload.body,
    });
    return {
      ok: false,
      error: prepared.error ?? "Email is coming soon.",
      raw: prepared,
    };
  }

  return {
    ok: false,
    error: `Channel ${payload.channel} is coming soon.`,
  };
}
