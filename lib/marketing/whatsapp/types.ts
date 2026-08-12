/**
 * WhatsApp campaign delivery — provider-agnostic contracts.
 * Swap Meta / Twilio / 360Dialog / MessageBird without changing UI.
 */

export type WhatsAppCampaignMessage = {
  recipientId: string;
  customerId: string;
  to: string;
  body: string;
  customerName?: string | null;
};

export type WhatsAppMessageSendResult = {
  recipientId: string;
  customerId: string;
  ok: boolean;
  status: "sent" | "failed" | "skipped";
  providerMessageId?: string;
  error?: string;
};

export type WhatsAppCampaignSendRequest = {
  restaurantId: string;
  campaignId: string;
  restaurantName: string;
  campaignName: string;
  messages: WhatsAppCampaignMessage[];
  metadata?: Record<string, unknown>;
};

export type WhatsAppCampaignSendResponse = {
  /** False when API credentials / provider are not connected. */
  configured: boolean;
  providerId: string;
  /** True only when the provider accepted the batch (partial failures still ok: true). */
  ok: boolean;
  delivered: number;
  failed: number;
  skipped: number;
  results: WhatsAppMessageSendResult[];
  error?: string;
};

export interface WhatsAppProvider {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  sendCampaign(
    request: WhatsAppCampaignSendRequest,
  ): Promise<WhatsAppCampaignSendResponse>;
}
