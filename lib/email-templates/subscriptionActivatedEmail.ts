import { formatPlanPriceLabel } from "@/lib/subscriptions/plans";
import { escapeHtml, renderEmailLayout } from "./shared";

export type SubscriptionActivatedEmailData = {
  ownerName: string;
  restaurantName: string;
  plan: string;
  monthlyPrice: string;
  renewalDate: string;
};

export function renderSubscriptionActivatedEmail(
  data: SubscriptionActivatedEmailData,
): string {
  const name = escapeHtml(data.ownerName || "there");
  const restaurant = escapeHtml(data.restaurantName || "your restaurant");
  const plan = escapeHtml(data.plan || "Starter");
  const price = escapeHtml(data.monthlyPrice || "");
  const renewal = escapeHtml(data.renewalDate || "");

  return renderEmailLayout({
    previewText: `Your ${plan} subscription is now active.`,
    heading: `Subscription activated, ${name}`,
    bodyHtml: `
      <p style="margin:0 0 14px;">Your <strong style="color:#e8c547;">${plan}</strong> plan for <strong style="color:#e8c547;">${restaurant}</strong> is now active.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 14px;border:1px solid rgba(212,175,55,0.15);border-radius:10px;">
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:rgba(245,245,245,0.5);">Plan</td>
          <td style="padding:12px 16px;font-size:13px;color:#f5f5f5;text-align:right;">${plan}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:rgba(245,245,245,0.5);border-top:1px solid rgba(212,175,55,0.1);">Monthly price</td>
          <td style="padding:12px 16px;font-size:13px;color:#f5f5f5;text-align:right;border-top:1px solid rgba(212,175,55,0.1);">${price}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:rgba(245,245,245,0.5);border-top:1px solid rgba(212,175,55,0.1);">Renews on</td>
          <td style="padding:12px 16px;font-size:13px;color:#f5f5f5;text-align:right;border-top:1px solid rgba(212,175,55,0.1);">${renewal}</td>
        </tr>
      </table>
      <p style="margin:0;">Thank you for growing with Aljamali QR.</p>
    `,
    ctaLabel: "Manage Subscription",
    ctaHref: "https://aljamaliqr.com/dashboard/subscription",
  });
}

export const subscriptionActivatedEmailSample: SubscriptionActivatedEmailData = {
  ownerName: "Layla Al-Mutairi",
  restaurantName: "Saffron Garden",
  plan: "Professional",
  monthlyPrice: formatPlanPriceLabel("Professional"),
  renewalDate: "September 1, 2026",
};
