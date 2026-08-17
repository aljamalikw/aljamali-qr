import type { SupabaseClient } from "@supabase/supabase-js";
import { logActivity } from "@/lib/admin/activity-log";
import { resolveLoyaltyAccess } from "@/lib/loyalty/access";
import { supabase } from "@/lib/supabase";

/**
 * Adjust loyalty points for a restaurant customer.
 * Enforces planAllowsLoyalty (admins bypass). Never trust the browser alone.
 */
export async function adjustLoyaltyPoints(input: {
  restaurantId: string;
  customerId: string;
  delta: number;
  reason?: string;
  actorUserId?: string | null;
  client?: SupabaseClient;
}): Promise<
  | { ok: true; loyaltyPoints: number }
  | { ok: false; message: string; status?: number }
> {
  const client = input.client ?? supabase;

  try {
    const access = await resolveLoyaltyAccess(
      client,
      input.restaurantId,
      input.actorUserId,
    );
    if (!access.ok) {
      return { ok: false, message: access.message, status: 403 };
    }

    const { data: existing, error: fetchError } = await client
      .from("customers")
      .select("id, restaurant_id, loyalty_points, metadata")
      .eq("id", input.customerId)
      .eq("restaurant_id", input.restaurantId)
      .maybeSingle();

    if (fetchError || !existing) {
      return {
        ok: false,
        message: fetchError?.message || "Customer not found.",
        status: 404,
      };
    }

    const previous = Number(
      (existing as { loyalty_points?: number }).loyalty_points ?? 0,
    );
    const delta = Math.trunc(input.delta);
    const next = Math.max(0, previous + delta);
    if (delta < 0 && previous + delta < 0) {
      return {
        ok: false,
        message: "Insufficient loyalty points.",
        status: 400,
      };
    }
    const metadata =
      existing.metadata &&
      typeof existing.metadata === "object" &&
      !Array.isArray(existing.metadata)
        ? { ...(existing.metadata as Record<string, unknown>) }
        : {};
    const loyaltyMeta =
      metadata.loyalty &&
      typeof metadata.loyalty === "object" &&
      !Array.isArray(metadata.loyalty)
        ? { ...(metadata.loyalty as Record<string, unknown>) }
        : {};
    const lifetime = Number(loyaltyMeta.lifetimePoints ?? previous);
    loyaltyMeta.lifetimePoints = delta > 0 ? lifetime + delta : lifetime;
    metadata.loyalty = loyaltyMeta;

    // Optimistic lock on current balance to reduce double-spend races.
    let query = client
      .from("customers")
      .update({
        loyalty_points: next,
        metadata,
      })
      .eq("id", input.customerId)
      .eq("restaurant_id", input.restaurantId)
      .eq("loyalty_points", previous);

    const { data, error } = await query.select("loyalty_points").maybeSingle();

    if (error || !data) {
      return {
        ok: false,
        message:
          error?.message ||
          "Unable to update loyalty points. Please try again.",
        status: 400,
      };
    }

    void logActivity({
      action: "loyalty_points_adjusted",
      restaurantId: input.restaurantId,
      actorId: input.actorUserId,
      entityType: "customer",
      entityId: input.customerId,
      oldValues: { loyalty_points: previous },
      newValues: { loyalty_points: next, reason: input.reason ?? null },
      client,
    });

    return {
      ok: true,
      loyaltyPoints: Number(
        (data as { loyalty_points?: number }).loyalty_points ?? next,
      ),
    };
  } catch {
    return { ok: false, message: "Unable to update loyalty points.", status: 500 };
  }
}
