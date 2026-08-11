import { logActivity } from "@/lib/admin/activity-log";
import { TOTAL_ONBOARDING_STEPS } from "@/lib/onboarding/constants";
import {
  mergeCompletedSteps,
  parseCompletedSteps,
} from "@/lib/onboarding/progress";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import type { Restaurant } from "@/lib/restaurants/types";
import { supabase } from "@/lib/supabase";

const ERROR = "We couldn't save your progress. Please try again.";

export type AdvanceOnboardingInput = {
  /** Step the user is moving to (1–11). */
  nextStep: number;
  /** Step just finished or skipped. */
  completedStep?: number;
  skipped?: boolean;
  restaurantId?: string;
  extra?: Record<string, unknown>;
};

async function resolveRestaurant(restaurantId?: string) {
  if (restaurantId) {
    const { data } = await supabase
      .from("restaurants")
      .select("*")
      .eq("id", restaurantId)
      .maybeSingle();
    return (data as Restaurant | null) ?? null;
  }
  return fetchUserRestaurant();
}

/**
 * Advances onboarding progress for the active (or specified) restaurant.
 * Updates current_step, completed_steps, and last_updated. Autosaves safely.
 */
export async function advanceOnboardingProgress(
  input: AdvanceOnboardingInput,
): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  try {
    const restaurant = await resolveRestaurant(input.restaurantId);
    if (!restaurant?.id) {
      return { ok: false, message: ERROR };
    }

    const nextStep = Math.min(
      Math.max(input.nextStep, 1),
      TOTAL_ONBOARDING_STEPS,
    );
    const completedSteps = input.completedStep
      ? mergeCompletedSteps(
          parseCompletedSteps(restaurant.onboarding_completed_steps),
          input.completedStep,
        )
      : parseCompletedSteps(restaurant.onboarding_completed_steps);

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("restaurants")
      .update({
        onboarding_step: nextStep,
        onboarding_completed_steps: completedSteps,
        onboarding_last_updated: now,
        ...(input.extra ?? {}),
      })
      .eq("id", restaurant.id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: ERROR };
    }

    if (input.completedStep) {
      void logActivity({
        action: input.skipped
          ? "onboarding_step_skipped"
          : "onboarding_step_completed",
        restaurantId: restaurant.id,
        restaurantName: restaurant.restaurant_name,
        ownerId: restaurant.owner_id,
        entityType: "restaurant",
        entityId: restaurant.id,
        newValues: {
          step: input.completedStep,
          nextStep,
          completedSteps,
        },
      });
    }

    return { ok: true, restaurant: data as Restaurant };
  } catch {
    return { ok: false, message: ERROR };
  }
}

/** Marks wizard finished for this restaurant only. */
export async function completeOnboarding(
  restaurantId?: string,
): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  try {
    const restaurant = await resolveRestaurant(restaurantId);
    if (!restaurant?.id) {
      return { ok: false, message: ERROR };
    }

    const completedSteps = mergeCompletedSteps(
      parseCompletedSteps(restaurant.onboarding_completed_steps),
      TOTAL_ONBOARDING_STEPS,
    );
    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from("restaurants")
      .update({
        onboarding_completed: true,
        onboarding_step: TOTAL_ONBOARDING_STEPS,
        onboarding_completed_steps: completedSteps,
        onboarding_completed_at: now,
        onboarding_last_updated: now,
      })
      .eq("id", restaurant.id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: ERROR };
    }

    void logActivity({
      action: "onboarding_finished",
      restaurantId: restaurant.id,
      restaurantName: restaurant.restaurant_name,
      ownerId: restaurant.owner_id,
      entityType: "restaurant",
      entityId: restaurant.id,
      newValues: { completedSteps, completedAt: now },
    });

    return { ok: true, restaurant: data as Restaurant };
  } catch {
    return { ok: false, message: ERROR };
  }
}

/** Resets onboarding so owners/admins can run the Setup Wizard again. */
export async function restartOnboarding(
  restaurantId?: string,
): Promise<
  { ok: true; restaurant: Restaurant } | { ok: false; message: string }
> {
  try {
    const restaurant = await resolveRestaurant(restaurantId);
    if (!restaurant?.id) {
      return { ok: false, message: ERROR };
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("restaurants")
      .update({
        onboarding_completed: false,
        onboarding_step: 1,
        onboarding_completed_steps: [],
        onboarding_completed_at: null,
        onboarding_last_updated: now,
      })
      .eq("id", restaurant.id)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: ERROR };
    }

    void logActivity({
      action: "onboarding_restarted",
      restaurantId: restaurant.id,
      restaurantName: restaurant.restaurant_name,
      ownerId: restaurant.owner_id,
      entityType: "restaurant",
      entityId: restaurant.id,
      newValues: { restartedAt: now },
    });

    return { ok: true, restaurant: data as Restaurant };
  } catch {
    return { ok: false, message: ERROR };
  }
}

export async function logOnboardingStarted(
  restaurant: Restaurant,
): Promise<void> {
  const steps = parseCompletedSteps(restaurant.onboarding_completed_steps);
  if (steps.length > 0 || (restaurant.onboarding_step ?? 1) > 1) return;

  void logActivity({
    action: "onboarding_started",
    restaurantId: restaurant.id,
    restaurantName: restaurant.restaurant_name,
    ownerId: restaurant.owner_id,
    entityType: "restaurant",
    entityId: restaurant.id,
    newValues: { step: 1 },
  });
}
