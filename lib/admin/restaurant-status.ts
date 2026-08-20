import { resolveEffectiveStatus } from "@/lib/subscriptions/engine";
import type { SubscriptionStatus } from "@/lib/admin/subscriptions";

export const RESTAURANT_STATUS_FILTERS = [
  "active",
  "trial",
  "suspended",
  "archived",
  "expired",
  "grace",
  "incomplete",
] as const;

export type RestaurantStatusFilter =
  (typeof RESTAURANT_STATUS_FILTERS)[number];

export const STATUS_LABELS: Record<RestaurantStatusFilter, string> = {
  active: "Active",
  trial: "Trial",
  suspended: "Suspended",
  archived: "Archived",
  expired: "Expired",
  grace: "Grace Period",
  incomplete: "Incomplete",
};

export const STATUS_BADGE_CLASSES: Record<RestaurantStatusFilter, string> = {
  active: "border-emerald-500/35 bg-emerald-500/10 text-emerald-300",
  trial: "border-sky-500/35 bg-sky-500/10 text-sky-300",
  suspended: "border-red-500/35 bg-red-500/10 text-red-300",
  archived: "border-white/20 bg-white/5 text-white/50",
  expired: "border-orange-500/35 bg-orange-500/10 text-orange-300",
  grace: "border-amber-500/35 bg-amber-500/10 text-amber-300",
  incomplete: "border-white/15 bg-white/[0.04] text-white/45",
};

export type RestaurantStatusBadgeProps = {
  status: RestaurantStatusFilter;
  className?: string;
};

export function deriveRestaurantManagementStatus(input: {
  isActive: boolean;
  isArchived: boolean;
  restaurantName: string | null | undefined;
  subscriptionStatus?: string | null;
  trialEndsAt?: string | null;
  trialStartedAt?: string | null;
  gracePeriodDays?: number | null;
  renewalDate?: string | null;
  cancelledAt?: string | null;
  plan?: string | null;
}): RestaurantStatusFilter {
  if (input.isArchived) return "archived";
  if (!input.isActive) return "suspended";
  if (!input.restaurantName?.trim()) return "incomplete";

  const effective = resolveEffectiveStatus({
    plan: input.plan,
    status: input.subscriptionStatus as SubscriptionStatus | null,
    trialStartedAt: input.trialStartedAt,
    trialEndsAt: input.trialEndsAt,
    gracePeriodDays: input.gracePeriodDays,
    renewalDate: input.renewalDate,
    cancelledAt: input.cancelledAt,
  });

  if (effective === "trial") return "trial";
  if (effective === "grace") return "grace";
  if (effective === "suspended") return "suspended";
  if (effective === "expired" || effective === "cancelled") return "expired";
  return "active";
}

export function formatTrialCountdown(trialEndsAt: string | null | undefined): {
  dateLabel: string;
  remainingLabel: string | null;
} {
  if (!trialEndsAt) {
    return { dateLabel: "—", remainingLabel: null };
  }

  const end = new Date(trialEndsAt);
  if (Number.isNaN(end.getTime())) {
    return { dateLabel: "—", remainingLabel: null };
  }

  const dateLabel = end.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const now = new Date();
  const msPerDay = 86400000;
  const days = Math.ceil((end.getTime() - now.getTime()) / msPerDay);

  if (days < 0) {
    const ago = Math.abs(days);
    return {
      dateLabel,
      remainingLabel: `Expired ${ago} day${ago === 1 ? "" : "s"} ago`,
    };
  }
  if (days === 0) {
    return { dateLabel, remainingLabel: "Ends today" };
  }
  return {
    dateLabel,
    remainingLabel: `${days} day${days === 1 ? "" : "s"} remaining`,
  };
}

export type RestaurantManagementKpis = {
  restaurants: number;
  active: number;
  trial: number;
  suspended: number;
  archived: number;
  expired: number;
  mrr: number;
  totalQrCodes: number;
};

export function computeRestaurantManagementKpis(
  rows: Array<{
    status: RestaurantStatusFilter;
    activeQrCodes: number;
    monthlyPrice?: number;
    subscriptionStatus?: string | null;
    isBillingPrimary?: boolean;
  }>,
): RestaurantManagementKpis {
  const kpis: RestaurantManagementKpis = {
    restaurants: rows.length,
    active: 0,
    trial: 0,
    suspended: 0,
    archived: 0,
    expired: 0,
    mrr: 0,
    totalQrCodes: 0,
  };

  for (const row of rows) {
    kpis.totalQrCodes += row.activeQrCodes;
    if (row.status === "active") kpis.active += 1;
    if (row.status === "trial") kpis.trial += 1;
    if (row.status === "suspended") kpis.suspended += 1;
    if (row.status === "archived") kpis.archived += 1;
    if (row.status === "expired") kpis.expired += 1;
    if (
      row.isBillingPrimary &&
      (row.subscriptionStatus === "active" ||
        row.subscriptionStatus === "grace")
    ) {
      kpis.mrr += row.monthlyPrice ?? 0;
    }
  }

  return kpis;
}
