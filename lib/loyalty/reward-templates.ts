import type { RewardStatus, RewardType } from "@/lib/loyalty/rewards";

export type RewardTemplateCategory =
  | "free_items"
  | "discounts"
  | "special_occasions"
  | "custom";

export type RewardTemplate = {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  rewardType: RewardType;
  icon: string;
  status: RewardStatus;
  category: Exclude<RewardTemplateCategory, "custom">;
};

export const REWARD_TEMPLATE_CATEGORY_LABELS: Record<
  RewardTemplateCategory,
  string
> = {
  free_items: "Free Items",
  discounts: "Discounts",
  special_occasions: "Special Occasions",
  custom: "Custom",
};

export const REWARD_TEMPLATE_CATEGORY_ICONS: Record<
  Exclude<RewardTemplateCategory, "custom"> | "most_popular",
  string
> = {
  most_popular: "⭐",
  free_items: "🍔",
  discounts: "🏷",
  special_occasions: "🎉",
};

/** Predefined loyalty reward templates — owners can edit before saving. */
export const REWARD_TEMPLATES: RewardTemplate[] = [
  {
    id: "free-coffee",
    name: "Free Coffee",
    description: "Redeem for one free coffee",
    pointsRequired: 100,
    rewardType: "free_item",
    icon: "☕",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-tea",
    name: "Free Tea",
    description: "Redeem for one free tea",
    pointsRequired: 80,
    rewardType: "free_item",
    icon: "🍵",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-soft-drink",
    name: "Free Soft Drink",
    description: "Redeem for one free drink",
    pointsRequired: 80,
    rewardType: "free_item",
    icon: "🥤",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-fries",
    name: "Free Fries",
    description: "Redeem for one free fries",
    pointsRequired: 120,
    rewardType: "free_item",
    icon: "🍟",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-dessert",
    name: "Free Dessert",
    description: "Redeem for one free dessert",
    pointsRequired: 200,
    rewardType: "free_item",
    icon: "🍰",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-burger",
    name: "Free Burger",
    description: "Redeem for one free burger",
    pointsRequired: 350,
    rewardType: "free_item",
    icon: "🍔",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-pizza",
    name: "Free Pizza",
    description: "Redeem for one free pizza",
    pointsRequired: 400,
    rewardType: "free_item",
    icon: "🍕",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-main-course",
    name: "Free Main Course",
    description: "Redeem for one free main course",
    pointsRequired: 500,
    rewardType: "free_item",
    icon: "🍝",
    status: "active",
    category: "free_items",
  },
  {
    id: "discount-5",
    name: "5% Discount",
    description: "Get 5% off your order",
    pointsRequired: 150,
    rewardType: "discount",
    icon: "💰",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-10",
    name: "10% Discount",
    description: "Get 10% off your order",
    pointsRequired: 300,
    rewardType: "discount",
    icon: "💰",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-15",
    name: "15% Discount",
    description: "Get 15% off your order",
    pointsRequired: 450,
    rewardType: "discount",
    icon: "💰",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-20",
    name: "20% Discount",
    description: "Get 20% off your order",
    pointsRequired: 600,
    rewardType: "discount",
    icon: "💰",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-kwd-1",
    name: "KWD 1 Off",
    description: "Save KWD 1 on your order",
    pointsRequired: 100,
    rewardType: "discount",
    icon: "💳",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-kwd-2",
    name: "KWD 2 Off",
    description: "Save KWD 2 on your order",
    pointsRequired: 200,
    rewardType: "discount",
    icon: "💳",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-kwd-5",
    name: "KWD 5 Off",
    description: "Save KWD 5 on your order",
    pointsRequired: 450,
    rewardType: "discount",
    icon: "💳",
    status: "active",
    category: "discounts",
  },
  {
    id: "birthday-reward",
    name: "Birthday Reward",
    description: "A special birthday treat for members",
    pointsRequired: 50,
    rewardType: "gift",
    icon: "🎂",
    status: "active",
    category: "special_occasions",
  },
  {
    id: "anniversary-reward",
    name: "Anniversary Reward",
    description: "Celebrate with a complimentary reward",
    pointsRequired: 100,
    rewardType: "gift",
    icon: "🎉",
    status: "active",
    category: "special_occasions",
  },
  {
    id: "welcome-reward",
    name: "Welcome Reward",
    description: "Welcome new loyalty members",
    pointsRequired: 50,
    rewardType: "gift",
    icon: "🎈",
    status: "active",
    category: "special_occasions",
  },
  {
    id: "first-visit-reward",
    name: "First Visit Reward",
    description: "A thank-you reward for first visits",
    pointsRequired: 75,
    rewardType: "gift",
    icon: "✨",
    status: "active",
    category: "special_occasions",
  },
];

/** Featured templates shown in the Most Popular column (by id). */
export const MOST_POPULAR_TEMPLATE_IDS = [
  "free-burger",
  "free-coffee",
  "birthday-reward",
  "discount-10",
  "discount-kwd-2",
] as const;

export const REWARD_TEMPLATE_CATEGORY_ORDER: Array<
  Exclude<RewardTemplateCategory, "custom">
> = ["free_items", "discounts", "special_occasions"];

export function getMostPopularTemplates(
  templates: RewardTemplate[] = REWARD_TEMPLATES,
): RewardTemplate[] {
  const byId = new Map(templates.map((t) => [t.id, t]));
  return MOST_POPULAR_TEMPLATE_IDS.map((id) => byId.get(id)).filter(
    (t): t is RewardTemplate => Boolean(t),
  );
}

export function filterRewardTemplates(
  templates: RewardTemplate[],
  query: string,
): RewardTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter((template) => {
    const hay =
      `${template.name} ${template.description} ${template.rewardType} ${template.pointsRequired}`.toLowerCase();
    return hay.includes(q);
  });
}
