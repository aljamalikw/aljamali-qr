"use client";

import type { Order } from "@/lib/orders/types";
import { getElapsedLabel, getNextOrderStatus, getNextOrderStatusActionLabel } from "@/lib/orders/utils";

interface KitchenOrderCardProps {
  order: Order;
  now: number;
  onAdvance: (order: Order) => void;
  accentClass: string;
}

const TYPE_ICON: Record<Order["orderType"], string> = {
  "Dine In": "🍽",
  Takeaway: "🥡",
  Delivery: "🛵",
};

function getPrimaryLabel(order: Order): string {
  if (order.orderType === "Dine In") {
    return order.tableNumber ? `🍽 Table ${order.tableNumber}` : "🍽 Dine In";
  }
  if (order.orderType === "Takeaway") {
    return order.customerName?.trim() || "🥡 Takeaway";
  }
  return order.customerName?.trim() || "🛵 Delivery";
}

function getSecondaryLabel(order: Order): string | null {
  if (order.orderType === "Dine In") return null;
  if (order.orderType === "Delivery" && order.customerPhone) {
    return order.customerPhone;
  }
  if (order.orderType === "Takeaway" && order.customerPhone) {
    return order.customerPhone;
  }
  return null;
}

export function KitchenOrderCard({ order, now, onAdvance, accentClass }: KitchenOrderCardProps) {
  const nextStatus = getNextOrderStatus(order.status);
  const nextLabel = getNextOrderStatusActionLabel(order.status);
  const hasPrinterPayload = Object.keys(order.printerPayload ?? {}).length > 0;
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const primaryLabel = getPrimaryLabel(order);
  const secondaryLabel = getSecondaryLabel(order);

  return (
    <div className={`dashboard-card rounded-2xl border-t-4 p-4 ${accentClass}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          {order.orderType === "Dine In" ? (
            <>
              <p className="font-serif text-lg font-bold text-white">{primaryLabel}</p>
              <p className="mt-0.5 truncate text-xs text-white/50">Order {order.orderNumber}</p>
            </>
          ) : (
            <>
              <p className="font-serif text-lg font-bold text-white">{order.orderNumber}</p>
              <p className="mt-0.5 truncate text-xs text-white/50">
                {TYPE_ICON[order.orderType]} {order.orderType}
              </p>
            </>
          )}
        </div>
        <span className="shrink-0 rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs font-semibold text-white/70">
          ⏱ {getElapsedLabel(order.createdAt, now)}
        </span>
      </div>

      {order.orderType !== "Dine In" && (
        <p className="mt-3 truncate text-sm font-medium text-white/85">{primaryLabel}</p>
      )}
      {secondaryLabel && (
        <p className="mt-0.5 truncate text-xs text-white/45">{secondaryLabel}</p>
      )}

      <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3">
        {order.items.map((item) => (
          <div key={item.id} className="text-sm text-white/75">
            <span className="font-semibold text-gold">{item.quantity}×</span> {item.itemName}
            {item.notes && <span className="block ps-5 text-xs text-white/45">📝 {item.notes}</span>}
          </div>
        ))}
      </div>

      {order.specialInstructions && (
        <p className="mt-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-2.5 py-2 text-xs text-amber-200/90">
          ⚠ {order.specialInstructions}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-white/35">{itemCount} items</span>
        {hasPrinterPayload && (
          <span className="rounded-full border border-gold/20 bg-gold/5 px-2 py-0.5 text-[10px] text-gold/80">
            🖨 Printer ready
          </span>
        )}
      </div>

      {nextStatus && nextLabel && (
        <button
          type="button"
          onClick={() => onAdvance(order)}
          className="menu-btn-primary mt-4 w-full !py-3 text-sm"
        >
          {nextLabel}
        </button>
      )}
    </div>
  );
}
