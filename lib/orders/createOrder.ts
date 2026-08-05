import { notifyRestaurantOwner } from "@/lib/notifications/createNotification";
import { supabase } from "@/lib/supabase";
import { mapOrderRow } from "./mappers";
import type { CreateOrderInput, Order, OrderItemRecord, OrderRecord } from "./types";
import { isMissingTableError } from "./utils";
import { validateCreateOrder } from "./validateCreateOrder";

const CREATE_ERROR = "Unable to place your order. Please try again.";
const UNAVAILABLE_ERROR =
  "Online ordering isn't available for this restaurant right now.";
const MAX_ORDER_NUMBER_ATTEMPTS = 6;
const UNIQUE_VIOLATION_CODE = "23505";

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

function generateOrderNumber(): string {
  return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function buildPrinterPayload(params: {
  orderNumber: string;
  orderType: string;
  tableNumber: string | null;
  customerName: string | null;
  specialInstructions: string | null;
  items: { name: string; quantity: number; notes: string | null }[];
}) {
  return {
    orderNumber: params.orderNumber,
    orderType: params.orderType,
    tableNumber: params.tableNumber,
    customerName: params.customerName,
    items: params.items,
    specialInstructions: params.specialInstructions,
    generatedAt: new Date().toISOString(),
  };
}

function buildNotificationBody(params: {
  orderType: string;
  customerName: string | null;
  tableNumber: string | null;
  grandTotal: number;
  currency: string;
}): string {
  const total = `${params.grandTotal.toFixed(3)} ${params.currency}`;
  if (params.orderType === "Dine In") {
    const table = params.tableNumber ? `Table ${params.tableNumber}` : "Dine In";
    return `${table} placed a Dine In order — ${total}`;
  }
  if (params.orderType === "Takeaway") {
    const who = params.customerName?.trim() || "Guest";
    return `${who} placed a Takeaway order — ${total}`;
  }
  const who = params.customerName?.trim() || "Customer";
  return `${who} placed a Delivery order — ${total}`;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<{ ok: true; data: Order } | { ok: false; message: string }> {
  try {
    if (!input.restaurantId) return { ok: false, message: CREATE_ERROR };

    const validation = validateCreateOrder(input);
    if (!validation.ok) return validation;

    const subtotal = round(
      input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
    const taxRate = input.taxRate ?? 0;
    const taxAmount = round(subtotal * (taxRate / 100));
    const discountAmount = round(Math.min(input.discountAmount ?? 0, subtotal + taxAmount));
    const grandTotal = round(Math.max(subtotal + taxAmount - discountAmount, 0));
    const currency = input.currency ?? "KWD";

    const trimmedTableNumber =
      input.orderType === "Dine In" ? input.tableNumber?.trim() || null : null;
    const trimmedCustomerName =
      input.orderType === "Dine In" ? null : input.customerName?.trim() || null;
    const trimmedCustomerPhone =
      input.orderType === "Dine In" ? null : input.customerPhone?.trim() || null;
    const trimmedDeliveryAddress =
      input.orderType === "Delivery" ? input.deliveryAddress?.trim() || null : null;
    const trimmedLandmark =
      input.orderType === "Delivery" ? input.landmark?.trim() || null : null;
    const trimmedSpecialInstructions = input.specialInstructions?.trim() || null;

    let orderRow: OrderRecord | null = null;
    let lastError: { code?: string; message?: string } | null = null;

    for (let attempt = 0; attempt < MAX_ORDER_NUMBER_ATTEMPTS; attempt += 1) {
      const orderNumber = generateOrderNumber();
      const printerPayload = buildPrinterPayload({
        orderNumber,
        orderType: input.orderType,
        tableNumber: trimmedTableNumber,
        customerName: trimmedCustomerName,
        specialInstructions: trimmedSpecialInstructions,
        items: input.items.map((item) => ({
          name: item.itemName,
          quantity: item.quantity,
          notes: item.notes?.trim() || null,
        })),
      });

      console.log("restaurant_id", input.restaurantId);
      const { data, error } = await supabase
        .from("orders")
        .insert({
          restaurant_id: input.restaurantId,
          order_number: orderNumber,
          order_type: input.orderType,
          customer_name: trimmedCustomerName,
          customer_phone: trimmedCustomerPhone,
          customer_email: input.customerEmail?.trim() || null,
          delivery_address: trimmedDeliveryAddress,
          landmark: trimmedLandmark,
          table_number: trimmedTableNumber,
          special_instructions: trimmedSpecialInstructions,
          subtotal,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          grand_total: grandTotal,
          currency,
          printer_payload: printerPayload,
        })
.select("*")
.maybeSingle();

      if (!error && data) {
        orderRow = data as OrderRecord;
        break;
      }
if (error) {
  console.log("SUPABASE ERROR:", error);
}
      lastError = error;
      if (error && error.code !== UNIQUE_VIOLATION_CODE) break;
    }

    if (!orderRow) {
      if (isMissingTableError(lastError)) {
        return { ok: false, message: UNAVAILABLE_ERROR };
      }
      return { ok: false, message: lastError?.message || CREATE_ERROR };
    }

    const itemRows = input.items.map((item) => ({
      order_id: orderRow!.id,
      restaurant_id: input.restaurantId,
      menu_item_id: item.menuItemId ?? null,
      item_name: item.itemName,
      unit_price: item.unitPrice,
      quantity: item.quantity,
      notes: item.notes?.trim() || null,
      line_total: round(item.unitPrice * item.quantity),
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from("order_items")
      .insert(itemRows)
      .select("*");

    if (itemsError) {
      return { ok: false, message: itemsError.message || CREATE_ERROR };
    }

    const finalItems = (insertedItems ?? itemRows) as OrderItemRecord[];

    void notifyRestaurantOwner(input.restaurantId, {
      type: "new_order",
      title: `New order ${orderRow.order_number}`,
      body: buildNotificationBody({
        orderType: orderRow.order_type,
        customerName: orderRow.customer_name,
        tableNumber: orderRow.table_number,
        grandTotal,
        currency,
      }),
      href: "/dashboard/orders",
      meta: { orderId: orderRow.id, orderNumber: orderRow.order_number },
    });

    const fullOrder: OrderRecord = {
      ...orderRow,
      order_items: finalItems,
    };

    return { ok: true, data: mapOrderRow(fullOrder) };
  } catch (err) {
  console.error("CATCH ERROR:", err);
    return { ok: false, message: CREATE_ERROR };
  }
}
