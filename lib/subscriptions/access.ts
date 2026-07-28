import type { SubscriptionPlan, SubscriptionStatus } from "./engine";
import {
  getSubscriptionAccess,
  resolveEffectiveStatus,
  type SubscriptionAccess,
  type SubscriptionEngineInput,
} from "./engine";

export type SubscriptionRowLike = {
  id?: string;
  plan: SubscriptionPlan | string;
  status: SubscriptionStatus | string;
  trial_started_at?: string | null;
  trial_ends_at?: string | null;
  grace_period_days?: number | null;
  renewal_date?: string | null;
  cancelled_at?: string | null;
};

export function toEngineInput(row: SubscriptionRowLike): SubscriptionEngineInput {
  return {
    plan: row.plan,
    status: row.status,
    trialStartedAt: row.trial_started_at,
    trialEndsAt: row.trial_ends_at,
    gracePeriodDays: row.grace_period_days,
    renewalDate: row.renewal_date,
    cancelledAt: row.cancelled_at,
  };
}

export function accessFromSubscriptionRow(
  row: SubscriptionRowLike | null | undefined,
  fallbackPlan: SubscriptionPlan | string = "Starter",
): SubscriptionAccess {
  if (!row) {
    return getSubscriptionAccess({
      plan: fallbackPlan,
      status: "expired",
      trialEndsAt: null,
      gracePeriodDays: 3,
    });
  }
  return getSubscriptionAccess(toEngineInput(row));
}

export function effectiveStatusFromRow(
  row: SubscriptionRowLike,
): SubscriptionStatus {
  return resolveEffectiveStatus(toEngineInput(row));
}

export type { SubscriptionAccess, SubscriptionPlan, SubscriptionStatus };
