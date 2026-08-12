import type {
  WhatsAppCampaignSendRequest,
  WhatsAppCampaignSendResponse,
  WhatsAppProvider,
} from "@/lib/marketing/whatsapp/types";

/**
 * Meta WhatsApp Cloud API adapter (ready for credentials).
 * Activate by setting WHATSAPP_PROVIDER=meta and required env vars.
 */
export class MetaWhatsAppCloudProvider implements WhatsAppProvider {
  readonly id = "meta_whatsapp_cloud";
  readonly name = "Meta WhatsApp Cloud API";

  isConfigured(): boolean {
    const token = process.env.WHATSAPP_META_ACCESS_TOKEN?.trim();
    const phoneId = process.env.WHATSAPP_META_PHONE_NUMBER_ID?.trim();
    return Boolean(token && phoneId);
  }

  async sendCampaign(
    request: WhatsAppCampaignSendRequest,
  ): Promise<WhatsAppCampaignSendResponse> {
    if (!this.isConfigured()) {
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
          error: "Meta WhatsApp Cloud API credentials are missing.",
        })),
        error:
          "Meta WhatsApp Cloud API is selected but WHATSAPP_META_ACCESS_TOKEN / WHATSAPP_META_PHONE_NUMBER_ID are not set.",
      };
    }

    // Credentialed path reserved for production Meta Graph API calls.
    // Until wired, refuse silent fake delivery.
    return {
      configured: true,
      providerId: this.id,
      ok: false,
      delivered: 0,
      failed: request.messages.length,
      skipped: 0,
      results: request.messages.map((message) => ({
        recipientId: message.recipientId,
        customerId: message.customerId,
        ok: false,
        status: "failed" as const,
        error:
          "Meta Cloud API send path is not enabled in this release. Campaign recipients were not delivered.",
      })),
      error:
        "Meta WhatsApp Cloud API credentials are present, but outbound send is not enabled yet. Campaign was not marked as delivered.",
    };
  }
}
