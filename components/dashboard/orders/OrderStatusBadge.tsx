import type { OrderStatus, PaymentStatus } from "@/lib/orders/types";
import { getOrderStatusBadgeClass, getOrderStatusLabel, getPaymentStatusBadgeClass } from "@/lib/orders/utils";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getOrderStatusBadgeClass(status)}`}
    >
      {getOrderStatusLabel(status)}
    </span>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getPaymentStatusBadgeClass(status)}`}
    >
      {status}
    </span>
  );
}
