import type { GlobalSearchResult } from "@/lib/intelligence/types";
import { supabase } from "@/lib/supabase";

/**
 * Global dashboard search across customers, orders, reservations,
 * campaigns, rewards, and (optionally) sibling restaurants.
 */
export async function globalIntelligenceSearch(input: {
  restaurantId: string;
  query: string;
  siblingRestaurantIds?: string[];
}): Promise<
  { ok: true; data: GlobalSearchResult[] } | { ok: false; message: string }
> {
  const q = input.query.trim();
  if (q.length < 2) return { ok: true, data: [] };

  try {
    const like = `%${q}%`;
    const restaurantIds = Array.from(
      new Set([input.restaurantId, ...(input.siblingRestaurantIds ?? [])]),
    );

    const [
      customers,
      orders,
      reservations,
      campaigns,
      rewards,
      restaurants,
    ] = await Promise.all([
      supabase
        .from("customers")
        .select("id, full_name, phone, email")
        .eq("restaurant_id", input.restaurantId)
        .or(
          `full_name.ilike.${like},phone.ilike.${like},email.ilike.${like}`,
        )
        .limit(8),
      supabase
        .from("orders")
        .select("id, order_number, customer_name, status")
        .eq("restaurant_id", input.restaurantId)
        .or(
          `order_number.ilike.${like},customer_name.ilike.${like},customer_phone.ilike.${like}`,
        )
        .limit(8),
      supabase
        .from("reservations")
        .select("id, customer_name, mobile_number, status, reservation_date")
        .eq("restaurant_id", input.restaurantId)
        .or(
          `customer_name.ilike.${like},mobile_number.ilike.${like},email.ilike.${like}`,
        )
        .limit(8),
      supabase
        .from("marketing_campaigns")
        .select("id, name, status")
        .eq("restaurant_id", input.restaurantId)
        .ilike("name", like)
        .limit(8),
      supabase
        .from("loyalty_rewards")
        .select("id, title, status, points_required")
        .eq("restaurant_id", input.restaurantId)
        .ilike("title", like)
        .limit(8),
      restaurantIds.length > 1
        ? supabase
            .from("restaurants")
            .select("id, restaurant_name")
            .in("id", restaurantIds)
            .ilike("restaurant_name", like)
            .limit(8)
        : Promise.resolve({ data: [], error: null }),
    ]);

    const results: GlobalSearchResult[] = [];

    for (const c of customers.data ?? []) {
      const row = c as {
        id: string;
        full_name: string | null;
        phone: string | null;
        email: string | null;
      };
      results.push({
        id: `customer-${row.id}`,
        type: "customer",
        title: row.full_name?.trim() || "Customer",
        subtitle: row.phone || row.email || "CRM",
        href: `/dashboard/customers/${row.id}`,
      });
    }

    for (const o of orders.data ?? []) {
      const row = o as {
        id: string;
        order_number: string;
        customer_name: string | null;
        status: string;
      };
      results.push({
        id: `order-${row.id}`,
        type: "order",
        title: `Order ${row.order_number}`,
        subtitle: `${row.status} · ${row.customer_name || "Guest"}`,
        href: "/dashboard/orders",
      });
    }

    for (const r of reservations.data ?? []) {
      const row = r as {
        id: string;
        customer_name: string | null;
        status: string;
        reservation_date: string;
      };
      results.push({
        id: `reservation-${row.id}`,
        type: "reservation",
        title: row.customer_name?.trim() || "Reservation",
        subtitle: `${row.status} · ${row.reservation_date}`,
        href: "/dashboard/reservations",
      });
    }

    for (const c of campaigns.data ?? []) {
      const row = c as { id: string; name: string; status: string };
      results.push({
        id: `campaign-${row.id}`,
        type: "campaign",
        title: row.name,
        subtitle: `Campaign · ${row.status}`,
        href: "/dashboard/marketing",
      });
    }

    for (const reward of rewards.data ?? []) {
      const row = reward as {
        id: string;
        title: string;
        status: string;
        points_required: number;
      };
      results.push({
        id: `reward-${row.id}`,
        type: "reward",
        title: row.title,
        subtitle: `${row.points_required} pts · ${row.status}`,
        href: "/dashboard/loyalty",
      });
    }

    for (const rest of restaurants.data ?? []) {
      const row = rest as { id: string; restaurant_name: string | null };
      results.push({
        id: `restaurant-${row.id}`,
        type: "restaurant",
        title: row.restaurant_name?.trim() || "Restaurant",
        subtitle: "Restaurant",
        href: "/dashboard",
      });
    }

    return { ok: true, data: results.slice(0, 24) };
  } catch {
    return { ok: false, message: "Search failed." };
  }
}
