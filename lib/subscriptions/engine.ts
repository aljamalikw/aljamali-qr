import type { DashboardNavId } from "@/lib/dashboard/types";

export type SubscriptionPlan = "Starter" | "Professional" | "Enterprise";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "grace"
  | "suspended"
  | "expired"
  | "cancelled";

export const DEFAULT_TRIAL_DAYS = 7;
export const DEFAULT_GRACE_PERIOD_DAYS = 3;
export { DEFAULT_TRIAL_PLAN } from "@/lib/subscriptions/plans";

export type SubscriptionAccess = {
  effectiveStatus: SubscriptionStatus;
  /** Owner subscription plan (billing, restaurant limits). */
  plan: SubscriptionPlan;
  /**
   * Plan used for this restaurant's features and public menu.
   * Uncovered restaurants resolve to Starter while the owner plan stays paid.
   */
  locationPlan: SubscriptionPlan;
  locationCovered: boolean;
  publicMenuOnline: boolean;
  dashboardLocked: boolean;
  allowedNavIds: DashboardNavId[];
  inGrace: boolean;
  trialDaysLeft: number | null;
  graceDaysLeft: number | null;
  message: string | null;
};

export type SubscriptionEngineInput = {
  plan: SubscriptionPlan | string | null | undefined;
  status: SubscriptionStatus | string | null | undefined;
  trialStartedAt?: string | null;
  trialEndsAt?: string | null;
  gracePeriodDays?: number | null;
  renewalDate?: string | null;
  cancelledAt?: string | null;
};

/** Pages that stay reachable after a paid subscription lapses. */
const ESSENTIAL_NAV: DashboardNavId[] = [
  "dashboard",
  "settings",
  "subscription",
  "support",
  "setup-wizard",
];

function asPlan(value: string | null | undefined): SubscriptionPlan {
  if (value === "Professional" || value === "Enterprise" || value === "Starter") {
    return value;
  }
  return "Starter";
}

function asStatus(value: string | null | undefined): SubscriptionStatus {
  if (
    value === "trial" ||
    value === "active" ||
    value === "grace" ||
    value === "suspended" ||
    value === "expired" ||
    value === "cancelled"
  ) {
    return value;
  }
  return "trial";
}

function endOfDayUtc(dateIso: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateIso)) {
    return new Date(`${dateIso}T23:59:59.999Z`);
  }
  return new Date(dateIso);
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * 86400000);
}

function daysRemaining(until: Date, now: Date): number {
  const diff = until.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / 86400000));
}

/**
 * Resolve lifecycle status from stored fields.
 * - cancelled / expired stay sticky (admin or previously resolved)
 * - active uses renewal_date + grace
 * - trial / grace advance from the relevant end date + grace
 */
export function resolveEffectiveStatus(
  input: SubscriptionEngineInput,
  now: Date = new Date(),
): SubscriptionStatus {
  const stored = asStatus(input.status);
  const graceDays =
    typeof input.gracePeriodDays === "number" && input.gracePeriodDays >= 0
      ? input.gracePeriodDays
      : DEFAULT_GRACE_PERIOD_DAYS;

  // Sticky terminal / admin states — only manual or payment flows revive these.
  if (
    stored === "cancelled" ||
    stored === "expired" ||
    stored === "suspended"
  ) {
    return stored;
  }

  if (stored === "active") {
    if (!input.renewalDate) return "active";
    const renewalEnd = endOfDayUtc(input.renewalDate);
    if (now.getTime() <= renewalEnd.getTime()) return "active";
    const graceEnd = addDays(renewalEnd, graceDays);
    if (now.getTime() <= graceEnd.getTime()) return "grace";
    return "expired";
  }

  // trial or grace: advance from trial end, or renewal end when post-paid grace
  const baseIso =
    stored === "grace" && input.renewalDate
      ? input.renewalDate
      : (input.trialEndsAt ?? input.renewalDate ?? null);

  if (!baseIso) {
    return stored === "grace" ? "grace" : "trial";
  }

  const baseEnd = endOfDayUtc(baseIso);

  if (stored === "trial" && now.getTime() <= baseEnd.getTime()) {
    return "trial";
  }

  // After the base end (or already in grace), evaluate grace window
  if (now.getTime() <= baseEnd.getTime()) {
    // grace row whose renewal was extended back into the future
    return stored === "grace" ? "active" : "trial";
  }

  const graceEnd = addDays(baseEnd, graceDays);
  if (now.getTime() <= graceEnd.getTime()) return "grace";
  // After grace: suspended (auto) — restaurant access should be revoked by sync.
  return "suspended";
}

/** Trial, paid-active, and the short grace window still unlock plan features. */
export function isEntitledSubscriptionStatus(
  status: SubscriptionStatus,
): boolean {
  return status === "trial" || status === "active" || status === "grace";
}

/** Computed status after a Professional (or any) trial + grace ends unpaid. */
export function isExpiredTrialStatus(status: SubscriptionStatus): boolean {
  return status === "suspended";
}

/**
 * Plan used for feature gates and public Pro capabilities.
 * After trial/subscription lapse, leftover Professional/Enterprise names
 * must not keep unlocking paid features.
 */
export function resolveFeaturePlan(
  plan: string | null | undefined,
  status: SubscriptionStatus,
): SubscriptionPlan {
  if (!isEntitledSubscriptionStatus(status)) return "Starter";
  return asPlan(plan);
}

export function getSubscriptionAccess(
  input: SubscriptionEngineInput,
  now: Date = new Date(),
): SubscriptionAccess {
  const plan = asPlan(input.plan);
  const effectiveStatus = resolveEffectiveStatus(input, now);
  const graceDays =
    typeof input.gracePeriodDays === "number" && input.gracePeriodDays >= 0
      ? input.gracePeriodDays
      : DEFAULT_GRACE_PERIOD_DAYS;

  const trialEndIso = input.trialEndsAt ?? input.renewalDate ?? null;
  const trialEnd = trialEndIso ? endOfDayUtc(trialEndIso) : null;
  const renewalEnd = input.renewalDate ? endOfDayUtc(input.renewalDate) : null;

  let trialDaysLeft: number | null = null;
  let graceDaysLeft: number | null = null;
  let message: string | null = null;

  if (effectiveStatus === "trial" && trialEnd) {
    trialDaysLeft = daysRemaining(trialEnd, now);
    message =
      trialDaysLeft === 0
        ? `Your ${plan} trial ends today.`
        : `${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left in your ${plan} free trial.`;
  }

  if (effectiveStatus === "grace") {
    const baseEnd =
      asStatus(input.status) === "active" && renewalEnd ? renewalEnd : trialEnd;
    if (baseEnd) {
      const graceEnd = addDays(baseEnd, graceDays);
      graceDaysLeft = daysRemaining(graceEnd, now);
      message =
        graceDaysLeft === 0
          ? "Your grace period ends today. Renew to avoid feature locks."
          : `${graceDaysLeft} day${graceDaysLeft === 1 ? "" : "s"} left in your grace period.`;
    }
  }

  if (effectiveStatus === "suspended") {
    message =
      "Your Professional trial has ended. Choose Starter or Professional to continue — you will not be charged automatically.";
  }

  if (effectiveStatus === "expired") {
    message =
      plan === "Starter"
        ? "Your subscription has expired. Choose a plan to restore full access."
        : "Your subscription has expired. Professional features are locked until you renew.";
  }

  if (effectiveStatus === "cancelled") {
    message =
      plan === "Starter"
        ? "Your subscription is cancelled. Choose a plan to restore full access."
        : "Your subscription is cancelled. Professional features are locked until you renew.";
  }

  const inGoodStanding =
    effectiveStatus === "trial" || effectiveStatus === "active";
  const inGrace = effectiveStatus === "grace";

  // Trial/active/grace: full entitled dashboard.
  // Expired trial (`suspended`): keep Starter-level dashboard + public menu;
  // Professional features stay gated by locationPlan = Starter.
  // Paid lapse (`expired`/`cancelled`): essential pages only.
  let publicMenuOnline = true;
  let dashboardLocked = false;

  if (!inGoodStanding && !inGrace) {
    if (effectiveStatus === "suspended") {
      dashboardLocked = false;
      publicMenuOnline = true;
    } else {
      dashboardLocked = true;
      publicMenuOnline = plan !== "Starter";
    }
  }

  return {
    effectiveStatus,
    plan,
    locationPlan: resolveFeaturePlan(plan, effectiveStatus),
    locationCovered: true,
    publicMenuOnline,
    dashboardLocked,
    allowedNavIds: dashboardLocked ? ESSENTIAL_NAV : [],
    inGrace,
    trialDaysLeft,
    graceDaysLeft,
    message,
  };
}

export function isNavAllowed(
  access: SubscriptionAccess,
  navId: DashboardNavId,
): boolean {
  if (!access.dashboardLocked) return true;
  return access.allowedNavIds.includes(navId);
}

export function trialWindowIso(now: Date = new Date()): {
  trialStartedAt: string;
  trialEndsAt: string;
  renewalDate: string;
} {
  const trialEnds = addDays(now, DEFAULT_TRIAL_DAYS);
  return {
    trialStartedAt: now.toISOString(),
    trialEndsAt: trialEnds.toISOString(),
    renewalDate: trialEnds.toISOString().slice(0, 10),
  };
}
