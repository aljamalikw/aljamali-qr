import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import {
  resolveEffectiveStatus,
  type SubscriptionStatus,
} from "@/lib/subscriptions/engine";

export type LifecycleSyncResult = {
  scanned: number;
  updated: number;
  suspendedRestaurants: number;
  reactivatedRestaurants: number;
  errors: string[];
};

type SubRow = {
  id: string;
  restaurant_id: string;
  plan: string | null;
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  grace_period_days: number | null;
  renewal_date: string | null;
  cancelled_at: string | null;
};

/**
 * Persist effective subscription statuses and auto-suspend restaurants after grace.
 * Uses the service role so it can run from a cron/API without a user session.
 */
export async function syncAllSubscriptionLifecycles(): Promise<LifecycleSyncResult> {
  const result: LifecycleSyncResult = {
    scanned: 0,
    updated: 0,
    suspendedRestaurants: 0,
    reactivatedRestaurants: 0,
    errors: [],
  };

  const supabase = createServiceSupabaseClient();
  const { data, error } = await supabase
    .from("restaurant_subscriptions")
    .select(
      "id, restaurant_id, plan, status, trial_started_at, trial_ends_at, grace_period_days, renewal_date, cancelled_at",
    );

  if (error) {
    result.errors.push(error.message);
    return result;
  }

  const rows = (data ?? []) as SubRow[];
  result.scanned = rows.length;
  const now = new Date();

  for (const row of rows) {
    try {
      const effective = resolveEffectiveStatus(
        {
          plan: row.plan,
          status: row.status as SubscriptionStatus,
          trialStartedAt: row.trial_started_at,
          trialEndsAt: row.trial_ends_at,
          gracePeriodDays: row.grace_period_days,
          renewalDate: row.renewal_date,
          cancelledAt: row.cancelled_at,
        },
        now,
      );

      if (effective !== row.status) {
        const payload: Record<string, unknown> = { status: effective };
        if (effective === "cancelled") {
          payload.cancelled_at = row.cancelled_at ?? now.toISOString();
        } else {
          payload.cancelled_at = null;
        }

        const { error: updateError } = await supabase
          .from("restaurant_subscriptions")
          .update(payload)
          .eq("id", row.id);

        if (updateError) {
          result.errors.push(`${row.id}: ${updateError.message}`);
          continue;
        }
        result.updated += 1;
      }

      const shouldSuspend =
        effective === "suspended" ||
        effective === "expired" ||
        effective === "cancelled";

      if (shouldSuspend) {
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id, is_active")
          .eq("id", row.restaurant_id)
          .maybeSingle();

        if (restaurant && restaurant.is_active !== false) {
          const { error: suspendError } = await supabase
            .from("restaurants")
            .update({ is_active: false })
            .eq("id", row.restaurant_id);
          if (suspendError) {
            result.errors.push(
              `suspend ${row.restaurant_id}: ${suspendError.message}`,
            );
          } else {
            result.suspendedRestaurants += 1;
          }
        }
      }

      if (effective === "active" || effective === "trial" || effective === "grace") {
        const { data: restaurant } = await supabase
          .from("restaurants")
          .select("id, is_active, is_archived")
          .eq("id", row.restaurant_id)
          .maybeSingle();

        // Only auto-reactivate non-archived restaurants that were soft-suspended by billing.
        if (
          restaurant &&
          restaurant.is_active === false &&
          restaurant.is_archived !== true &&
          (row.status === "suspended" ||
            row.status === "expired" ||
            effective === "active")
        ) {
          // Do not auto-reactivate cancelled → leave admin/payment flows explicit.
          if (effective === "active" || effective === "trial") {
            const { error: reactivateError } = await supabase
              .from("restaurants")
              .update({ is_active: true })
              .eq("id", row.restaurant_id);
            if (reactivateError) {
              result.errors.push(
                `reactivate ${row.restaurant_id}: ${reactivateError.message}`,
              );
            } else {
              result.reactivatedRestaurants += 1;
            }
          }
        }
      }
    } catch (err) {
      result.errors.push(
        `${row.id}: ${err instanceof Error ? err.message : "unknown error"}`,
      );
    }
  }

  return result;
}
