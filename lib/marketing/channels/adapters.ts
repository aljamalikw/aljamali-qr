import type {
  ChannelPrepareRequest,
  ChannelPrepareResult,
  MarketingChannelAdapter,
} from "@/lib/marketing/channels/types";
import { buildWhatsAppShareUrl } from "@/lib/marketing/whatsapp/share";

/** Free WhatsApp Share — opens WhatsApp with a pre-filled message. */
export class WhatsAppShareAdapter implements MarketingChannelAdapter {
  readonly id = "whatsapp_share";
  readonly channel = "whatsapp_share" as const;
  readonly available = true;

  async prepare(request: ChannelPrepareRequest): Promise<ChannelPrepareResult> {
    const body = request.message;
    return {
      ok: true,
      channel: this.channel,
      providerId: this.id,
      body,
      url: buildWhatsAppShareUrl(body, { phone: request.phone }),
      available: true,
    };
  }
}

export class CopyMessageAdapter implements MarketingChannelAdapter {
  readonly id = "copy_message";
  readonly channel = "copy" as const;
  readonly available = true;

  async prepare(request: ChannelPrepareRequest): Promise<ChannelPrepareResult> {
    return {
      ok: true,
      channel: this.channel,
      providerId: this.id,
      body: request.message,
      available: true,
    };
  }
}

export class EmailComingSoonAdapter implements MarketingChannelAdapter {
  readonly id = "email_future";
  readonly channel = "email" as const;
  readonly available = false;

  async prepare(): Promise<ChannelPrepareResult> {
    return {
      ok: false,
      channel: this.channel,
      providerId: this.id,
      available: false,
      error: "Email delivery is coming soon (Resend / SendGrid / Amazon SES).",
    };
  }
}

export class SmsComingSoonAdapter implements MarketingChannelAdapter {
  readonly id = "sms_future";
  readonly channel = "sms" as const;
  readonly available = false;

  async prepare(): Promise<ChannelPrepareResult> {
    return {
      ok: false,
      channel: this.channel,
      providerId: this.id,
      available: false,
      error: "SMS is coming soon.",
    };
  }
}

export class PushComingSoonAdapter implements MarketingChannelAdapter {
  readonly id = "push_future";
  readonly channel = "push" as const;
  readonly available = false;

  async prepare(): Promise<ChannelPrepareResult> {
    return {
      ok: false,
      channel: this.channel,
      providerId: this.id,
      available: false,
      error: "Push notifications are coming soon.",
    };
  }
}
