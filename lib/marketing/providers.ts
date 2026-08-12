/**
 * Channel delivery adapters for Marketing Center.
 * WhatsApp campaigns go through lib/marketing/whatsapp (sendCampaign).
 * Email / SMS / Push remain stubs until providers are connected.
 */

import type { MarketingChannel } from "@/lib/marketing/types";
import { sendCampaign as sendWhatsAppCampaign } from "@/lib/marketing/whatsapp";

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
};

export type MarketingChannelProvider = {
  id: string;
  channel: MarketingChannel;
  send: (payload: MarketingDeliveryPayload) => Promise<MarketingDeliveryResult>;
};

/** Placeholders — swap implementations without redesigning campaign UI. */
export const marketingProviders: Partial<
  Record<MarketingChannel, MarketingChannelProvider>
> = {
  whatsapp: {
    id: "whatsapp_provider_bridge",
    channel: "whatsapp",
    async send(payload) {
      const response = await sendWhatsAppCampaign({
        restaurantId: payload.restaurantId,
        campaignId: payload.campaignId,
        restaurantName: String(payload.metadata?.restaurantName ?? ""),
        campaignName: String(payload.metadata?.campaignName ?? ""),
        messages: [
          {
            recipientId: payload.recipientId,
            customerId: payload.customerId,
            to: payload.to,
            body: payload.body,
          },
        ],
        metadata: payload.metadata,
      });
      const first = response.results[0];
      return {
        ok: Boolean(first?.ok),
        providerMessageId: first?.providerMessageId,
        error: first?.error ?? response.error,
        raw: response,
      };
    },
  },
  email: {
    id: "resend_or_sendgrid",
    channel: "email",
    async send() {
      return {
        ok: false,
        error: "Email provider (Resend/SendGrid) not configured yet.",
      };
    },
  },
  sms: {
    id: "twilio",
    channel: "sms",
    async send() {
      return { ok: false, error: "SMS (Twilio) reserved for future release." };
    },
  },
  push: {
    id: "firebase_push",
    channel: "push",
    async send() {
      return {
        ok: false,
        error: "Push (Firebase) reserved for future release.",
      };
    },
  },
};

export async function dispatchMarketingMessage(
  payload: MarketingDeliveryPayload,
): Promise<MarketingDeliveryResult> {
  const provider = marketingProviders[payload.channel];
  if (!provider) {
    return { ok: false, error: `No provider for channel ${payload.channel}` };
  }
  return provider.send(payload);
}
