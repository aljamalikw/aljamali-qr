import type { LoyaltyRedemption, LoyaltyReward } from "@/lib/loyalty/rewards";
import type { ExportDataset } from "../types";

export function buildLoyaltyRewardsExportDataset(input: {
  rewards: LoyaltyReward[];
  restaurantName: string;
}): ExportDataset {
  const rows = input.rewards.map((reward) => ({
    name: reward.title,
    description: reward.description ?? "",
    pointsRequired: reward.pointsRequired,
    rewardType: reward.rewardType,
    status: reward.status,
    restaurant: input.restaurantName,
  }));

  return {
    filenamePrefix: "loyalty_rewards",
    meta: {
      title: "Loyalty Reward Catalog",
      restaurantName: input.restaurantName,
    },
    columns: [
      { key: "name", header: "Reward Name" },
      { key: "description", header: "Description" },
      { key: "pointsRequired", header: "Points Required", type: "number" },
      { key: "rewardType", header: "Reward Type" },
      { key: "status", header: "Status" },
      { key: "restaurant", header: "Restaurant" },
    ],
    rows,
    summary: [{ label: "Rewards", value: String(rows.length) }],
  };
}

export function buildLoyaltyRedemptionsExportDataset(input: {
  redemptions: LoyaltyRedemption[];
  restaurantName: string;
}): ExportDataset {
  const rows = input.redemptions.map((item) => ({
    customer: item.customerName ?? "",
    reward: item.rewardTitle ?? "",
    pointsSpent: item.pointsSpent,
    redemptionDate: item.redeemedAt ?? item.createdAt,
    status: item.status,
    restaurant: input.restaurantName,
  }));

  return {
    filenamePrefix: "loyalty_redemptions",
    meta: {
      title: "Loyalty Redemption History",
      restaurantName: input.restaurantName,
    },
    columns: [
      { key: "customer", header: "Customer" },
      { key: "reward", header: "Reward" },
      { key: "pointsSpent", header: "Points Spent", type: "number" },
      { key: "redemptionDate", header: "Redemption Date", type: "datetime" },
      { key: "status", header: "Status" },
      { key: "restaurant", header: "Restaurant" },
    ],
    rows,
    summary: [{ label: "Redemptions", value: String(rows.length) }],
  };
}
