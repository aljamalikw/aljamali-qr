import { supabase } from "@/lib/supabase";
import {
  ensureRestaurantSubscription,
  updateSubscription,
  type SubscriptionPlan,
} from "@/lib/admin/subscriptions";
import { buildCsv } from "@/lib/utils/csv";
import type { Restaurant } from "@/lib/restaurants/types";

export const RESTAURANT_STATUS_FILTERS = [
  "active",
  "suspended",
  "incomplete",
] as const;
export type RestaurantStatusFilter = (typeof RESTAURANT_STATUS_FILTERS)[number];

const ERROR = "Unable to update restaurant. Please try again.";

export async function setRestaurantActive(
  restaurantId: string,
  isActive: boolean,
): Promise<{ ok: true; data: Restaurant } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .update({ is_active: isActive })
      .eq("id", restaurantId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    return { ok: true, data: data as Restaurant };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function changeRestaurantPlan(
  restaurantId: string,
  plan: SubscriptionPlan,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const ensured = await ensureRestaurantSubscription(restaurantId, plan);
    if (!ensured.ok) return ensured;

    const updated = await updateSubscription({
      id: ensured.data.id,
      restaurantId,
      plan,
      status: "active",
    });

    if (!updated.ok) return updated;
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export function getRestaurantStatusFilter(
  restaurant: Restaurant,
): RestaurantStatusFilter {
  if (restaurant.is_active === false) return "suspended";
  if (restaurant.restaurant_name?.trim()) return "active";
  return "incomplete";
}

export async function bulkSetRestaurantsActive(
  restaurantIds: string[],
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase
      .from("restaurants")
      .update({ is_active: isActive })
      .in("id", restaurantIds);

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export function exportRestaurantsToCsv(items: Restaurant[]): string {
  const headers = [
    "Restaurant",
    "Owner Email",
    "Phone",
    "Plan",
    "Status",
    "City",
    "Created",
  ];

  const rows = items.map((restaurant) => [
    restaurant.restaurant_name?.trim() || "Unnamed restaurant",
    restaurant.email ?? "",
    restaurant.phone ?? "",
    restaurant.subscription_plan ?? "Starter",
    getRestaurantStatusFilter(restaurant),
    restaurant.city ?? "",
    restaurant.created_at,
  ]);

  return buildCsv(headers, rows);
}
