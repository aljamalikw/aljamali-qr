/**
 * Channel provider contracts for Marketing Center.
 * WhatsApp Share is free (no API). Email / SMS / Push plug in later.
 */

export type MarketingShareChannel =
  | "whatsapp_share"
  | "copy"
  | "email"
  | "sms"
  | "push";

export type ChannelPrepareRequest = {
  restaurantId: string;
  campaignId?: string;
  restaurantName: string;
  campaignName: string;
  message: string;
  phone?: string | null;
};

export type ChannelPrepareResult = {
  ok: boolean;
  channel: MarketingShareChannel;
  providerId: string;
  /** Rendered message body ready to share/copy/send. */
  body?: string;
  /** URL for share-style channels (WhatsApp). */
  url?: string;
  /** Coming-soon / not configured messaging — never claim fake delivery. */
  available: boolean;
  error?: string;
};

export interface MarketingChannelAdapter {
  readonly id: string;
  readonly channel: MarketingShareChannel;
  readonly available: boolean;
  prepare(request: ChannelPrepareRequest): Promise<ChannelPrepareResult>;
}
