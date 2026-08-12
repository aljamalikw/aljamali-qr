import type {
  WhatsAppCampaignSendRequest,
  WhatsAppCampaignSendResponse,
  WhatsAppProvider,
} from "@/lib/marketing/whatsapp/types";

/**
 * Default provider until Meta Cloud API (or another) credentials are connected.
 * Never claims successful delivery.
 */
export class UnconfiguredWhatsAppProvider implements WhatsAppProvider {
  readonly id = "unconfigured";
  readonly name = "WhatsApp (not configured)";

  isConfigured(): boolean {
    return false;
  }

  async sendCampaign(
    request: WhatsAppCampaignSendRequest,
  ): Promise<WhatsAppCampaignSendResponse> {
    return {
      configured: false,
      providerId: this.id,
      ok: false,
      delivered: 0,
      failed: 0,
      skipped: request.messages.length,
      results: request.messages.map((message) => ({
        recipientId: message.recipientId,
        customerId: message.customerId,
        ok: false,
        status: "skipped" as const,
        error: "WhatsApp provider is not configured yet.",
      })),
      error:
        "WhatsApp delivery is not configured. Connect Meta WhatsApp Cloud API (or another provider) to send campaigns.",
    };
  }
}
