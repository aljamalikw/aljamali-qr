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
import {
  buildEffectiveOwnerSubscription,
  resolveCanonicalEffectiveStatus,
  type OwnerRestaurantRef,
  type OwnerSubscriptionDbRow,
} from "@/lib/subscriptions/owner-subscription";
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
  /** Location plan (owner plan when covered, Starter when not). */
  plan: string;
  /** Owner-level billed plan. */
  ownerPlan: string;
  status: RestaurantStatusFilter;
  createdAt: string;
  /** Effective owner lifecycle end (trial or current period). */
  trialEndsAt: string | null;
  trialStartedAt: string | null;
  /** Stored restaurant-row trial; informational only. */
  historicalTrialEndsAt: string | null;
  renewalDate: string | null;
  gracePeriodDays: number | null;
  subscriptionStatus: string | null;
  monthlyPrice: number;
  currency: string;
  activeQrCodes: number;
  isActive: boolean;
  isArchived: boolean;
  isCovered: boolean;
  isBillingPrimary: boolean;
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
  monthlyPrice: number;
  currency: string;
  subscriptionStatus: string | null;
  renewalDate: string | null;
  restaurantCount: number;
  coveredCount: number;
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
  id?: string | null;
  restaurant_id?: string | null;
  plan?: string | null;
  trial_ends_at?: string | null;
  trial_started_at?: string | null;
  status?: string | null;
  renewal_date?: string | null;
  grace_period_days?: number | null;
  cancelled_at?: string | null;
  started_at?: string | null;
  monthly_price?: number | string | null;
  currency?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  is_covered?: boolean | null;
};

const SUB_EMBED_SELECT =
  "id, restaurant_id, plan, monthly_price, currency, status, renewal_date, started_at, cancelled_at, trial_started_at, trial_ends_at, grace_period_days, created_at, updated_at, is_covered";
const SUB_EMBED_SELECT_LEGACY =
  "id, restaurant_id, plan, monthly_price, currency, status, renewal_date, started_at, cancelled_at, trial_started_at, trial_ends_at, grace_period_days, created_at, updated_at";

function embedToDbRow(
  restaurantId: string,
  embed: SubscriptionEmbed | null,
): OwnerSubscriptionDbRow | null {
  if (!embed) return null;
  return {
    id: embed.id ?? `sub-${restaurantId}`,
    restaurant_id: embed.restaurant_id ?? restaurantId,
    plan: embed.plan ?? "Starter",
    monthly_price: embed.monthly_price ?? 0,
    currency: embed.currency ?? "KWD",
    status: embed.status ?? "trial",
    renewal_date: embed.renewal_date ?? null,
    started_at: embed.started_at ?? null,
    cancelled_at: embed.cancelled_at ?? null,
    trial_started_at: embed.trial_started_at ?? null,
    trial_ends_at: embed.trial_ends_at ?? null,
    grace_period_days:
      typeof embed.grace_period_days === "number" ? embed.grace_period_days : null,
    created_at: embed.created_at ?? null,
    updated_at: embed.updated_at ?? null,
    is_covered: embed.is_covered,
  };
}

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
  const plan = primarySub?.plan ?? row.subscription_plan ?? "Starter";

  return {
    id: row.id,
    ownerId: row.owner_id,
    restaurantName: row.restaurant_name,
    ownerName: row.owner_name ?? null,
    email: row.email,
    phone: row.phone,
    plan,
    ownerPlan: plan,
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
      plan,
    }),
    createdAt: row.created_at,
    trialEndsAt: primarySub?.trial_ends_at ?? null,
    trialStartedAt: primarySub?.trial_started_at ?? null,
    historicalTrialEndsAt: primarySub?.trial_ends_at ?? null,
    renewalDate: primarySub?.renewal_date ?? null,
    gracePeriodDays:
      typeof primarySub?.grace_period_days === "number"
        ? primarySub.grace_period_days
        : null,
    subscriptionStatus: primarySub?.status ?? null,
    monthlyPrice: Number(primarySub?.monthly_price ?? 0),
    currency: primarySub?.currency || "KWD",
    activeQrCodes,
    isActive,
    isArchived,
    isCovered: primarySub?.is_covered !== false,
    isBillingPrimary: false,
    city: row.city ?? null,
    slug: row.slug ?? null,
    logoUrl: row.logo_url ?? null,
    raw: row,
  };
}

function overlayOwnerSubscriptionOnManagementRows(
  rows: AdminRestaurantManagementRow[],
): AdminRestaurantManagementRow[] {
  const byOwner = groupItemsByOwnerId(rows);
  const overlaid: AdminRestaurantManagementRow[] = [];

  for (const [ownerId, ownerRows] of byOwner) {
    const refs: OwnerRestaurantRef[] = ownerRows.map((row) => ({
      id: row.id,
      owner_id: ownerId,
      created_at: row.createdAt,
      restaurant_name: row.restaurantName,
    }));
    const subscriptions = ownerRows
      .map((row) =>
        embedToDbRow(
          row.id,
          asArray(
            (row.raw as RestaurantManagementRow).restaurant_subscriptions,
          )[0] ?? null,
        ),
      )
      .filter((item): item is OwnerSubscriptionDbRow => Boolean(item));

    const effective = buildEffectiveOwnerSubscription(
      ownerId,
      refs,
      subscriptions,
    );

    if (!effective) {
      overlaid.push(
        ...ownerRows.map((row) => ({
          ...row,
          historicalTrialEndsAt: row.historicalTrialEndsAt ?? row.trialEndsAt,
        })),
      );
      continue;
    }

    const canonicalStatus = resolveCanonicalEffectiveStatus(effective.canonical);

    for (const row of ownerRows) {
      const covered = effective.coveredRestaurantIds.includes(row.id);
      const locationPlan = covered ? effective.ownerPlan : "Starter";
      const storedTrial =
        asArray((row.raw as RestaurantManagementRow).restaurant_subscriptions)[0]
          ?.trial_ends_at ?? row.historicalTrialEndsAt;

      overlaid.push({
        ...row,
        ownerPlan: effective.ownerPlan,
        plan: locationPlan,
        isCovered: covered,
        isBillingPrimary: row.id === effective.canonical.restaurant_id,
        monthlyPrice: Number(effective.canonical.monthly_price ?? 0),
        currency: effective.canonical.currency || row.currency || "KWD",
        trialEndsAt: effective.canonical.trial_ends_at,
        trialStartedAt: effective.canonical.trial_started_at,
        historicalTrialEndsAt: storedTrial ?? null,
        renewalDate: effective.canonical.renewal_date,
        gracePeriodDays:
          typeof effective.canonical.grace_period_days === "number"
            ? effective.canonical.grace_period_days
            : row.gracePeriodDays,
        subscriptionStatus: canonicalStatus,
        status: deriveRestaurantManagementStatus({
          isActive: row.isActive,
          isArchived: row.isArchived,
          restaurantName: row.restaurantName,
          subscriptionStatus: canonicalStatus,
          trialEndsAt: effective.canonical.trial_ends_at,
          trialStartedAt: effective.canonical.trial_started_at,
          gracePeriodDays: effective.canonical.grace_period_days,
          renewalDate: effective.canonical.renewal_date,
          cancelledAt: effective.canonical.cancelled_at,
          plan: locationPlan,
        }),
      });
    }
  }

  return overlaid;
}

async function loadRestaurantManagementQuery(ownerId?: string) {
  const selectWithCoverage = `*, restaurant_subscriptions(${SUB_EMBED_SELECT}), qr_codes(id, is_active, is_archived)`;
  const selectLegacy = `*, restaurant_subscriptions(${SUB_EMBED_SELECT_LEGACY}), qr_codes(id, is_active, is_archived)`;

  let query = supabase
    .from("restaurants")
    .select(selectWithCoverage)
    .order("created_at", { ascending: Boolean(ownerId) });
  if (ownerId) query = query.eq("owner_id", ownerId);

  const withCoverage = await query;
  if (!withCoverage.error) return withCoverage;

  let fallback = supabase
    .from("restaurants")
    .select(selectLegacy)
    .order("created_at", { ascending: Boolean(ownerId) });
  if (ownerId) fallback = fallback.eq("owner_id", ownerId);
  return fallback;
}

export async function fetchAdminRestaurantManagementRows(): Promise<
  | { ok: true; data: AdminRestaurantManagementRow[] }
  | { ok: false; message: string }
> {
  try {
    const { data, error } = await loadRestaurantManagementQuery();

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      data: overlayOwnerSubscriptionOnManagementRows(
        ((data ?? []) as RestaurantManagementRow[]).map(mapManagementRow),
      ),
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
    const { data, error } = await loadRestaurantManagementQuery(ownerId);

    if (error) {
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      data: overlayOwnerSubscriptionOnManagementRows(
        ((data ?? []) as RestaurantManagementRow[]).map(mapManagementRow),
      ),
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
    const billing =
      restaurants.find((item) => item.isBillingPrimary) ??
      pickPrimaryByPlan(restaurants, (item) => item.createdAt);
    const sorted = [...restaurants].sort((a, b) =>
      (a.restaurantName ?? "").localeCompare(b.restaurantName ?? ""),
    );

    groups.push({
      ownerId,
      ownerName: firstNonEmpty(...restaurants.map((r) => r.ownerName)),
      email: firstNonEmpty(...restaurants.map((r) => r.email)),
      plan: billing.ownerPlan || billing.plan,
      monthlyPrice: billing.monthlyPrice,
      currency: billing.currency || "KWD",
      subscriptionStatus: billing.subscriptionStatus,
      renewalDate: billing.renewalDate,
      restaurantCount: sorted.length,
      coveredCount: sorted.filter((item) => item.isCovered).length,
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
    "Coverage",
    "Renewal",
    "Historical Trial Ends",
    "Active QR Codes",
  ];

  const rows = items.map((restaurant) => [
    restaurant.restaurantName?.trim() || "Unnamed restaurant",
    restaurant.ownerName ?? "",
    restaurant.email ?? "",
    restaurant.ownerPlan || restaurant.plan,
    restaurant.status,
    restaurant.createdAt,
    restaurant.isCovered ? "Covered" : "Not covered",
    restaurant.renewalDate ?? "",
    restaurant.historicalTrialEndsAt ?? "",
    String(restaurant.activeQrCodes),
  ]);

  return buildCsv(headers, rows);
}
