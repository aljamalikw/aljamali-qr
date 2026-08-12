export const ORDER_TYPES = ["Dine In", "Takeaway", "Delivery"] as const;
export type OrderType = (typeof ORDER_TYPES)[number];

export const ORDER_STATUSES = [
  "Pending",
  "Accepted",
  "Preparing",
  "Ready",
  "Completed",
  "Cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_STATUSES = [
  "Unpaid",
  "Paid",
  "Refunded",
  "Failed",
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type OrderItemInput = {
  menuItemId?: string | null;
  itemName: string;
  unitPrice: number;
  quantity: number;
  notes?: string;
};

export type CreateOrderInput = {
  restaurantId: string;
  orderType: OrderType;
  customerName?: string;
  customerPhone?: string;
  customerEmail?: string;
  deliveryAddress?: string;
  landmark?: string;
  tableNumber?: string;
  specialInstructions?: string;
  /** Opt into loyalty rewards on this order (plan-gated server-side). */
  joinLoyalty?: boolean;
  /** Marketing / promotions consent stored on CRM metadata. */
  marketingOptIn?: boolean;
  items: OrderItemInput[];
  taxRate?: number;
  discountAmount?: number;
  currency?: string;
};

export type OrderItem = {
  id: string;
  orderId: string;
  restaurantId: string;
  menuItemId: string | null;
  itemName: string;
  unitPrice: number;
  quantity: number;
  notes: string | null;
  lineTotal: number;
};

export type OrderItemRecord = {
  id: string;
  order_id: string;
  restaurant_id: string;
  menu_item_id: string | null;
  item_name: string;
  unit_price: number | string;
  quantity: number;
  notes: string | null;
  line_total: number | string;
  created_at?: string;
};

export type OrderRecord = {
  id: string;
  restaurant_id: string;
  order_number: string;
  order_type: string;
  status: string;
  payment_status: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  delivery_address: string | null;
  landmark: string | null;
  table_number: string | null;
  special_instructions: string | null;
  subtotal: number | string;
  tax_amount: number | string;
  discount_amount: number | string;
  grand_total: number | string;
  currency: string;
  accepted_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  kitchen_notes: string | null;
  printer_payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  order_items?: OrderItemRecord[];
};

export type Order = {
  id: string;
  restaurantId: string;
  orderNumber: string;
  orderType: OrderType;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName: string | null;
  customerPhone: string | null;
  customerEmail: string | null;
  deliveryAddress: string | null;
  landmark: string | null;
  tableNumber: string | null;
  specialInstructions: string | null;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  grandTotal: number;
  currency: string;
  acceptedAt: string | null;
  preparingAt: string | null;
  readyAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  kitchenNotes: string | null;
  printerPayload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
};

export type CartLine = {
  key: string;
  menuItemId: string;
  name: string;
  unitPrice: number;
  quantity: number;
  notes: string;
};
