import { MetaWhatsAppCloudProvider } from "@/lib/marketing/whatsapp/meta-cloud-provider";
import { UnconfiguredWhatsAppProvider } from "@/lib/marketing/whatsapp/unconfigured-provider";
import type {
  WhatsAppCampaignSendRequest,
  WhatsAppCampaignSendResponse,
  WhatsAppProvider,
} from "@/lib/marketing/whatsapp/types";

export type {
  WhatsAppCampaignMessage,
  WhatsAppCampaignSendRequest,
  WhatsAppCampaignSendResponse,
  WhatsAppMessageSendResult,
  WhatsAppProvider,
} from "@/lib/marketing/whatsapp/types";

/**
 * Resolve the active WhatsApp provider.
 * Env: WHATSAPP_PROVIDER = meta | twilio | dialog360 | messagebird | (default unconfigured)
 */
export function getWhatsAppProvider(): WhatsAppProvider {
  const selected = (process.env.WHATSAPP_PROVIDER ?? "").trim().toLowerCase();

  if (selected === "meta" || selected === "meta_cloud" || selected === "whatsapp_cloud") {
    return new MetaWhatsAppCloudProvider();
  }

  // Future: twilio / 360dialog / messagebird plug-ins register here.
  if (
    selected === "twilio" ||
    selected === "360dialog" ||
    selected === "dialog360" ||
    selected === "messagebird"
  ) {
    return new UnconfiguredWhatsAppProvider();
  }

  const meta = new MetaWhatsAppCloudProvider();
  if (meta.isConfigured()) return meta;

  return new UnconfiguredWhatsAppProvider();
}

/**
 * Primary entrypoint used by Marketing Center send flows.
 * Does not fake delivery — structured success/failure only.
 */
export async function sendCampaign(
  request: WhatsAppCampaignSendRequest,
): Promise<WhatsAppCampaignSendResponse> {
  const provider = getWhatsAppProvider();
  return provider.sendCampaign(request);
}
