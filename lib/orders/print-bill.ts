import type { Order } from "@/lib/orders/types";
import type { Restaurant } from "@/lib/restaurants/types";

export type PrintBillRestaurant = Pick<
  Restaurant,
  | "restaurant_name"
  | "logo_url"
  | "phone"
  | "address_en"
  | "city"
  | "country"
  | "service_charge_rate"
>;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function money(amount: number, currency: string): string {
  return `${amount.toFixed(3)} ${currency}`;
}

function formatAddress(restaurant: PrintBillRestaurant): string {
  return [restaurant.address_en, restaurant.city, restaurant.country]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Optional service charge already stored on the order payload (display only).
 * Does not recalculate billing.
 */
export function getOrderServiceCharge(order: Order): number {
  const raw = order.printerPayload?.serviceCharge;
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

/**
 * Open the browser print dialog with a clean guest bill.
 * Does not change order status or payment status.
 */
export function printOrderBill(
  order: Order,
  restaurant: PrintBillRestaurant | null | undefined,
): void {
  if (typeof window === "undefined") return;

  const restaurantName =
    restaurant?.restaurant_name?.trim() || "Restaurant";
  const address = restaurant ? formatAddress(restaurant) : "";
  const phone = restaurant?.phone?.trim() || "";
  const logoUrl = restaurant?.logo_url?.trim() || "";
  const serviceCharge = getOrderServiceCharge(order);
  const placedAt = new Date(order.createdAt).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const itemRows = order.items
    .map((item) => {
      const notes = item.notes?.trim()
        ? `<div class="muted">Note: ${escapeHtml(item.notes.trim())}</div>`
        : "";
      return `<tr>
        <td>
          <strong>${escapeHtml(item.itemName)}</strong>
          ${notes}
        </td>
        <td class="qty">${item.quantity}</td>
        <td class="amt">${escapeHtml(money(item.lineTotal, order.currency))}</td>
      </tr>`;
    })
    .join("");

  const discountRow =
    order.discountAmount > 0
      ? `<div class="row"><span>Discount</span><span>-${escapeHtml(money(order.discountAmount, order.currency))}</span></div>`
      : "";
  const taxRow =
    order.taxAmount > 0
      ? `<div class="row"><span>Tax</span><span>${escapeHtml(money(order.taxAmount, order.currency))}</span></div>`
      : "";
  const serviceRow =
    serviceCharge > 0
      ? `<div class="row"><span>Service Charge</span><span>${escapeHtml(money(serviceCharge, order.currency))}</span></div>`
      : "";

  const tableRow =
    order.orderType === "Dine In" && order.tableNumber
      ? `<div class="meta"><strong>Table:</strong> ${escapeHtml(order.tableNumber)}</div>`
      : "";
  const customerRow = order.customerName?.trim()
    ? `<div class="meta"><strong>Customer:</strong> ${escapeHtml(order.customerName.trim())}</div>`
    : "";
  const logoBlock = logoUrl
    ? `<img class="logo" src="${escapeHtml(logoUrl)}" alt="" />`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Bill ${escapeHtml(order.orderNumber)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      font-family: Georgia, "Times New Roman", serif;
      color: #111;
      margin: 0;
      padding: 24px;
      background: #fff;
    }
    .sheet { max-width: 420px; margin: 0 auto; }
    .logo { max-height: 64px; max-width: 160px; object-fit: contain; margin-bottom: 8px; }
    h1 { font-size: 22px; margin: 0 0 4px; }
    .muted { color: #555; font-size: 12px; margin-top: 2px; }
    .meta { font-size: 13px; margin: 4px 0; }
    hr { border: none; border-top: 1px dashed #bbb; margin: 14px 0; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #666; padding-bottom: 6px; }
    td { padding: 6px 0; vertical-align: top; border-bottom: 1px solid #eee; }
    td.qty { text-align: center; width: 48px; }
    td.amt { text-align: right; white-space: nowrap; }
    .row { display: flex; justify-content: space-between; gap: 12px; font-size: 13px; margin: 4px 0; }
    .total { font-size: 16px; font-weight: bold; margin-top: 8px; }
    .pay { margin-top: 10px; font-size: 13px; }
    @media print {
      body { padding: 0; }
      .sheet { max-width: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    ${logoBlock}
    <h1>${escapeHtml(restaurantName)}</h1>
    ${address ? `<div class="muted">${escapeHtml(address)}</div>` : ""}
    ${phone ? `<div class="muted">${escapeHtml(phone)}</div>` : ""}
    <hr />
    <div class="meta"><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</div>
    <div class="meta"><strong>Date:</strong> ${escapeHtml(placedAt)}</div>
    <div class="meta"><strong>Type:</strong> ${escapeHtml(order.orderType)}</div>
    ${tableRow}
    ${customerRow}
    ${
      order.specialInstructions?.trim()
        ? `<div class="meta"><strong>Notes:</strong> ${escapeHtml(order.specialInstructions.trim())}</div>`
        : ""
    }
    <hr />
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th class="qty">Qty</th>
          <th class="amt">Amount</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>
    <hr />
    <div class="row"><span>Subtotal</span><span>${escapeHtml(money(order.subtotal, order.currency))}</span></div>
    ${discountRow}
    ${taxRow}
    ${serviceRow}
    <div class="row total"><span>Grand Total</span><span>${escapeHtml(money(order.grandTotal, order.currency))}</span></div>
    <div class="pay"><strong>Payment:</strong> ${escapeHtml(order.paymentStatus)}</div>
    <hr />
    <div class="muted" style="text-align:center;">Thank you for dining with us</div>
  </div>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "noopener,noreferrer,width=480,height=720");
  if (!printWindow) return;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
