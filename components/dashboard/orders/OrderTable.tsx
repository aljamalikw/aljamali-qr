"use client";

import type { Order } from "@/lib/orders/types";
import { formatTimeAgo, getNextOrderStatus, getNextOrderStatusActionLabel } from "@/lib/orders/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";

interface OrderTableProps {
  items: Order[];
  onRowClick: (order: Order) => void;
  onAdvanceStatus: (order: Order) => void;
}

function getCustomerSummary(order: Order): { primary: string; secondary?: string } {
  if (order.orderType === "Dine In") {
    return {
      primary: order.tableNumber ? `Table ${order.tableNumber}` : "Dine In",
    };
  }

  if (order.orderType === "Takeaway") {
    if (order.customerName || order.customerPhone) {
      return {
        primary: order.customerName?.trim() || "Takeaway guest",
        secondary: order.customerPhone?.trim() || undefined,
      };
    }
    return { primary: "Walk-in / Takeaway" };
  }

  return {
    primary: order.customerName?.trim() || "Delivery customer",
    secondary: order.customerPhone?.trim() || undefined,
  };
}

export function OrderTable({ items, onRowClick, onAdvanceStatus }: OrderTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[960px] text-left">
        <thead>
          <tr className="border-b border-gold/10">
            {[
              "Order #",
              "Type",
              "Customer",
              "Items",
              "Total",
              "Status",
              "Payment",
              "Placed",
              "Actions",
            ].map((heading) => (
              <th
                key={heading}
                className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((order) => {
            const nextStatus = getNextOrderStatus(order.status);
            const nextLabel = getNextOrderStatusActionLabel(order.status);
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const customer = getCustomerSummary(order);

            return (
              <tr
                key={order.id}
                className="table-row-hover cursor-pointer border-b border-white/5"
                onClick={() => onRowClick(order)}
              >
                <td className="px-3 py-3 text-sm font-medium text-white">
                  {order.orderNumber}
                  {Object.keys(order.printerPayload ?? {}).length > 0 && (
                    <span
                      className="ms-2 inline-flex items-center rounded-full border border-gold/20 bg-gold/5 px-1.5 py-0.5 text-[10px] text-gold/80"
                      title="Printer payload generated"
                    >
                      🖨 Printer ready
                    </span>
                  )}
                </td>
                <td className="px-3 py-3 text-sm text-white/60">{order.orderType}</td>
                <td className="px-3 py-3 text-sm text-white/80">
                  <p className="truncate">{customer.primary}</p>
                  {customer.secondary && (
                    <p className="text-xs text-white/40">{customer.secondary}</p>
                  )}
                </td>
                <td className="px-3 py-3 text-sm text-white/60">{itemCount}</td>
                <td className="px-3 py-3 text-sm font-medium text-gold">
                  {order.grandTotal.toFixed(3)} {order.currency}
                </td>
                <td className="px-3 py-3">
                  <OrderStatusBadge status={order.status} />
                </td>
                <td className="px-3 py-3">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </td>
                <td className="px-3 py-3 text-sm text-white/50">{formatTimeAgo(order.createdAt)}</td>
                <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                  {nextStatus && nextLabel && (
                    <button
                      type="button"
                      className="menu-btn-primary !px-2.5 !py-1.5 text-xs"
                      onClick={() => onAdvanceStatus(order)}
                    >
                      {nextLabel}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
