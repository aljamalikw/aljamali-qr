import {
  ORDER_STATUSES,
  ORDER_TYPES,
  PAYMENT_STATUSES,
  type Order,
  type OrderItem,
  type OrderItemRecord,
  type OrderRecord,
  type OrderStatus,
  type OrderType,
  type PaymentStatus,
} from "./types";

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  const parsed = typeof value === "number" ? value : parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function asOrderStatus(value: string): OrderStatus {
  return (ORDER_STATUSES as readonly string[]).includes(value)
    ? (value as OrderStatus)
    : "Pending";
}

export function asOrderType(value: string): OrderType {
  return (ORDER_TYPES as readonly string[]).includes(value)
    ? (value as OrderType)
    : "Dine In";
}

export function asPaymentStatus(value: string): PaymentStatus {
  return (PAYMENT_STATUSES as readonly string[]).includes(value)
    ? (value as PaymentStatus)
    : "Unpaid";
}

export function mapOrderItemRow(row: OrderItemRecord): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    restaurantId: row.restaurant_id,
    menuItemId: row.menu_item_id,
    itemName: row.item_name,
    unitPrice: toNumber(row.unit_price),
    quantity: row.quantity,
    notes: row.notes,
    lineTotal: toNumber(row.line_total),
  };
}

export function mapOrderRow(row: OrderRecord): Order {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    orderNumber: row.order_number,
    orderType: asOrderType(row.order_type),
    status: asOrderStatus(row.status),
    paymentStatus: asPaymentStatus(row.payment_status),
    loyaltyPointsAwardedAt: row.loyalty_points_awarded_at ?? null,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    deliveryAddress: row.delivery_address,
    landmark: row.landmark ?? null,
    tableNumber: row.table_number,
    specialInstructions: row.special_instructions,
    subtotal: toNumber(row.subtotal),
    taxAmount: toNumber(row.tax_amount),
    discountAmount: toNumber(row.discount_amount),
    grandTotal: toNumber(row.grand_total),
    currency: row.currency,
    acceptedAt: row.accepted_at,
    preparingAt: row.preparing_at,
    readyAt: row.ready_at,
    completedAt: row.completed_at,
    cancelledAt: row.cancelled_at,
    kitchenNotes: row.kitchen_notes,
    printerPayload: row.printer_payload ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    items: (row.order_items ?? []).map(mapOrderItemRow),
  };
}
