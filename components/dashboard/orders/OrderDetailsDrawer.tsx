"use client";

import { AnimatePresence, motion } from "framer-motion";
import { DashboardIcon } from "@/components/dashboard/icons/DashboardIcons";
import type { Order, PaymentStatus } from "@/lib/orders/types";
import { PAYMENT_STATUSES } from "@/lib/orders/types";
import {
  canCancelOrder,
  getNextOrderStatus,
  getNextOrderStatusActionLabel,
} from "@/lib/orders/utils";
import { OrderStatusBadge, PaymentStatusBadge } from "./OrderStatusBadge";

interface OrderDetailsDrawerProps {
  order: Order | null;
  onClose: () => void;
  onAdvanceStatus: (order: Order) => void;
  onCancel: (order: Order) => void;
  onPaymentStatusChange: (order: Order, status: PaymentStatus) => void;
  onCopyFeedbackLink?: (order: Order) => void;
}

const labelClass = "block text-xs font-medium uppercase tracking-wider text-white/40";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailsDrawer({
  order,
  onClose,
  onAdvanceStatus,
  onCancel,
  onPaymentStatusChange,
  onCopyFeedbackLink,
}: OrderDetailsDrawerProps) {
  const nextStatus = order ? getNextOrderStatus(order.status) : null;
  const nextLabel = order ? getNextOrderStatusActionLabel(order.status) : null;

  return (
    <AnimatePresence>
      {order && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ opacity: 0, x: "100%", scale: 0.98 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: "100%", scale: 0.98 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="menu-drawer fixed inset-0 z-50 flex w-full flex-col border-s border-gold/10 shadow-2xl sm:inset-y-0 sm:start-auto sm:end-0 sm:max-w-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="order-drawer-title"
          >
            <div className="flex items-center justify-between border-b border-gold/10 px-5 py-4">
              <div>
                <h2 id="order-drawer-title" className="font-serif text-xl font-bold text-white">
                  Order {order.orderNumber}
                </h2>
                <p className="mt-1 text-xs text-white/45">
                  {order.orderType === "Dine In"
                    ? order.tableNumber
                      ? `Table ${order.tableNumber}`
                      : "Dine In"
                    : order.customerName?.trim() || order.orderType}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-2 text-white/50 hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <DashboardIcon name="close" className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.paymentStatus} />
                <span className="rounded-full border border-gold/20 bg-gold/5 px-2.5 py-1 text-xs text-gold/90">
                  {order.orderType}
                </span>
                {Object.keys(order.printerPayload ?? {}).length > 0 && (
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-xs text-white/60">
                    🖨 Printer ready
                  </span>
                )}
              </div>

              <section className="space-y-3 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">
                  {order.orderType === "Dine In"
                    ? "Table"
                    : order.orderType === "Delivery"
                      ? "Delivery Details"
                      : "Customer"}
                </h3>
                <div className="grid gap-3 text-sm sm:grid-cols-2">
                  {order.orderType === "Dine In" && (
                    <div>
                      <p className={labelClass}>Table Number</p>
                      <p className="mt-1 text-white/85">{order.tableNumber || "—"}</p>
                    </div>
                  )}

                  {order.orderType === "Takeaway" && (
                    <>
                      {order.customerName && (
                        <div>
                          <p className={labelClass}>Name</p>
                          <p className="mt-1 text-white/85">{order.customerName}</p>
                        </div>
                      )}
                      {order.customerPhone && (
                        <div>
                          <p className={labelClass}>Phone</p>
                          <p className="mt-1 text-white/85">{order.customerPhone}</p>
                        </div>
                      )}
                      {!order.customerName && !order.customerPhone && (
                        <div className="sm:col-span-2">
                          <p className="text-white/55">No customer details provided</p>
                        </div>
                      )}
                    </>
                  )}

                  {order.orderType === "Delivery" && (
                    <>
                      <div>
                        <p className={labelClass}>Name</p>
                        <p className="mt-1 text-white/85">{order.customerName || "—"}</p>
                      </div>
                      <div>
                        <p className={labelClass}>Phone</p>
                        <p className="mt-1 text-white/85">{order.customerPhone || "—"}</p>
                      </div>
                      {order.deliveryAddress && (
                        <div className="sm:col-span-2">
                          <p className={labelClass}>Delivery Address</p>
                          <p className="mt-1 text-white/85">{order.deliveryAddress}</p>
                        </div>
                      )}
                      {order.landmark && (
                        <div className="sm:col-span-2">
                          <p className={labelClass}>Landmark</p>
                          <p className="mt-1 text-white/85">{order.landmark}</p>
                        </div>
                      )}
                    </>
                  )}

                  {order.customerEmail && order.orderType !== "Dine In" && (
                    <div>
                      <p className={labelClass}>Email</p>
                      <p className="mt-1 text-white/85">{order.customerEmail}</p>
                    </div>
                  )}
                </div>
                {order.specialInstructions && (
                  <div>
                    <p className={labelClass}>Notes</p>
                    <p className="mt-1 text-sm text-white/85">{order.specialInstructions}</p>
                  </div>
                )}
              </section>

              <section className="space-y-3 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">Items</h3>
                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start justify-between gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-white">
                          {item.quantity}× {item.itemName}
                        </p>
                        {item.notes && <p className="mt-0.5 text-xs text-white/40">{item.notes}</p>}
                      </div>
                      <span className="shrink-0 text-sm text-white/70">
                        {item.lineTotal.toFixed(3)} {order.currency}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-1.5 border-t border-white/10 pt-3 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>Subtotal</span>
                    <span>
                      {order.subtotal.toFixed(3)} {order.currency}
                    </span>
                  </div>
                  {order.taxAmount > 0 && (
                    <div className="flex justify-between text-white/60">
                      <span>Tax</span>
                      <span>
                        {order.taxAmount.toFixed(3)} {order.currency}
                      </span>
                    </div>
                  )}
                  {order.discountAmount > 0 && (
                    <div className="flex justify-between text-white/60">
                      <span>Discount</span>
                      <span>
                        -{order.discountAmount.toFixed(3)} {order.currency}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-serif text-base font-bold text-white">
                    <span>Total</span>
                    <span className="text-gold">
                      {order.grandTotal.toFixed(3)} {order.currency}
                    </span>
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">Timeline</h3>
                <div className="space-y-1.5 text-sm text-white/60">
                  <p>Placed: {formatDateTime(order.createdAt)}</p>
                  {order.acceptedAt && <p>Accepted: {formatDateTime(order.acceptedAt)}</p>}
                  {order.preparingAt && <p>Preparing: {formatDateTime(order.preparingAt)}</p>}
                  {order.readyAt && <p>Ready: {formatDateTime(order.readyAt)}</p>}
                  {order.completedAt && <p>Completed: {formatDateTime(order.completedAt)}</p>}
                  {order.cancelledAt && <p>Cancelled: {formatDateTime(order.cancelledAt)}</p>}
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-gold/10 bg-black/20 p-4">
                <h3 className="font-serif text-lg text-white">Payment</h3>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_STATUSES.map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onPaymentStatusChange(order, status)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                        order.paymentStatus === status
                          ? "border-gold/40 bg-gold/15 text-gold"
                          : "border-white/10 bg-black/20 text-white/60 hover:border-white/20"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </section>
            </div>

            <div className="flex flex-wrap gap-2 border-t border-gold/10 px-5 py-4">
              {nextStatus && nextLabel && (
                <button
                  type="button"
                  className="menu-btn-primary flex-1"
                  onClick={() => onAdvanceStatus(order)}
                >
                  {nextLabel}
                </button>
              )}
              {order.status === "Completed" && onCopyFeedbackLink ? (
                <button
                  type="button"
                  className="menu-btn-secondary flex-1"
                  onClick={() => onCopyFeedbackLink(order)}
                >
                  Feedback link
                </button>
              ) : null}
              {canCancelOrder(order.status) && (
                <button type="button" className="menu-btn-danger flex-1" onClick={() => onCancel(order)}>
                  Cancel Order
                </button>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
