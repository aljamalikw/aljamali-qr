import { supabase } from "@/lib/supabase";
import { logActivity, logAdminActivity } from "@/lib/admin/activity-log";
import {
  ensureRestaurantSubscription,
  updateSubscription,
  type SubscriptionPlan,
} from "@/lib/admin/subscriptions";
import {
  computeRestaurantManagementKpis,
  deriveRestaurantManagementStatus,
  RESTAURANT_STATUS_FILTERS,
  type RestaurantManagementKpis,
  type RestaurantStatusFilter,
} from "@/lib/admin/restaurant-status";
import {
  firstNonEmpty,
  groupItemsByOwnerId,
  pickPrimaryByPlan,
  sortOwnerRowsByName,
} from "@/lib/admin/group-by-owner";
import { planAllowsLoyalty } from "@/lib/subscriptions/plans";
import { buildCsv } from "@/lib/utils/csv";
import type { Restaurant } from "@/lib/restaurants/types";

export { RESTAURANT_STATUS_FILTERS };
export type { RestaurantStatusFilter, RestaurantManagementKpis };

export type AdminRestaurantManagementRow = {
  id: string;
  ownerId: string;
  restaurantName: string | null;
  ownerName: string | null;
  email: string | null;
  phone: string | null;
  plan: string;
  status: RestaurantStatusFilter;
  createdAt: string;
  trialEndsAt: string | null;
  trialStartedAt: string | null;
  renewalDate: string | null;
  gracePeriodDays: number | null;
  subscriptionStatus: string | null;
  monthlyPrice: number;
  activeQrCodes: number;
  isActive: boolean;
  isArchived: boolean;
  city: string | null;
  slug: string | null;
  logoUrl: string | null;
  raw: Restaurant;
};

/** Owner-grouped restaurant management row for the admin list. */
export type OwnerRestaurantManagementGroup = {
  ownerId: string;
  ownerName: string | null;
  email: string | null;
  plan: string;
  restaurantCount: number;
  restaurants: AdminRestaurantManagementRow[];
};

export type RestaurantEditInput = {
  restaurantName: string;
  ownerName: string;
  email: string;
  phone: string;
  city: string;
  plan: SubscriptionPlan;
};

const ERROR = "Unable to update restaurant. Please try again.";
const DELETE_ERROR =
  "Unable to permanently delete restaurant. Please try again.";

type SubscriptionEmbed = {
  plan?: string | null;
  trial_ends_at?: string | null;
  trial_started_at?: string | null;
  status?: string | null;
  renewal_date?: string | null;
  grace_period_days?: number | null;
  cancelled_at?: string | null;
  monthly_price?: number | string | null;
};

type QrEmbed = {
  id: string;
  is_active?: boolean | null;
  is_archived?: boolean | null;
};

type RestaurantManagementRow = Restaurant & {
  restaurant_subscriptions?: SubscriptionEmbed | SubscriptionEmbed[] | null;
  qr_codes?: QrEmbed[] | null;
};

function asArray<T>(value: T | T[] | null | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

/** @deprecated Prefer deriveRestaurantManagementStatus */
export function getRestaurantStatusFilter(
  restaurant: Pick<Restaurant, "is_active" | "is_archived" | "restaurant_name">,
): RestaurantStatusFilter {
  return deriveRestaurantManagementStatus({
    isActive: restaurant.is_active !== false,
    isArchived: Boolean(restaurant.is_archived),
    restaurantName: restaurant.restaurant_name,
  });
}

function mapManagementRow(
  row: RestaurantManagementRow,
): AdminRestaurantManagementRow {
  const subscriptions = asArray(row.restaurant_subscriptions);
  const primarySub = subscriptions[0] ?? null;
  const qrCodes = asArray(row.qr_codes);
  const activeQrCodes = qrCodes.filter(
    (qr) => qr.is_active !== false && qr.is_archived !== true,
  ).length;

  const isActive = row.is_active !== false;
  const isArchived = Boolean(row.is_archived);

  return {
    id: row.id,
    ownerId: row.owner_id,
    restaurantName: row.restaurant_name,
    ownerName: row.owner_name ?? null,
    email: row.email,
    phone: row.phone,
    plan: primarySub?.plan ?? row.subscription_plan ?? "Starter",
    status: deriveRestaurantManagementStatus({
      isActive,
      isArchived,
      restaurantName: row.restaurant_name,
      subscriptionStatus: primarySub?.status,
      trialEndsAt: primarySub?.trial_ends_at,
      trialStartedAt: primarySub?.trial_started_at,
      gracePeriodDays: primarySub?.grace_period_days,
      renewalDate: primarySub?.renewal_date,
      cancelledAt: primarySub?.cancelled_at,
      plan: primarySub?.plan ?? row.subscription_plan,
    }),
    createdAt: row.created_at,
    trialEndsAt: primarySub?.trial_ends_at ?? null,
    trialStartedAt: primarySub?.trial_started_at ?? null,
    renewalDate: primarySub?.renewal_date ?? null,
    gracePeriodDays:
      typeof primarySub?.grace_period_days === "number"
        ? primarySub.grace_period_days
        : null,
    subscriptionStatus: primarySub?.status ?? null,
    monthlyPrice: Number(primarySub?.monthly_price ?? 0),
    activeQrCodes,
    isActive,
    isArchived,
    city: row.city ?? null,
    slug: row.slug ?? null,
    logoUrl: row.logo_url ?? null,
    raw: row,
  };
}

export async function fetchAdminRestaurantManagementRows(): Promise<
  | { ok: true; data: AdminRestaurantManagementRow[] }
  | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select(
        "*, restaurant_subscriptions(plan, trial_ends_at, trial_started_at, status, renewal_date, grace_period_days, cancelled_at, monthly_price), qr_codes(id, is_active, is_archived)",
      )
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      data: ((data ?? []) as RestaurantManagementRow[]).map(mapManagementRow),
    };
  } catch {
    return { ok: false, message: "Unable to load restaurants." };
  }
}

/** Owner-scoped restaurant management rows (avoids loading the full platform). */
export async function fetchAdminRestaurantsByOwnerId(
  ownerId: string,
): Promise<
  | { ok: true; data: AdminRestaurantManagementRow[] }
  | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .select(
        "*, restaurant_subscriptions(plan, trial_ends_at, trial_started_at, status, renewal_date, grace_period_days, cancelled_at, monthly_price), qr_codes(id, is_active, is_archived)",
      )
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: true });

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      data: ((data ?? []) as RestaurantManagementRow[]).map(mapManagementRow),
    };
  } catch {
    return { ok: false, message: "Unable to load restaurants." };
  }
}

export function getRestaurantManagementKpis(
  rows: AdminRestaurantManagementRow[],
): RestaurantManagementKpis {
  return computeRestaurantManagementKpis(rows);
}

export function groupRestaurantManagementByOwner(
  rows: AdminRestaurantManagementRow[],
): OwnerRestaurantManagementGroup[] {
  const byOwner = groupItemsByOwnerId(rows);
  const groups: OwnerRestaurantManagementGroup[] = [];

  for (const [ownerId, restaurants] of byOwner) {
    const primary = pickPrimaryByPlan(restaurants, (item) => item.createdAt);
    const sorted = [...restaurants].sort((a, b) =>
      (a.restaurantName ?? "").localeCompare(b.restaurantName ?? ""),
    );

    groups.push({
      ownerId,
      ownerName: firstNonEmpty(...restaurants.map((r) => r.ownerName)),
      email: firstNonEmpty(...restaurants.map((r) => r.email)),
      plan: primary.plan,
      restaurantCount: sorted.length,
      restaurants: sorted,
    });
  }

  return sortOwnerRowsByName(groups);
}

export async function setRestaurantActive(
  restaurantId: string,
  isActive: boolean,
): Promise<{ ok: true; data: Restaurant } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .update({
        is_active: isActive,
        ...(isActive ? { is_archived: false } : {}),
      })
      .eq("id", restaurantId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    const restaurant = data as Restaurant;
    void logActivity({
      action: isActive ? "restaurant_activated" : "restaurant_suspended",
      restaurantId,
      restaurantName: restaurant.restaurant_name,
      ownerId: restaurant.owner_id,
      entityType: "restaurant",
      entityId: restaurantId,
      newValues: { is_active: isActive, is_archived: restaurant.is_archived },
    });

    return { ok: true, data: restaurant };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function setRestaurantArchived(
  restaurantId: string,
  archived: boolean,
): Promise<{ ok: true; data: Restaurant } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .update({
        is_archived: archived,
        ...(archived ? { is_active: false } : {}),
      })
      .eq("id", restaurantId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    const restaurant = data as Restaurant;
    void logActivity({
      action: archived ? "restaurant_archived" : "restaurant_restored",
      restaurantId,
      restaurantName: restaurant.restaurant_name,
      ownerId: restaurant.owner_id,
      entityType: "restaurant",
      entityId: restaurantId,
      newValues: {
        is_archived: archived,
        is_active: restaurant.is_active,
      },
    });

    return { ok: true, data: restaurant };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function updateRestaurantDetails(
  restaurantId: string,
  input: RestaurantEditInput,
): Promise<{ ok: true; data: Restaurant } | { ok: false; message: string }> {
  try {
    const { data, error } = await supabase
      .from("restaurants")
      .update({
        restaurant_name: input.restaurantName.trim() || null,
        owner_name: input.ownerName.trim() || null,
        email: input.email.trim() || null,
        phone: input.phone.trim() || null,
        city: input.city.trim() || null,
        subscription_plan: input.plan,
      })
      .eq("id", restaurantId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? ERROR };
    }

    const restaurant = data as Restaurant;
    await changeRestaurantPlan(restaurantId, input.plan);

    void logActivity({
      action: "restaurant_updated",
      restaurantId,
      restaurantName: restaurant.restaurant_name,
      ownerId: restaurant.owner_id,
      entityType: "restaurant",
      entityId: restaurantId,
      newValues: {
        restaurant_name: input.restaurantName,
        owner_name: input.ownerName,
        email: input.email,
        phone: input.phone,
        city: input.city,
        plan: input.plan,
      },
    });

    return { ok: true, data: restaurant };
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

    const previousPlan = ensured.data.plan;
    const updated = await updateSubscription({
      id: ensured.data.id,
      restaurantId,
      plan,
      status: "active",
    });

    if (!updated.ok) return updated;

    const rank: Record<string, number> = {
      Starter: 1,
      Professional: 2,
      Enterprise: 3,
    };
    const action =
      (rank[plan] ?? 0) < (rank[previousPlan] ?? 0)
        ? "plan_downgraded"
        : "plan_upgraded";

    if (previousPlan !== plan) {
      void logAdminActivity({
        action,
        restaurantId,
        entityType: "subscription",
        entityId: ensured.data.id,
        oldValues: { plan: previousPlan },
        newValues: { plan },
      });

      const loyaltyWasOn = planAllowsLoyalty(previousPlan);
      const loyaltyNowOn = planAllowsLoyalty(plan);
      if (!loyaltyWasOn && loyaltyNowOn) {
        void logAdminActivity({
          action: "loyalty_enabled",
          restaurantId,
          entityType: "subscription",
          entityId: ensured.data.id,
          oldValues: { plan: previousPlan, loyalty: false },
          newValues: { plan, loyalty: true },
        });
      } else if (loyaltyWasOn && !loyaltyNowOn) {
        void logAdminActivity({
          action: "loyalty_disabled",
          restaurantId,
          entityType: "subscription",
          entityId: ensured.data.id,
          oldValues: { plan: previousPlan, loyalty: true },
          newValues: { plan, loyalty: false },
        });
      }
    }

    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function permanentlyDeleteRestaurant(
  restaurantId: string,
  confirmName: string,
  currentUserId: string | null,
  ownerId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (currentUserId && ownerId === currentUserId) {
    return {
      ok: false,
      message: "You cannot permanently delete your own restaurant.",
    };
  }

  try {
    const { error } = await supabase.rpc("admin_delete_restaurant_permanently", {
      p_restaurant_id: restaurantId,
      p_confirm_name: confirmName.trim(),
    });

    if (error) {
      return { ok: false, message: error.message || DELETE_ERROR };
    }

    void logActivity({
      action: "restaurant_deleted",
      restaurantId,
      ownerId,
      entityType: "restaurant",
      entityId: restaurantId,
      metadata: { confirmName: confirmName.trim() },
    });

    return { ok: true };
  } catch {
    return { ok: false, message: DELETE_ERROR };
  }
}

export async function bulkSetRestaurantsActive(
  restaurantIds: string[],
  isActive: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const { error } = await supabase
      .from("restaurants")
      .update({
        is_active: isActive,
        ...(isActive ? { is_archived: false } : {}),
      })
      .in("id", restaurantIds);

    if (error) return { ok: false, message: error.message || ERROR };
    return { ok: true };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export function exportRestaurantsToCsv(
  items: AdminRestaurantManagementRow[],
): string {
  const headers = [
    "Restaurant",
    "Owner",
    "Email",
    "Plan",
    "Status",
    "Created",
    "Trial Ends",
    "Active QR Codes",
  ];

  const rows = items.map((restaurant) => [
    restaurant.restaurantName?.trim() || "Unnamed restaurant",
    restaurant.ownerName ?? "",
    restaurant.email ?? "",
    restaurant.plan,
    restaurant.status,
    restaurant.createdAt,
    restaurant.trialEndsAt ?? "",
    String(restaurant.activeQrCodes),
  ]);

  return buildCsv(headers, rows);
}
