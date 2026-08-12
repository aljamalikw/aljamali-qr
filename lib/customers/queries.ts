import { supabase } from "@/lib/supabase";
import {
  CUSTOMER_TAG_PRESETS,
  mapCustomer,
  normalizeEmail,
  normalizePhone,
  syncCustomerEvent,
  type Customer,
  type CustomerFilter,
  type CustomerRecord,
  type CustomerSummary,
  type CustomerTimelineItem,
} from "./sync-customer";

const ERROR = "Unable to load customers. Please try again.";

export { CUSTOMER_TAG_PRESETS };
export type { Customer, CustomerFilter, CustomerSummary, CustomerTimelineItem };

export async function fetchCustomers(
  restaurantId: string,
): Promise<{ ok: true; data: Customer[] } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("last_visit", { ascending: false, nullsFirst: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return {
      ok: true,
      data: ((data ?? []) as CustomerRecord[]).map(mapCustomer),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchCustomerById(
  restaurantId: string,
  customerId: string,
): Promise<{ ok: true; data: Customer } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("customers")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("id", customerId)
      .maybeSingle();

    if (error) return { ok: false, message: error.message || ERROR };
    if (!data) return { ok: false, message: "Customer not found." };
    return { ok: true, data: mapCustomer(data as CustomerRecord) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export function computeCustomerSummary(customers: Customer[]): CustomerSummary {
  const returningCustomers = customers.filter(
    (customer) => customer.totalOrders + customer.totalReservations >= 2,
  ).length;
  const spenders = customers.filter((customer) => customer.totalSpent > 0);
  const averageSpend =
    spenders.length > 0
      ? spenders.reduce((sum, customer) => sum + customer.totalSpent, 0) /
        spenders.length
      : 0;
  const top = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)[0];

  return {
    customers: customers.length,
    returningCustomers,
    averageSpend,
    topCustomerName: top?.fullName?.trim() || top?.phone || top?.email || null,
    topCustomerSpent: top?.totalSpent ?? 0,
  };
}

export function filterCustomers(
  customers: Customer[],
  params: {
    search: string;
    filter: CustomerFilter;
    birthdayMonth?: number | "all";
  },
): Customer[] {
  const query = params.search.trim().toLowerCase();
  const month = params.birthdayMonth;

  return customers.filter((customer) => {
    if (params.filter === "VIP" && !customer.tags.includes("VIP")) return false;
    if (params.filter === "Regular" && !customer.tags.includes("Regular")) {
      return false;
    }
    if (params.filter === "Inactive" && !customer.tags.includes("Inactive")) {
      return false;
    }
    if (
      params.filter === "High Spender" &&
      !customer.tags.includes("High Spender")
    ) {
      return false;
    }
    if (params.filter === "Birthday") {
      if (!customer.birthday) return false;
      if (month && month !== "all") {
        const birthMonth = new Date(customer.birthday).getUTCMonth() + 1;
        if (birthMonth !== month) return false;
      }
    } else if (month && month !== "all") {
      if (!customer.birthday) return false;
      const birthMonth = new Date(customer.birthday).getUTCMonth() + 1;
      if (birthMonth !== month) return false;
    }

    if (!query) return true;
    return (
      (customer.fullName?.toLowerCase().includes(query) ?? false) ||
      (customer.phone?.toLowerCase().includes(query) ?? false) ||
      (customer.email?.toLowerCase().includes(query) ?? false)
    );
  });
}

export async function updateCustomerNotes(
  customerId: string,
  notes: string,
): Promise<{ ok: true; data: Customer } | { ok: false; message: string }> {
  try {
    const { data: existing } = await supabase
      .from("customers")
      .select("*")
      .eq("id", customerId)
      .maybeSingle();

    if (!existing) return { ok: false, message: "Customer not found." };

    const current = mapCustomer(existing as CustomerRecord);
    const trimmed = notes.trim();
    const noteHistory = [...(current.metadata.noteHistory ?? [])];
    if (trimmed && trimmed !== (current.notes ?? "").trim()) {
      noteHistory.unshift({ at: new Date().toISOString(), note: trimmed });
    }

    const { data, error } = await supabase
      .from("customers")
      .update({
        notes: trimmed || null,
        metadata: {
          ...current.metadata,
          noteHistory: noteHistory.slice(0, 50),
        },
      })
      .eq("id", customerId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message || "Unable to save notes." };
    }
    return { ok: true, data: mapCustomer(data as CustomerRecord) };
  } catch {
    return { ok: false, message: "Unable to save notes." };
  }
}

export async function updateCustomerTags(
  customerId: string,
  tags: string[],
): Promise<{ ok: true; data: Customer } | { ok: false; message: string }> {
  try {
    const cleaned = [
      ...new Set(
        tags
          .map((tag) => tag.trim())
          .filter(Boolean)
          .slice(0, 20),
      ),
    ];

    const { data, error } = await supabase
      .from("customers")
      .update({ tags: cleaned })
      .eq("id", customerId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message || "Unable to update tags." };
    }
    return { ok: true, data: mapCustomer(data as CustomerRecord) };
  } catch {
    return { ok: false, message: "Unable to update tags." };
  }
}

export async function updateCustomerProfile(
  customerId: string,
  input: {
    fullName?: string;
    phone?: string;
    email?: string;
    birthday?: string | null;
  },
): Promise<{ ok: true; data: Customer } | { ok: false; message: string }> {
  try {
    const payload: Record<string, unknown> = {};
    if (input.fullName !== undefined) {
      payload.full_name = input.fullName.trim() || null;
    }
    if (input.phone !== undefined) {
      payload.phone = normalizePhone(input.phone);
    }
    if (input.email !== undefined) {
      payload.email = normalizeEmail(input.email);
    }
    if (input.birthday !== undefined) {
      payload.birthday = input.birthday || null;
    }

    const { data, error } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", customerId)
      .select("*")
      .maybeSingle();

    if (error || !data) {
      return { ok: false, message: error?.message || "Unable to update customer." };
    }
    return { ok: true, data: mapCustomer(data as CustomerRecord) };
  } catch {
    return { ok: false, message: "Unable to update customer." };
  }
}

/** Backfill CRM rows from historical orders/reservations (batch, no N+1 loops of joins). */
export async function backfillCustomersFromHistory(
  restaurantId: string,
): Promise<{ ok: true; synced: number } | { ok: false; message: string }> {
  try {
    const [{ data: customers }, { data: orders }, { data: reservations }] =
      await Promise.all([
        supabase
          .from("customers")
          .select("id")
          .eq("restaurant_id", restaurantId)
          .limit(1),
        supabase
          .from("orders")
          .select(
            "id, customer_name, customer_phone, customer_email, grand_total, created_at, order_items(item_name, menu_item_id, quantity)",
          )
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: true })
          .limit(500),
        supabase
          .from("reservations")
          .select(
            "id, customer_name, mobile_number, email, created_at",
          )
          .eq("restaurant_id", restaurantId)
          .order("created_at", { ascending: true })
          .limit(500),
      ]);

    if ((customers ?? []).length > 0) {
      return { ok: true, synced: 0 };
    }

    let synced = 0;

    for (const order of (orders ?? []) as Array<{
      customer_name: string | null;
      customer_phone: string | null;
      customer_email: string | null;
      grand_total: number | string;
      created_at: string;
      order_items:
        | Array<{
            item_name: string;
            menu_item_id: string | null;
            quantity: number;
          }>
        | null;
    }>) {
      const result = await syncCustomerEvent({
        restaurantId,
        fullName: order.customer_name,
        phone: order.customer_phone,
        email: order.customer_email,
        visitAt: order.created_at,
        orderSpent: Number(order.grand_total ?? 0),
        items: (order.order_items ?? []).map((item) => ({
          itemName: item.item_name,
          menuItemId: item.menu_item_id,
          quantity: item.quantity,
        })),
      });
      if (result.ok && result.customerId) synced += 1;
    }

    for (const reservation of (reservations ?? []) as Array<{
      customer_name: string | null;
      mobile_number: string | null;
      email: string | null;
      created_at: string;
    }>) {
      const result = await syncCustomerEvent({
        restaurantId,
        fullName: reservation.customer_name,
        phone: reservation.mobile_number,
        email: reservation.email,
        visitAt: reservation.created_at,
        reservationIncrement: 1,
      });
      if (result.ok && result.customerId) synced += 1;
    }

    return { ok: true, synced };
  } catch {
    return { ok: false, message: "Unable to backfill customers." };
  }
}

export async function fetchCustomerTimeline(
  restaurantId: string,
  customer: Customer,
): Promise<
  { ok: true; data: CustomerTimelineItem[] } | { ok: false; message: string }
> {
  try {
    const phone = normalizePhone(customer.phone);
    const email = normalizeEmail(customer.email);

    let ordersQuery = supabase
      .from("orders")
      .select(
        "id, order_number, status, grand_total, currency, created_at, customer_phone, customer_email",
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(100);

    let reservationsQuery = supabase
      .from("reservations")
      .select(
        "id, status, reservation_date, reservation_time, guests, created_at, mobile_number, email",
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(100);

    const [ordersResult, reservationsResult, activityResult] = await Promise.all([
      ordersQuery,
      reservationsQuery,
      supabase
        .from("activity_logs")
        .select("id, action, new_values, created_at, actor_name")
        .eq("restaurant_id", restaurantId)
        .eq("action", "whatsapp_opened")
        .eq("entity_id", customer.id)
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

    if (ordersResult.error) {
      return { ok: false, message: ordersResult.error.message };
    }
    if (reservationsResult.error) {
      return { ok: false, message: reservationsResult.error.message };
    }

    const orders = ((ordersResult.data ?? []) as Array<{
      id: string;
      order_number: string;
      status: string;
      grand_total: number | string;
      currency: string;
      created_at: string;
      customer_phone: string | null;
      customer_email: string | null;
    }>).filter((order) => {
      const orderPhone = normalizePhone(order.customer_phone);
      const orderEmail = normalizeEmail(order.customer_email);
      return (
        (phone && orderPhone === phone) ||
        (email && orderEmail === email)
      );
    });

    const reservations = ((reservationsResult.data ?? []) as Array<{
      id: string;
      status: string;
      reservation_date: string;
      reservation_time: string;
      guests: number;
      created_at: string;
      mobile_number: string | null;
      email: string | null;
    }>).filter((reservation) => {
      const reservationPhone = normalizePhone(reservation.mobile_number);
      const reservationEmail = normalizeEmail(reservation.email);
      return (
        (phone && reservationPhone === phone) ||
        (email && reservationEmail === email)
      );
    });

    const whatsappEvents = (
      (activityResult.data ?? []) as Array<{
        id: string;
        action: string;
        new_values: Record<string, unknown> | null;
        created_at: string;
        actor_name: string | null;
      }>
    ).map((row) => {
      const preview =
        typeof row.new_values?.message_preview === "string"
          ? row.new_values.message_preview
          : "";
      const by = row.actor_name?.trim() || "Staff";
      return {
        id: `whatsapp-${row.id}`,
        type: "whatsapp" as const,
        title: "WhatsApp Opened",
        description: preview
          ? `${by} · ${preview.slice(0, 80)}${preview.length > 80 ? "…" : ""}`
          : `Opened by ${by}`,
        at: row.created_at,
        meta: {
          campaignId: row.new_values?.campaign_id ?? null,
        },
      };
    });

    const timeline: CustomerTimelineItem[] = [
      ...orders.map((order) => ({
        id: `order-${order.id}`,
        type: "order" as const,
        title: `Order ${order.order_number}`,
        description: `${order.status} · ${Number(order.grand_total).toFixed(3)} ${order.currency || "KWD"}`,
        at: order.created_at,
        meta: { orderId: order.id, status: order.status },
      })),
      ...reservations.map((reservation) => ({
        id: `reservation-${reservation.id}`,
        type: "reservation" as const,
        title: "Reservation",
        description: `${reservation.status} · ${reservation.guests} guests · ${reservation.reservation_date} ${reservation.reservation_time}`,
        at: reservation.created_at,
        meta: { reservationId: reservation.id, status: reservation.status },
      })),
      ...whatsappEvents,
    ].sort((a, b) => b.at.localeCompare(a.at));

    return { ok: true, data: timeline };
  } catch {
    return { ok: false, message: "Unable to load customer timeline." };
  }
}

export async function fetchCustomerOrders(
  restaurantId: string,
  customer: Customer,
): Promise<
  | {
      ok: true;
      data: Array<{
        id: string;
        orderNumber: string;
        status: string;
        grandTotal: number;
        currency: string;
        createdAt: string;
      }>;
    }
  | { ok: false; message: string }
> {
  try {
    const phone = normalizePhone(customer.phone);
    const email = normalizeEmail(customer.email);
    if (!phone && !email) {
      return { ok: true, data: [] };
    }

    // Prefer identity filters to avoid loading unrelated restaurant orders.
    let query = supabase
      .from("orders")
      .select(
        "id, order_number, status, grand_total, currency, created_at, customer_phone, customer_email",
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(40);

    if (phone && email) {
      const phoneLiteral = `"${phone.replace(/"/g, "")}"`;
      const emailLiteral = `"${email.replace(/"/g, "")}"`;
      query = query.or(
        `customer_phone.eq.${phoneLiteral},customer_email.eq.${emailLiteral}`,
      );
    } else if (phone) {
      query = query.eq("customer_phone", phone);
    } else if (email) {
      query = query.eq("customer_email", email);
    }

    const { data, error } = await query;
    if (error) return { ok: false, message: error.message };

    const rows = ((data ?? []) as Array<{
      id: string;
      order_number: string;
      status: string;
      grand_total: number | string;
      currency: string;
      created_at: string;
      customer_phone: string | null;
      customer_email: string | null;
    }>)
      .filter((order) => {
        const orderPhone = normalizePhone(order.customer_phone);
        const orderEmail = normalizeEmail(order.customer_email);
        return (
          (phone && orderPhone === phone) || (email && orderEmail === email)
        );
      })
      .map((order) => ({
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        grandTotal: Number(order.grand_total ?? 0),
        currency: order.currency || "KWD",
        createdAt: order.created_at,
      }));

    return { ok: true, data: rows };
  } catch {
    return { ok: false, message: "Unable to load customer orders." };
  }
}

export async function fetchCustomerReservations(
  restaurantId: string,
  customer: Customer,
): Promise<
  | {
      ok: true;
      data: Array<{
        id: string;
        status: string;
        reservationDate: string;
        reservationTime: string;
        guests: number;
        createdAt: string;
      }>;
    }
  | { ok: false; message: string }
> {
  try {
    const phone = normalizePhone(customer.phone);
    const email = normalizeEmail(customer.email);
    const { data, error } = await supabase
      .from("reservations")
      .select(
        "id, status, reservation_date, reservation_time, guests, created_at, mobile_number, email",
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return { ok: false, message: error.message };

    const rows = ((data ?? []) as Array<{
      id: string;
      status: string;
      reservation_date: string;
      reservation_time: string;
      guests: number;
      created_at: string;
      mobile_number: string | null;
      email: string | null;
    }>)
      .filter((reservation) => {
        const reservationPhone = normalizePhone(reservation.mobile_number);
        const reservationEmail = normalizeEmail(reservation.email);
        return (
          (phone && reservationPhone === phone) ||
          (email && reservationEmail === email)
        );
      })
      .map((reservation) => ({
        id: reservation.id,
        status: reservation.status,
        reservationDate: reservation.reservation_date,
        reservationTime: reservation.reservation_time,
        guests: reservation.guests,
        createdAt: reservation.created_at,
      }));

    return { ok: true, data: rows };
  } catch {
    return { ok: false, message: "Unable to load customer reservations." };
  }
}

export function formatCustomerMoney(amount: number, currency = "KWD"): string {
  const prefix = currency === "KWD" ? "KD" : currency;
  return `${prefix} ${amount.toLocaleString("en-KW", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })}`;
}

export function paginateCustomers<T>(
  items: T[],
  page: number,
  pageSize: number,
): { pageItems: T[]; totalPages: number; page: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalPages,
    page: safePage,
  };
}
