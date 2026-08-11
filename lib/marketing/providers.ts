/**
 * Future delivery providers for Marketing Center.
 *
 * UI and campaign lifecycle do not call these yet. When integrating:
 * - WhatsApp Business API → implement sendWhatsApp
 * - Resend / SendGrid → implement sendEmail
 * - Twilio → implement sendSms
 * - Firebase Cloud Messaging → implement sendPush
 *
 * Campaign `metadata.providers` and recipient `metadata` store provider payloads /
 * message ids without changing the Marketing UI.
 */

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
    id: "whatsapp_business_api",
    channel: "whatsapp",
    async send() {
      return {
        ok: false,
        error: "WhatsApp Business API not configured yet.",
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
