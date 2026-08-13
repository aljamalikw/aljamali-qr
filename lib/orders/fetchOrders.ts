import { supabase } from "@/lib/supabase";
import { mapOrderItemRow, mapOrderRow } from "./mappers";
import type { Order, OrderItemRecord, OrderRecord } from "./types";
import { filterOrders, isMissingTableError, type OrderFilters } from "./utils";

const FETCH_ERROR = "Unable to load orders. Please try again.";

/**
 * If the orders embed returns no line items, load order_items directly and merge.
 * Fixes cases where UPDATE/RETURNING or embed shape omits children while rows exist.
 */
async function attachMissingOrderItems(orders: Order[]): Promise<Order[]> {
  const missingIds = orders
    .filter((order) => order.items.length === 0)
    .map((order) => order.id);
  if (missingIds.length === 0) return orders;

  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", missingIds);

  if (error || !data?.length) return orders;

  const byOrderId = new Map<string, OrderItemRecord[]>();
  for (const row of data as OrderItemRecord[]) {
    const list = byOrderId.get(row.order_id) ?? [];
    list.push(row);
    byOrderId.set(row.order_id, list);
  }

  return orders.map((order) => {
    if (order.items.length > 0) return order;
    const rows = byOrderId.get(order.id);
    if (!rows?.length) return order;
    return { ...order, items: rows.map(mapOrderItemRow) };
  });
}

export async function fetchOrders(
  restaurantId: string,
  filters: OrderFilters = {},
): Promise<{ ok: true; data: Order[] } | { ok: false; message: string }> {
  try {
    if (!restaurantId) return { ok: true, data: [] };

    let query = supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (filters.status && filters.status !== "all") {
      query = query.eq("status", filters.status);
    }
    if (filters.orderType && filters.orderType !== "all") {
      query = query.eq("order_type", filters.orderType);
    }
    if (filters.paymentStatus && filters.paymentStatus !== "all") {
      query = query.eq("payment_status", filters.paymentStatus);
    }
    if (filters.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }

    const { data, error } = await query;

    if (error) {
      if (isMissingTableError(error)) return { ok: true, data: [] };
      return { ok: false, message: error.message || FETCH_ERROR };
    }

    let orders = await attachMissingOrderItems(
      ((data ?? []) as OrderRecord[]).map(mapOrderRow),
    );

    if (filters.search?.trim()) {
      orders = filterOrders(orders, { search: filters.search });
    }

    return { ok: true, data: orders };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}

export async function fetchOrderById(
  orderId: string,
): Promise<{ ok: true; data: Order | null } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("id", orderId)
      .maybeSingle();

    if (error) {
      if (isMissingTableError(error)) return { ok: true, data: null };
      return { ok: false, message: error.message || FETCH_ERROR };
    }

    if (!data) return { ok: true, data: null };

    const [order] = await attachMissingOrderItems([
      mapOrderRow(data as OrderRecord),
    ]);
    return { ok: true, data: order ?? null };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}
