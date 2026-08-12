import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizePhone,
  syncCustomerEvent,
} from "@/lib/customers/sync-customer";
import { adjustLoyaltyPoints } from "@/lib/loyalty/mutations";
import { notifyRestaurantOwner } from "@/lib/notifications/createNotification";
import {
  planAllowsLoyalty,
  planAllowsOnlineOrdering,
} from "@/lib/subscriptions/plans";
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
  const who = params.customerName?.trim() || "Customer";
  if (params.orderType === "Dine In") {
    const table = params.tableNumber ? `Table ${params.tableNumber}` : "Dine In";
    return `${who} · ${table} placed a Dine In order — ${total}`;
  }
  if (params.orderType === "Takeaway") {
    return `${who} placed a Takeaway order — ${total}`;
  }
  return `${who} placed a Delivery order — ${total}`;
}

/** Simple earn rate: 1 loyalty point per whole currency unit spent. */
function loyaltyPointsForSpend(grandTotal: number): number {
  return Math.max(0, Math.floor(grandTotal));
}

/**
 * Core order write path. Browser calls must use createOrder() → API route;
 * the route passes the server service-role client here.
 */
export async function createOrderWithClient(
  client: SupabaseClient,
  input: CreateOrderInput,
): Promise<{ ok: true; data: Order } | { ok: false; message: string }> {
  try {
    if (!input.restaurantId) return { ok: false, message: CREATE_ERROR };

    const validation = validateCreateOrder(input);
    if (!validation.ok) return validation;

    const { data: restaurant, error: restaurantError } = await client
      .from("restaurants")
      .select("id, is_active, online_ordering_enabled, slug, subscription_plan")
      .eq("id", input.restaurantId)
      .maybeSingle();

    if (restaurantError) {
      return { ok: false, message: restaurantError.message || CREATE_ERROR };
    }
    if (
      !restaurant ||
      restaurant.is_active === false ||
      restaurant.online_ordering_enabled === false ||
      !String(restaurant.slug ?? "").trim()
    ) {
      return { ok: false, message: UNAVAILABLE_ERROR };
    }

    // Canonical plan is restaurant_subscriptions.plan (mirrors Billing).
    const { data: subscription } = await client
      .from("restaurant_subscriptions")
      .select("plan")
      .eq("restaurant_id", input.restaurantId)
      .maybeSingle();
    const plan =
      (typeof subscription?.plan === "string" && subscription.plan.trim()) ||
      (typeof restaurant.subscription_plan === "string" &&
        restaurant.subscription_plan.trim()) ||
      "Starter";
    if (!planAllowsOnlineOrdering(plan)) {
      return {
        ok: false,
        message:
          "Online ordering is not available on the Starter plan. Please contact the restaurant.",
      };
    }

    const subtotal = round(
      input.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0),
    );
    const taxRate = input.taxRate ?? 0;
    const taxAmount = round(subtotal * (taxRate / 100));
    const discountAmount = round(
      Math.min(input.discountAmount ?? 0, subtotal + taxAmount),
    );
    const grandTotal = round(Math.max(subtotal + taxAmount - discountAmount, 0));
    const currency = input.currency ?? "KWD";

    const trimmedTableNumber =
      input.orderType === "Dine In" ? input.tableNumber?.trim() || null : null;
    const trimmedCustomerName = input.customerName?.trim() || null;
    const trimmedCustomerPhone =
      normalizePhone(input.customerPhone) ||
      input.customerPhone?.trim() ||
      null;
    const trimmedCustomerEmail = input.customerEmail?.trim() || null;
    const trimmedDeliveryAddress =
      input.orderType === "Delivery"
        ? input.deliveryAddress?.trim() || null
        : null;
    const trimmedLandmark =
      input.orderType === "Delivery" ? input.landmark?.trim() || null : null;
    const trimmedSpecialInstructions =
      input.specialInstructions?.trim() || null;
    const joinLoyalty = Boolean(input.joinLoyalty) && planAllowsLoyalty(plan);
    const marketingOptIn = Boolean(input.marketingOptIn);

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

      const { data, error } = await client
        .from("orders")
        .insert({
          restaurant_id: input.restaurantId,
          order_number: orderNumber,
          order_type: input.orderType,
          customer_name: trimmedCustomerName,
          customer_phone: trimmedCustomerPhone,
          customer_email: trimmedCustomerEmail,
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

    const { data: insertedItems, error: itemsError } = await client
      .from("order_items")
      .insert(itemRows)
      .select("*");

    if (itemsError) {
      return { ok: false, message: itemsError.message || CREATE_ERROR };
    }

    const finalItems = (insertedItems ?? itemRows) as OrderItemRecord[];

    void notifyRestaurantOwner(
      input.restaurantId,
      {
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
      },
      client,
    );

    // CRM: create/update customer before returning so Admin CRM sees fresh stats.
    const syncResult = await syncCustomerEvent(
      {
        restaurantId: input.restaurantId,
        fullName: orderRow.customer_name,
        phone: orderRow.customer_phone,
        email: orderRow.customer_email,
        visitAt: orderRow.created_at ?? new Date().toISOString(),
        orderSpent: grandTotal,
        items: finalItems.map((item) => ({
          itemName: item.item_name,
          menuItemId: item.menu_item_id,
          quantity: item.quantity,
        })),
        joinLoyalty,
        marketingOptIn,
        notes: trimmedSpecialInstructions,
      },
      client,
    );

    if (
      syncResult.ok &&
      syncResult.customerId &&
      joinLoyalty
    ) {
      const points = loyaltyPointsForSpend(grandTotal);
      if (points > 0) {
        await adjustLoyaltyPoints({
          restaurantId: input.restaurantId,
          customerId: syncResult.customerId,
          delta: points,
          reason: `Order ${orderRow.order_number}`,
          client,
        });
      }
    }

    const fullOrder: OrderRecord = {
      ...orderRow,
      order_items: finalItems,
    };

    return { ok: true, data: mapOrderRow(fullOrder) };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}

/**
 * Browser entrypoint — posts to the secure Route Handler.
 * Does not use the anon key for inserts.
 */
export async function createOrder(
  input: CreateOrderInput,
): Promise<{ ok: true; data: Order } | { ok: false; message: string }> {
  try {
    const response = await fetch("/api/orders/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });

    let payload: {
      ok?: boolean;
      data?: Order;
      error?: string;
      message?: string;
    } = {};

    try {
      payload = (await response.json()) as typeof payload;
    } catch {
      return { ok: false, message: CREATE_ERROR };
    }

    if (!response.ok || !payload.ok || !payload.data) {
      return {
        ok: false,
        message: payload.error || payload.message || CREATE_ERROR,
      };
    }

    return { ok: true, data: payload.data };
  } catch {
    return { ok: false, message: CREATE_ERROR };
  }
}
