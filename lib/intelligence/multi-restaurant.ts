import type { MultiRestaurantRow } from "@/lib/intelligence/types";
import { resolveIntelligenceRange, type IntelligenceRangeId } from "@/lib/intelligence/ranges";
import { supabase } from "@/lib/supabase";

/**
 * Aggregate BI across restaurants owned by the current user (Enterprise).
 */
export async function fetchMultiRestaurantAnalytics(input: {
  restaurantIds: string[];
  rangeId?: IntelligenceRangeId;
  customStart?: string | null;
  customEnd?: string | null;
}): Promise<
  | {
      ok: true;
      data: {
        rows: MultiRestaurantRow[];
        ranking: {
          bestPerforming: string | null;
          highestRevenue: string | null;
          highestOrders: string | null;
          highestReturning: string | null;
          highestRating: string | null;
        };
      };
    }
  | { ok: false; message: string }
> {
  try {
    const ids = input.restaurantIds.filter(Boolean);
    if (ids.length === 0) {
      return {
        ok: true,
        data: {
          rows: [],
          ranking: {
            bestPerforming: null,
            highestRevenue: null,
            highestOrders: null,
            highestReturning: null,
            highestRating: null,
          },
        },
      };
    }

    const range = resolveIntelligenceRange(
      input.rangeId ?? "30d",
      input.customStart,
      input.customEnd,
    );

    const [
      restaurantsResult,
      ordersResult,
      reservationsResult,
      customersResult,
      campaignsResult,
      reviewsResult,
    ] = await Promise.all([
      supabase
        .from("restaurants")
        .select("id, restaurant_name")
        .in("id", ids),
      supabase
        .from("orders")
        .select("restaurant_id, status, grand_total, created_at")
        .in("restaurant_id", ids)
        .gte("created_at", range.start.toISOString())
        .lte("created_at", range.end.toISOString())
        .limit(10000),
      supabase
        .from("reservations")
        .select("restaurant_id, status, created_at")
        .in("restaurant_id", ids)
        .gte("created_at", range.start.toISOString())
        .limit(5000),
      supabase
        .from("customers")
        .select("restaurant_id, total_orders, loyalty_points, metadata")
        .in("restaurant_id", ids)
        .limit(10000),
      supabase
        .from("marketing_campaigns")
        .select("restaurant_id, created_at")
        .in("restaurant_id", ids)
        .gte("created_at", range.start.toISOString())
        .limit(2000),
      supabase
        .from("restaurant_reviews")
        .select("restaurant_id, rating")
        .in("restaurant_id", ids)
        .limit(5000),
    ]);

    if (restaurantsResult.error) {
      return {
        ok: false,
        message: restaurantsResult.error.message || "Unable to load analytics.",
      };
    }

    const nameById = new Map(
      ((restaurantsResult.data ?? []) as Array<{
        id: string;
        restaurant_name: string | null;
      }>).map((r) => [r.id, r.restaurant_name?.trim() || "Restaurant"]),
    );

    const rows: MultiRestaurantRow[] = ids.map((id) => ({
      restaurantId: id,
      restaurantName: nameById.get(id) ?? "Restaurant",
      revenue: 0,
      orders: 0,
      reservations: 0,
      customers: 0,
      loyaltyMembers: 0,
      campaigns: 0,
      averageRating: null,
      reviewCount: 0,
    }));
    const byId = new Map(rows.map((r) => [r.restaurantId, r]));

    for (const o of (ordersResult.data ?? []) as Array<{
      restaurant_id: string;
      status: string;
      grand_total: number | string;
    }>) {
      const row = byId.get(o.restaurant_id);
      if (!row || o.status === "Cancelled") continue;
      row.orders += 1;
      row.revenue += Number(o.grand_total ?? 0) || 0;
    }

    for (const r of (reservationsResult.data ?? []) as Array<{
      restaurant_id: string;
    }>) {
      const row = byId.get(r.restaurant_id);
      if (row) row.reservations += 1;
    }

    for (const c of (customersResult.data ?? []) as Array<{
      restaurant_id: string;
      total_orders: number;
      loyalty_points: number;
      metadata: Record<string, unknown> | null;
    }>) {
      const row = byId.get(c.restaurant_id);
      if (!row) continue;
      row.customers += 1;
      const loyalty =
        c.metadata?.loyalty && typeof c.metadata.loyalty === "object"
          ? (c.metadata.loyalty as Record<string, unknown>)
          : {};
      if (loyalty.enrolled === true || Number(c.loyalty_points) > 0) {
        row.loyaltyMembers += 1;
      }
    }

    for (const c of (campaignsResult.data ?? []) as Array<{
      restaurant_id: string;
    }>) {
      const row = byId.get(c.restaurant_id);
      if (row) row.campaigns += 1;
    }

    const ratingSum = new Map<string, { sum: number; count: number }>();
    for (const rev of (reviewsResult.data ?? []) as Array<{
      restaurant_id: string;
      rating: number;
    }>) {
      const cur = ratingSum.get(rev.restaurant_id) ?? { sum: 0, count: 0 };
      cur.sum += Number(rev.rating) || 0;
      cur.count += 1;
      ratingSum.set(rev.restaurant_id, cur);
    }
    for (const [id, stats] of ratingSum) {
      const row = byId.get(id);
      if (!row || stats.count === 0) continue;
      row.reviewCount = stats.count;
      row.averageRating = Math.round((stats.sum / stats.count) * 10) / 10;
    }

    const sorted = [...rows];
    const topBy = (
      score: (r: MultiRestaurantRow) => number,
    ): string | null => {
      if (sorted.length === 0) return null;
      return [...sorted].sort((a, b) => score(b) - score(a))[0]?.restaurantName ?? null;
    };

    return {
      ok: true,
      data: {
        rows,
        ranking: {
          bestPerforming: topBy(
            (r) => r.revenue + r.orders * 2 + (r.averageRating ?? 0) * 10,
          ),
          highestRevenue: topBy((r) => r.revenue),
          highestOrders: topBy((r) => r.orders),
          highestReturning: topBy((r) => r.loyaltyMembers),
          highestRating: topBy((r) => r.averageRating ?? 0),
        },
      },
    };
  } catch {
    return { ok: false, message: "Unable to load multi-restaurant analytics." };
  }
}
