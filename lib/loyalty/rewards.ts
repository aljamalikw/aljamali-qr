import { logActivity } from "@/lib/admin/activity-log";
import { resolveLoyaltyAccess } from "@/lib/loyalty/access";
import { adjustLoyaltyPoints } from "@/lib/loyalty/mutations";
import {
  getMaxLoyaltyRewards,
  planAllowsUnlimitedRewards,
} from "@/lib/subscriptions/plans";
import { supabase } from "@/lib/supabase";

export type RewardStatus = "active" | "inactive";
export type RewardType =
  | "free_item"
  | "discount"
  | "coupon"
  | "gift"
  | "manual";
export type RedemptionStatus =
  | "available"
  | "redeemed"
  | "expired"
  | "cancelled";

export type LoyaltyReward = {
  id: string;
  restaurantId: string;
  title: string;
  description: string;
  pointsRequired: number;
  imageUrl: string | null;
  status: RewardStatus;
  rewardType: RewardType;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type LoyaltyRedemption = {
  id: string;
  restaurantId: string;
  rewardId: string;
  customerId: string;
  pointsSpent: number;
  status: RedemptionStatus;
  redeemedAt: string | null;
  expiresAt: string | null;
  notes: string | null;
  createdAt: string;
  rewardTitle?: string;
  customerName?: string | null;
};

type RewardRecord = {
  id: string;
  restaurant_id: string;
  title: string;
  description: string;
  points_required: number;
  image_url: string | null;
  status: string;
  reward_type: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

function mapReward(row: RewardRecord): LoyaltyReward {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    title: row.title,
    description: row.description ?? "",
    pointsRequired: Number(row.points_required ?? 0),
    imageUrl: row.image_url,
    status: (row.status as RewardStatus) || "active",
    rewardType: (row.reward_type as RewardType) || "free_item",
    metadata: row.metadata ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchLoyaltyRewards(
  restaurantId: string,
): Promise<
  { ok: true; data: LoyaltyReward[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("loyalty_rewards")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("points_required", { ascending: true });

    if (error) return { ok: false, message: error.message };
    return {
      ok: true,
      data: ((data ?? []) as RewardRecord[]).map(mapReward),
    };
  } catch {
    return { ok: false, message: "Unable to load rewards." };
  }
}

export async function createLoyaltyReward(input: {
  restaurantId: string;
  title: string;
  description?: string;
  pointsRequired: number;
  imageUrl?: string | null;
  rewardType: RewardType;
  status?: RewardStatus;
  plan?: string | null;
}): Promise<
  { ok: true; data: LoyaltyReward } | { ok: false; message: string }
> {
  try {
    const access = await resolveLoyaltyAccess(supabase, input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const existing = await fetchLoyaltyRewards(input.restaurantId);
    if (!existing.ok) return existing;

    const max = getMaxLoyaltyRewards(input.plan ?? access.plan);
    const activeCount = existing.data.filter((r) => r.status === "active").length;
    if (
      (input.status ?? "active") === "active" &&
      Number.isFinite(max) &&
      activeCount >= max
    ) {
      return {
        ok: false,
        message: `Your plan allows up to ${max} active rewards. Upgrade to Enterprise for unlimited rewards.`,
      };
    }

    const { data, error } = await supabase
      .from("loyalty_rewards")
      .insert({
        restaurant_id: input.restaurantId,
        title: input.title.trim(),
        description: input.description?.trim() || "",
        points_required: Math.max(1, Math.trunc(input.pointsRequired)),
        image_url: input.imageUrl?.trim() || null,
        reward_type: input.rewardType,
        status: input.status ?? "active",
      })
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message || "Unable to create reward." };
    }

    void logActivity({
      action: "loyalty_reward_created",
      restaurantId: input.restaurantId,
      entityType: "loyalty_reward",
      entityId: (data as RewardRecord).id,
      newValues: { title: input.title },
    });

    return { ok: true, data: mapReward(data as RewardRecord) };
  } catch {
    return { ok: false, message: "Unable to create reward." };
  }
}

export async function updateLoyaltyReward(input: {
  restaurantId: string;
  rewardId: string;
  title?: string;
  description?: string;
  pointsRequired?: number;
  imageUrl?: string | null;
  rewardType?: RewardType;
  status?: RewardStatus;
}): Promise<
  { ok: true; data: LoyaltyReward } | { ok: false; message: string }
> {
  try {
    const access = await resolveLoyaltyAccess(supabase, input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (input.title != null) patch.title = input.title.trim();
    if (input.description != null) patch.description = input.description.trim();
    if (input.pointsRequired != null) {
      patch.points_required = Math.max(1, Math.trunc(input.pointsRequired));
    }
    if (input.imageUrl !== undefined) {
      patch.image_url = input.imageUrl?.trim() || null;
    }
    if (input.rewardType) patch.reward_type = input.rewardType;
    if (input.status) patch.status = input.status;

    const { data, error } = await supabase
      .from("loyalty_rewards")
      .update(patch)
      .eq("id", input.rewardId)
      .eq("restaurant_id", input.restaurantId)
      .select("*")
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message || "Unable to update reward." };
    }
    return { ok: true, data: mapReward(data as RewardRecord) };
  } catch {
    return { ok: false, message: "Unable to update reward." };
  }
}

export async function deleteLoyaltyReward(
  restaurantId: string,
  rewardId: string,
): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    const access = await resolveLoyaltyAccess(supabase, restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const { error } = await supabase
      .from("loyalty_rewards")
      .delete()
      .eq("id", rewardId)
      .eq("restaurant_id", restaurantId);

    if (error) return { ok: false, message: error.message };
    return { ok: true };
  } catch {
    return { ok: false, message: "Unable to delete reward." };
  }
}

export async function redeemLoyaltyReward(input: {
  restaurantId: string;
  rewardId: string;
  customerId: string;
  notes?: string;
}): Promise<
  { ok: true; data: LoyaltyRedemption } | { ok: false; message: string }
> {
  try {
    const access = await resolveLoyaltyAccess(supabase, input.restaurantId);
    if (!access.ok) return { ok: false, message: access.message };

    const { data: reward, error: rewardError } = await supabase
      .from("loyalty_rewards")
      .select("*")
      .eq("id", input.rewardId)
      .eq("restaurant_id", input.restaurantId)
      .maybeSingle();

    if (rewardError || !reward) {
      return { ok: false, message: "Reward not found." };
    }
    const mapped = mapReward(reward as RewardRecord);
    if (mapped.status !== "active") {
      return { ok: false, message: "This reward is inactive." };
    }

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, loyalty_points, full_name")
      .eq("id", input.customerId)
      .eq("restaurant_id", input.restaurantId)
      .maybeSingle();

    if (customerError || !customer) {
      return { ok: false, message: "Customer not found." };
    }

    const points = Number(
      (customer as { loyalty_points?: number }).loyalty_points ?? 0,
    );
    if (points < mapped.pointsRequired) {
      return {
        ok: false,
        message: `Customer needs ${mapped.pointsRequired} points (has ${points}).`,
      };
    }

    const spend = await adjustLoyaltyPoints({
      restaurantId: input.restaurantId,
      customerId: input.customerId,
      delta: -mapped.pointsRequired,
      reason: `Redeemed reward: ${mapped.title}`,
    });
    if (!spend.ok) return { ok: false, message: spend.message };

    const { data: redemption, error } = await supabase
      .from("loyalty_redemptions")
      .insert({
        restaurant_id: input.restaurantId,
        reward_id: input.rewardId,
        customer_id: input.customerId,
        points_spent: mapped.pointsRequired,
        status: "redeemed",
        redeemed_at: new Date().toISOString(),
        notes: input.notes?.trim() || null,
      })
      .select("*")
      .single();

    if (error || !redemption) {
      return { ok: false, message: error?.message || "Unable to redeem." };
    }

    void logActivity({
      action: "loyalty_reward_redeemed",
      restaurantId: input.restaurantId,
      entityType: "loyalty_redemption",
      entityId: (redemption as { id: string }).id,
      newValues: {
        reward_id: input.rewardId,
        customer_id: input.customerId,
        points: mapped.pointsRequired,
      },
    });

    const row = redemption as {
      id: string;
      restaurant_id: string;
      reward_id: string;
      customer_id: string;
      points_spent: number;
      status: string;
      redeemed_at: string | null;
      expires_at: string | null;
      notes: string | null;
      created_at: string;
    };

    return {
      ok: true,
      data: {
        id: row.id,
        restaurantId: row.restaurant_id,
        rewardId: row.reward_id,
        customerId: row.customer_id,
        pointsSpent: row.points_spent,
        status: row.status as RedemptionStatus,
        redeemedAt: row.redeemed_at,
        expiresAt: row.expires_at,
        notes: row.notes,
        createdAt: row.created_at,
        rewardTitle: mapped.title,
        customerName: (customer as { full_name?: string | null }).full_name,
      },
    };
  } catch {
    return { ok: false, message: "Unable to redeem reward." };
  }
}

export async function fetchLoyaltyRedemptions(
  restaurantId: string,
): Promise<
  { ok: true; data: LoyaltyRedemption[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("loyalty_redemptions")
      .select(
        "id, restaurant_id, reward_id, customer_id, points_spent, status, redeemed_at, expires_at, notes, created_at, loyalty_rewards(title), customers(full_name)",
      )
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) return { ok: false, message: error.message };

    const rows = ((data ?? []) as Array<{
      id: string;
      restaurant_id: string;
      reward_id: string;
      customer_id: string;
      points_spent: number;
      status: string;
      redeemed_at: string | null;
      expires_at: string | null;
      notes: string | null;
      created_at: string;
      loyalty_rewards: { title: string } | { title: string }[] | null;
      customers: { full_name: string | null } | { full_name: string | null }[] | null;
    }>).map((row) => {
      const reward = Array.isArray(row.loyalty_rewards)
        ? row.loyalty_rewards[0]
        : row.loyalty_rewards;
      const customer = Array.isArray(row.customers)
        ? row.customers[0]
        : row.customers;
      return {
        id: row.id,
        restaurantId: row.restaurant_id,
        rewardId: row.reward_id,
        customerId: row.customer_id,
        pointsSpent: row.points_spent,
        status: row.status as RedemptionStatus,
        redeemedAt: row.redeemed_at,
        expiresAt: row.expires_at,
        notes: row.notes,
        createdAt: row.created_at,
        rewardTitle: reward?.title,
        customerName: customer?.full_name,
      };
    });

    return { ok: true, data: rows };
  } catch {
    return { ok: false, message: "Unable to load redemption history." };
  }
}

export function getRewardAnalytics(redemptions: LoyaltyRedemption[]) {
  const byStatus: Record<RedemptionStatus, number> = {
    available: 0,
    redeemed: 0,
    expired: 0,
    cancelled: 0,
  };
  let pointsSpent = 0;
  for (const r of redemptions) {
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    if (r.status === "redeemed") pointsSpent += r.pointsSpent;
  }
  return {
    total: redemptions.length,
    byStatus,
    pointsSpent,
    unlimitedPlanHint: planAllowsUnlimitedRewards,
  };
}
