import { escapeHtml, renderEmailLayout } from "./shared";

export type PaymentReceiptEmailData = {
  ownerName: string;
  restaurantName: string;
  invoiceNumber: string;
  amount: string;
  paymentMethod: string;
  paidAt: string;
};

export function renderPaymentReceiptEmail(
  data: PaymentReceiptEmailData,
): string {
  const name = escapeHtml(data.ownerName || "there");
  const restaurant = escapeHtml(data.restaurantName || "your restaurant");
  const invoice = escapeHtml(data.invoiceNumber || "—");
  const amount = escapeHtml(data.amount || "");
  const method = escapeHtml(data.paymentMethod || "—");
  const paidAt = escapeHtml(data.paidAt || "");

  return renderEmailLayout({
    previewText: `Payment received for invoice ${invoice}.`,
    heading: `Payment received, ${name}`,
    bodyHtml: `
      <p style="margin:0 0 14px;">We have received your payment for <strong style="color:#e8c547;">${restaurant}</strong>. Here is your receipt:</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 14px;border:1px solid rgba(212,175,55,0.15);border-radius:10px;">
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:rgba(245,245,245,0.5);">Invoice</td>
          <td style="padding:12px 16px;font-size:13px;color:#f5f5f5;text-align:right;">${invoice}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:rgba(245,245,245,0.5);border-top:1px solid rgba(212,175,55,0.1);">Amount</td>
          <td style="padding:12px 16px;font-size:13px;color:#f5f5f5;text-align:right;border-top:1px solid rgba(212,175,55,0.1);">${amount}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:rgba(245,245,245,0.5);border-top:1px solid rgba(212,175,55,0.1);">Method</td>
          <td style="padding:12px 16px;font-size:13px;color:#f5f5f5;text-align:right;border-top:1px solid rgba(212,175,55,0.1);">${method}</td>
        </tr>
        <tr>
          <td style="padding:12px 16px;font-size:13px;color:rgba(245,245,245,0.5);border-top:1px solid rgba(212,175,55,0.1);">Paid on</td>
          <td style="padding:12px 16px;font-size:13px;color:#f5f5f5;text-align:right;border-top:1px solid rgba(212,175,55,0.1);">${paidAt}</td>
        </tr>
      </table>
      <p style="margin:0;">Keep this email for your records.</p>
    `,
    ctaLabel: "View Billing History",
    ctaHref: "https://aljamaliqr.com/dashboard/subscription",
  });
}

export const paymentReceiptEmailSample: PaymentReceiptEmailData = {
  ownerName: "Layla Al-Mutairi",
  restaurantName: "Saffron Garden",
  invoiceNumber: "INV-2026-0042",
  amount: "KD 49.000",
  paymentMethod: "Visa •••• 4242",
  paidAt: "July 27, 2026",
};
