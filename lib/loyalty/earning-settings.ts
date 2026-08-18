import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/admin/activity-log";
import { resolveLoyaltyAccess } from "@/lib/loyalty/access";
import {
  DEFAULT_LOYALTY_EARNING_RULES,
  parseLoyaltyEarningSettings,
  serializeLoyaltyEarningRules,
  validateLoyaltyEarningRulesInput,
  type LoyaltyEarningRules,
  type LoyaltyEarningSettings,
} from "@/lib/loyalty/earning-rules";
import { updateWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import { supabase } from "@/lib/supabase";

type RestaurantEarningRow = {
  loyalty_earning_settings?: unknown;
};

export async function fetchLoyaltyEarningSettings(
  restaurantId: string,
  client: SupabaseClient = supabase,
): Promise<
  | { ok: true; data: LoyaltyEarningSettings }
  | { ok: false; message: string }
> {
  try {
    const { data, error } = await client
      .from("restaurants")
      .select("loyalty_earning_settings")
      .eq("id", restaurantId)
      .maybeSingle();

    if (error) {
      if (error.code === "42703" || error.message.includes("does not exist")) {
        return {
          ok: true,
          data: { ...DEFAULT_LOYALTY_EARNING_RULES, isCustom: false },
        };
      }
      return { ok: false, message: error.message };
    }

    return {
      ok: true,
      data: parseLoyaltyEarningSettings(
        (data as RestaurantEarningRow | null)?.loyalty_earning_settings,
      ),
    };
  } catch {
    return { ok: false, message: "Unable to load loyalty earning settings." };
  }
}

export async function updateLoyaltyEarningSettings(input: {
  restaurantId: string;
  pointsPerCurrencyUnit: unknown;
  minimumSpend: unknown;
  calculationBasis: unknown;
  maxPointsPerOrder: unknown;
  actorUserId?: string | null;
  client?: SupabaseClient;
}): Promise<
  | { ok: true; data: LoyaltyEarningSettings }
  | { ok: false; message: string; errors?: Record<string, string> }
> {
  const client = input.client ?? supabase;

  try {
    const access = await resolveLoyaltyAccess(
      client,
      input.restaurantId,
      input.actorUserId,
    );
    if (!access.ok) {
      return { ok: false, message: access.message };
    }

    const validation = validateLoyaltyEarningRulesInput({
      pointsPerCurrencyUnit: input.pointsPerCurrencyUnit,
      minimumSpend: input.minimumSpend,
      calculationBasis: input.calculationBasis,
      maxPointsPerOrder: input.maxPointsPerOrder,
    });
    if (!validation.ok) {
      return {
        ok: false,
        message: "Please fix the highlighted fields.",
        errors: validation.errors,
      };
    }

    const previousResult = await fetchLoyaltyEarningSettings(
      input.restaurantId,
      client,
    );
    const previous = previousResult.ok
      ? previousResult.data
      : { ...DEFAULT_LOYALTY_EARNING_RULES, isCustom: false };

    const payload = serializeLoyaltyEarningRules(validation.data);
    const result = await updateWithColumnFallback(
      "restaurants",
      { id: input.restaurantId },
      { loyalty_earning_settings: payload },
    );

    if (!result.ok) {
      return {
        ok: false,
        message:
          result.message === "NO_COLUMNS_AVAILABLE"
            ? "Loyalty earning settings are not available yet. Apply the latest database migration."
            : result.message,
      };
    }

    void logActivity({
      action: "loyalty_earning_rule_updated",
      restaurantId: input.restaurantId,
      actorId: input.actorUserId ?? undefined,
      entityType: "restaurant",
      entityId: input.restaurantId,
      oldValues: toActivitySnapshot(previous),
      newValues: toActivitySnapshot({ ...validation.data, isCustom: true }),
      client,
    });

    return {
      ok: true,
      data: { ...validation.data, isCustom: true },
    };
  } catch {
    return { ok: false, message: "Unable to save loyalty earning settings." };
  }
}

export async function resetLoyaltyEarningSettings(input: {
  restaurantId: string;
  actorUserId?: string | null;
  client?: SupabaseClient;
}): Promise<
  | { ok: true; data: LoyaltyEarningSettings }
  | { ok: false; message: string }
> {
  const client = input.client ?? supabase;

  try {
    const access = await resolveLoyaltyAccess(
      client,
      input.restaurantId,
      input.actorUserId,
    );
    if (!access.ok) {
      return { ok: false, message: access.message };
    }

    const previousResult = await fetchLoyaltyEarningSettings(
      input.restaurantId,
      client,
    );
    const previous = previousResult.ok
      ? previousResult.data
      : { ...DEFAULT_LOYALTY_EARNING_RULES, isCustom: false };

    const result = await updateWithColumnFallback(
      "restaurants",
      { id: input.restaurantId },
      { loyalty_earning_settings: null },
    );

    if (!result.ok) {
      return {
        ok: false,
        message:
          result.message === "NO_COLUMNS_AVAILABLE"
            ? "Loyalty earning settings are not available yet. Apply the latest database migration."
            : result.message,
      };
    }

    void logActivity({
      action: "loyalty_earning_rule_updated",
      restaurantId: input.restaurantId,
      actorId: input.actorUserId ?? undefined,
      entityType: "restaurant",
      entityId: input.restaurantId,
      oldValues: toActivitySnapshot(previous),
      newValues: toActivitySnapshot({
        ...DEFAULT_LOYALTY_EARNING_RULES,
        isCustom: false,
      }),
      client,
    });

    return {
      ok: true,
      data: { ...DEFAULT_LOYALTY_EARNING_RULES, isCustom: false },
    };
  } catch {
    return { ok: false, message: "Unable to reset loyalty earning settings." };
  }
}

function toActivitySnapshot(settings: LoyaltyEarningRules & { isCustom?: boolean }) {
  return {
    is_custom: settings.isCustom ?? true,
    points_per_currency_unit: settings.pointsPerCurrencyUnit,
    minimum_spend: settings.minimumSpend,
    calculation_basis: settings.calculationBasis,
    max_points_per_order: settings.maxPointsPerOrder,
  };
}

/** Server order path — resolves rules from restaurant row or defaults. */
export function resolveLoyaltyEarningRulesFromRestaurant(
  stored: unknown,
): LoyaltyEarningRules {
  return parseLoyaltyEarningSettings(stored);
}
