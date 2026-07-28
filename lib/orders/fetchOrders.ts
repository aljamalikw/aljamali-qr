import { supabase } from "@/lib/supabase";
import { mapOrderRow } from "./mappers";
import type { Order, OrderRecord } from "./types";
import { filterOrders, isMissingTableError, type OrderFilters } from "./utils";

const FETCH_ERROR = "Unable to load orders. Please try again.";

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

    let orders = ((data ?? []) as OrderRecord[]).map(mapOrderRow);

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

    return { ok: true, data: data ? mapOrderRow(data as OrderRecord) : null };
  } catch {
    return { ok: false, message: FETCH_ERROR };
  }
}
