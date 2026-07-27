import { supabase } from "@/lib/supabase";
import { buildCsv } from "@/lib/utils/csv";

export const SUBSCRIPTION_PLANS = [
  "Starter",
  "Professional",
  "Enterprise",
] as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[number];

export const SUBSCRIPTION_STATUSES = [
  "trial",
  "active",
  "expired",
  "cancelled",
] as const;

export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export type RestaurantSubscription = {
  id: string;
  restaurantId: string;
  restaurantName: string | null;
  restaurantEmail: string | null;
  plan: SubscriptionPlan;
  monthlyPrice: number;
  currency: string;
  status: SubscriptionStatus;
  renewalDate: string | null;
  startedAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  isActiveRestaurant: boolean;
};

export const PLAN_PRICES: Record<SubscriptionPlan, number> = {
  Starter: 19,
  Professional: 49,
  Enterprise: 99,
};

type SubscriptionRow = {
  id: string;
  restaurant_id: string;
  plan: SubscriptionPlan;
  monthly_price: number | string;
  currency: string;
  status: SubscriptionStatus;
  renewal_date: string | null;
  started_at: string;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  restaurants:
    | {
        restaurant_name: string | null;
        email: string | null;
        is_active: boolean | null;
      }
    | {
        restaurant_name: string | null;
        email: string | null;
        is_active: boolean | null;
      }[]
    | null;
};

const ERROR = "Unable to load subscriptions. Please try again.";

function restaurantFromJoin(row: SubscriptionRow) {
  if (Array.isArray(row.restaurants)) return row.restaurants[0] ?? null;
  return row.restaurants;
}

function mapRow(row: SubscriptionRow): RestaurantSubscription {
  const restaurant = restaurantFromJoin(row);
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    restaurantName: restaurant?.restaurant_name ?? null,
    restaurantEmail: restaurant?.email ?? null,
    plan: row.plan,
    monthlyPrice: Number(row.monthly_price ?? 0),
    currency: row.currency || "KWD",
    status: row.status,
    renewalDate: row.renewal_date,
    startedAt: row.started_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isActiveRestaurant: Boolean(restaurant?.is_active ?? true),
  };
}

export async function fetchSubscriptions(): Promise<
  { ok: true; data: RestaurantSubscription[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("restaurant_subscriptions")
      .select(
        "*, restaurants(restaurant_name, email, is_active)",
      )
      .order("updated_at", { ascending: false });

    if (error) return { ok: false, message: error.message || ERROR };
    return {
      ok: true,
      data: ((data ?? []) as SubscriptionRow[]).map(mapRow),
    };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function fetchOwnerSubscription(
  restaurantId: string,
): Promise<
  { ok: true; data: RestaurantSubscription | null } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("restaurant_subscriptions")
      .select("*, restaurants(restaurant_name, email, is_active)")
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (error) return { ok: false, message: error.message || ERROR };
    if (!data) return { ok: true, data: null };
    return { ok: true, data: mapRow(data as SubscriptionRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function updateSubscription(params: {
  id: string;
  restaurantId: string;
  plan?: SubscriptionPlan;
  status?: SubscriptionStatus;
  monthlyPrice?: number;
  renewalDate?: string | null;
}): Promise<
  { ok: true; data: RestaurantSubscription } | { ok: false; message: string }
> {
  try {
    const plan = params.plan;
    const monthlyPrice =
      params.monthlyPrice ??
      (plan ? PLAN_PRICES[plan] : undefined);

    const payload: Record<string, unknown> = {};
    if (plan) payload.plan = plan;
    if (params.status) {
      payload.status = params.status;
      payload.cancelled_at =
        params.status === "cancelled" ? new Date().toISOString() : null;
    }
    if (monthlyPrice !== undefined) payload.monthly_price = monthlyPrice;
    if (params.renewalDate !== undefined) {
      payload.renewal_date = params.renewalDate;
    }

    const { data, error } = await supabase
      .from("restaurant_subscriptions")
      .update(payload)
      .eq("id", params.id)
      .select("*, restaurants(restaurant_name, email, is_active)")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    if (plan) {
      await supabase
        .from("restaurants")
        .update({ subscription_plan: plan })
        .eq("id", params.restaurantId);
    }

    return { ok: true, data: mapRow(data as SubscriptionRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function ensureRestaurantSubscription(
  restaurantId: string,
  plan: SubscriptionPlan = "Starter",
): Promise<
  { ok: true; data: RestaurantSubscription } | { ok: false; message: string }
> {
  try {
    const existing = await fetchOwnerSubscription(restaurantId);
    if (!existing.ok) return existing;
    if (existing.data) return { ok: true, data: existing.data };

    const { data, error } = await supabase
      .from("restaurant_subscriptions")
      .insert({
        restaurant_id: restaurantId,
        plan,
        monthly_price: PLAN_PRICES[plan],
        currency: "KWD",
        status: "trial",
        renewal_date: new Date(Date.now() + 30 * 86400000)
          .toISOString()
          .slice(0, 10),
      })
      .select("*, restaurants(restaurant_name, email, is_active)")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    await supabase
      .from("restaurants")
      .update({ subscription_plan: plan })
      .eq("id", restaurantId);

    return { ok: true, data: mapRow(data as SubscriptionRow) };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function bulkUpdateSubscriptionStatus(
  ids: string[],
  status: SubscriptionStatus,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const payload: Record<string, unknown> = { status };
    payload.cancelled_at =
      status === "cancelled" ? new Date().toISOString() : null;

    const { error } = await supabase
      .from("restaurant_subscriptions")
      .update(payload)
      .in("id", ids);

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export function exportSubscriptionsToCsv(
  items: RestaurantSubscription[],
): string {
  const headers = [
    "Restaurant",
    "Email",
    "Plan",
    "Price",
    "Currency",
    "Status",
    "Renewal",
    "Started",
  ];

  const rows = items.map((item) => [
    item.restaurantName?.trim() || "Unnamed restaurant",
    item.restaurantEmail ?? "",
    item.plan,
    String(item.monthlyPrice),
    item.currency,
    item.status,
    item.renewalDate ?? "",
    item.startedAt,
  ]);

  return buildCsv(headers, rows);
}
