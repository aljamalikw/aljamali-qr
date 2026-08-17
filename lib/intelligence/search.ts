import type { GlobalSearchResult } from "@/lib/intelligence/types";
import { supabase } from "@/lib/supabase";

/** Escape `%` / `_` for ILIKE and strip PostgREST `.or()` delimiters. */
function buildIlikePattern(query: string): string {
  const cleaned = query
    .trim()
    .replace(/[%_*,()]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return `%${cleaned}%`;
}

/**
 * Global dashboard search across menu items, categories, customers, orders,
 * reservations, campaigns, rewards, and (optionally) sibling restaurants.
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
    const like = buildIlikePattern(q);
    if (like === "%%") return { ok: true, data: [] };

    const restaurantIds = Array.from(
      new Set([input.restaurantId, ...(input.siblingRestaurantIds ?? [])]),
    );

    const [
      menuItems,
      categories,
      customers,
      orders,
      reservations,
      campaigns,
      rewards,
      restaurants,
    ] = await Promise.all([
      supabase
        .from("menu_items")
        .select("id, name, price, is_available, is_archived, deleted_at")
        .eq("restaurant_id", input.restaurantId)
        .ilike("name", like)
        .limit(12),
      supabase
        .from("categories")
        .select("id, name, is_active")
        .eq("restaurant_id", input.restaurantId)
        .ilike("name", like)
        .limit(8),
      supabase
        .from("customers")
        .select("id, full_name, phone, email")
        .eq("restaurant_id", input.restaurantId)
        .or(`full_name.ilike.${like},phone.ilike.${like},email.ilike.${like}`)
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

    const queryErrors = [
      menuItems.error,
      categories.error,
      customers.error,
      orders.error,
      reservations.error,
      campaigns.error,
      rewards.error,
      restaurants.error,
    ].filter(Boolean);

    if (queryErrors.length > 0 && process.env.NODE_ENV !== "production") {
      console.error("[GlobalSearch] one or more entity queries failed", {
        restaurantId: input.restaurantId,
        query: q,
        errors: queryErrors.map((error) => error?.message),
      });
    }

    // Hard failure only when every searchable entity errored (e.g. network).
    const allFailed =
      queryErrors.length > 0 &&
      [
        menuItems,
        categories,
        customers,
        orders,
        reservations,
        campaigns,
        rewards,
        restaurants,
      ].every((result) => Boolean(result.error) || result.data == null);

    if (allFailed) {
      return { ok: false, message: "Search failed. Please try again." };
    }

    const results: GlobalSearchResult[] = [];

    for (const item of menuItems.data ?? []) {
      const row = item as {
        id: string;
        name: string;
        price: number | string | null;
        is_available: boolean | null;
        is_archived?: boolean | null;
        deleted_at?: string | null;
      };
      if (row.deleted_at) continue;

      const price =
        row.price === null || row.price === undefined || row.price === ""
          ? null
          : Number(row.price);
      const statusParts = [
        row.is_archived ? "archived" : row.is_available ? "published" : "draft",
        price !== null && Number.isFinite(price) ? `${price} KWD` : null,
      ].filter(Boolean);

      results.push({
        id: `menu-item-${row.id}`,
        type: "menu_item",
        title: row.name?.trim() || "Menu item",
        subtitle: statusParts.join(" · ") || "Menu item",
        href: `/dashboard/menu-items?edit=${encodeURIComponent(row.id)}`,
      });
    }

    for (const category of categories.data ?? []) {
      const row = category as {
        id: string;
        name: string;
        is_active: boolean | null;
      };
      results.push({
        id: `category-${row.id}`,
        type: "category",
        title: row.name?.trim() || "Category",
        subtitle: row.is_active === false ? "Inactive category" : "Category",
        href: "/dashboard/categories",
      });
    }

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
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.error("[GlobalSearch] unexpected failure", error);
    }
    return { ok: false, message: "Search failed. Please try again." };
  }
}
