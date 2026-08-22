import { supabase } from "@/lib/supabase";
import { emailTemplateRegistry } from "@/lib/email-templates/registry";

export type EmailTemplateRecord = {
  id: string;
  label: string;
  description: string;
  subject: string;
  bodyHtml: string;
  enabled: boolean;
  updatedAt: string | null;
};

export type EmailEventId =
  | "registration_successful"
  | "email_verified"
  | "trial_started"
  | "trial_ending_soon"
  | "trial_expired"
  | "subscription_activated"
  | "subscription_renewed"
  | "subscription_cancelled"
  | "payment_received"
  | "restaurant_suspended"
  | "restaurant_reactivated"
  | "password_reset"
  | "reservation_confirmation"
  | "reservation_cancelled"
  | "new_order"
  | "support_reply";

const FALLBACK_TEMPLATES: Record<
  string,
  { label: string; description: string; subject: string; bodyHtml: string }
> = {
  registration_successful: {
    label: "Registration Successful",
    description: "Sent after owner signup.",
    subject: "Welcome to Aljamali QR",
    bodyHtml: "<p>Welcome to Aljamali QR.</p>",
  },
  email_verified: {
    label: "Email Verified",
    description: "Sent after email verification.",
    subject: "Your email is verified",
    bodyHtml: "<p>Your email has been verified.</p>",
  },
  trial_started: {
    label: "Trial Started",
    description: "Sent when a trial begins.",
    subject: "Your free trial has started",
    bodyHtml: "<p>Your free trial has started.</p>",
  },
  trial_ending_soon: {
    label: "Trial Ending Soon",
    description: "Reminder before trial ends.",
    subject: "Your trial ends soon",
    bodyHtml: "<p>Your trial is ending soon.</p>",
  },
  trial_expired: {
    label: "Trial Expired",
    description: "Sent when trial expires.",
    subject: "Your trial has expired",
    bodyHtml: "<p>Your trial has expired.</p>",
  },
  subscription_activated: {
    label: "Subscription Activated",
    description: "Sent when a plan activates.",
    subject: "Subscription activated",
    bodyHtml: "<p>Your subscription is now active.</p>",
  },
  subscription_renewed: {
    label: "Subscription Renewed",
    description: "Sent on renewal.",
    subject: "Subscription renewed",
    bodyHtml: "<p>Your subscription was renewed.</p>",
  },
  subscription_cancelled: {
    label: "Subscription Cancelled",
    description: "Sent on cancellation.",
    subject: "Subscription cancelled",
    bodyHtml: "<p>Your subscription was cancelled.</p>",
  },
  payment_received: {
    label: "Payment Received",
    description: "Payment receipt.",
    subject: "Payment received",
    bodyHtml: "<p>We received your payment.</p>",
  },
  restaurant_suspended: {
    label: "Restaurant Suspended",
    description: "Account suspended notice.",
    subject: "Restaurant suspended",
    bodyHtml: "<p>Your restaurant has been suspended.</p>",
  },
  restaurant_reactivated: {
    label: "Restaurant Reactivated",
    description: "Account reactivated notice.",
    subject: "Restaurant reactivated",
    bodyHtml: "<p>Your restaurant has been reactivated.</p>",
  },
  password_reset: {
    label: "Password Reset",
    description: "Password reset email.",
    subject: "Reset your password",
    bodyHtml: "<p>Reset your password using the link provided.</p>",
  },
  reservation_confirmation: {
    label: "Reservation Confirmation",
    description: "Guest reservation confirm.",
    subject: "Reservation confirmed",
    bodyHtml: "<p>Your reservation is confirmed.</p>",
  },
  reservation_cancelled: {
    label: "Reservation Cancelled",
    description: "Guest reservation cancelled.",
    subject: "Reservation cancelled",
    bodyHtml: "<p>Your reservation was cancelled.</p>",
  },
  new_order: {
    label: "New Order",
    description: "Kitchen/owner new order.",
    subject: "New order received",
    bodyHtml: "<p>You have a new order.</p>",
  },
  support_reply: {
    label: "Support Reply",
    description: "Support ticket reply.",
    subject: "New support reply",
    bodyHtml: "<p>You have a new support reply.</p>",
  },
};

function wrapBrandedHtml(subject: string, bodyHtml: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>${subject}</title></head>
<body style="margin:0;background:#0a0a0a;color:#f5f5f5;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 20px;">
    <div style="border:1px solid rgba(212,175,55,0.35);border-radius:16px;background:#111;padding:28px;">
      <div style="text-align:center;margin:0 0 16px;">
        <img src="https://aljamaliqr.com/images/aljamali-qr-logo.png" alt="Al Jamali QR" width="200" style="max-width:200px;width:100%;height:auto;object-fit:contain;" />
      </div>
      <h1 style="margin:0 0 16px;font-size:24px;color:#fff;">${subject}</h1>
      <div style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.6;">${bodyHtml}</div>
    </div>
  </div>
</body></html>`;
}

export async function fetchEmailTemplates(): Promise<
  { ok: true; data: EmailTemplateRecord[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("label", { ascending: true });

    if (error) {
      // Table may not be migrated yet — fall back to in-code templates.
      const fallback = Object.entries(FALLBACK_TEMPLATES).map(([id, value]) => ({
        id,
        label: value.label,
        description: value.description,
        subject: value.subject,
        bodyHtml: value.bodyHtml,
        enabled: true,
        updatedAt: null,
      }));
      // Merge legacy registry previews for any overlapping IDs.
      for (const entry of emailTemplateRegistry) {
        if (!fallback.some((item) => item.id === entry.id)) {
          fallback.push({
            id: entry.id,
            label: entry.label,
            description: entry.description,
            subject: entry.label,
            bodyHtml: entry.render(),
            enabled: true,
            updatedAt: null,
          });
        }
      }
      return { ok: true, data: fallback };
    }

    const rows = (data ?? []).map((row) => ({
      id: row.id as string,
      label: row.label as string,
      description: (row.description as string) ?? "",
      subject: row.subject as string,
      bodyHtml: row.body_html as string,
      enabled: Boolean(row.enabled),
      updatedAt: (row.updated_at as string) ?? null,
    }));

    return { ok: true, data: rows };
  } catch {
    return { ok: false, message: "Unable to load email templates." };
  }
}

export async function updateEmailTemplate(input: {
  id: string;
  subject: string;
  bodyHtml: string;
  enabled: boolean;
}): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const { error } = await supabase.from("email_templates").upsert({
      id: input.id,
      label: FALLBACK_TEMPLATES[input.id]?.label ?? input.id,
      description: FALLBACK_TEMPLATES[input.id]?.description ?? "",
      subject: input.subject.trim(),
      body_html: input.bodyHtml,
      enabled: input.enabled,
      updated_at: new Date().toISOString(),
      updated_by: session?.user?.id ?? null,
    });

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to save email template." };
  }
}

/**
 * Framework-only send: queues into email_outbox. No third-party provider.
 */
export async function queueEmailNotification(input: {
  templateId: string;
  toEmail: string;
  subject?: string;
  bodyHtml?: string;
  meta?: Record<string, unknown>;
  asPreview?: boolean;
}): Promise<{ ok: true; outboxId: string } | { ok: false; message: string }> {
  try {
    const templates = await fetchEmailTemplates();
    if (!templates.ok) return templates;

    const template = templates.data.find((item) => item.id === input.templateId);
    if (!template) {
      return { ok: false, message: "Template not found." };
    }
    if (!template.enabled && !input.asPreview) {
      return { ok: false, message: "Template is disabled." };
    }

    const subject = input.subject?.trim() || template.subject;
    const bodyHtml = wrapBrandedHtml(
      subject,
      input.bodyHtml?.trim() || template.bodyHtml,
    );

    const { data, error } = await supabase
      .from("email_outbox")
      .insert({
        template_id: input.templateId,
        to_email: input.toEmail.trim(),
        subject,
        body_html: bodyHtml,
        status: input.asPreview ? "preview" : "queued",
        meta: input.meta ?? {},
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        ok: false,
        message:
          error?.message ||
          "Unable to queue email. Apply the email framework migration.",
      };
    }

    return { ok: true, outboxId: data.id as string };
  } catch {
    return { ok: false, message: "Unable to queue email." };
  }
}

export function renderTemplatePreview(template: EmailTemplateRecord): string {
  return wrapBrandedHtml(template.subject, template.bodyHtml);
}
