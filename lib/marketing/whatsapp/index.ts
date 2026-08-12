/**
 * WhatsApp share entrypoints (free workflow).
 * Meta Cloud / Twilio / etc. can plug in later via channels adapters
 * without rewriting Campaign Center UI.
 */

export {
  buildWhatsAppShareUrl,
  copyTextToClipboard,
  isMobileClient,
  openWhatsAppShare,
} from "@/lib/marketing/whatsapp/share";

export {
  prepareChannel,
  getChannelAdapter,
} from "@/lib/marketing/channels";
