import {
  CopyMessageAdapter,
  EmailComingSoonAdapter,
  PushComingSoonAdapter,
  SmsComingSoonAdapter,
  WhatsAppShareAdapter,
} from "@/lib/marketing/channels/adapters";
import type {
  ChannelPrepareRequest,
  ChannelPrepareResult,
  MarketingChannelAdapter,
  MarketingShareChannel,
} from "@/lib/marketing/channels/types";

export type {
  ChannelPrepareRequest,
  ChannelPrepareResult,
  MarketingChannelAdapter,
  MarketingShareChannel,
} from "@/lib/marketing/channels/types";

const adapters: Record<MarketingShareChannel, MarketingChannelAdapter> = {
  whatsapp_share: new WhatsAppShareAdapter(),
  copy: new CopyMessageAdapter(),
  email: new EmailComingSoonAdapter(),
  sms: new SmsComingSoonAdapter(),
  push: new PushComingSoonAdapter(),
};

export function getChannelAdapter(
  channel: MarketingShareChannel,
): MarketingChannelAdapter {
  return adapters[channel];
}

/** Prepare a channel payload (share URL, copy body, or coming-soon error). */
export async function prepareChannel(
  channel: MarketingShareChannel,
  request: ChannelPrepareRequest,
): Promise<ChannelPrepareResult> {
  return getChannelAdapter(channel).prepare(request);
}
