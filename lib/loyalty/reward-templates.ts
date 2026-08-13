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

/** Predefined loyalty reward templates — owners can edit before saving. */
export const REWARD_TEMPLATES: RewardTemplate[] = [
  {
    id: "free-coffee",
    name: "Free Coffee",
    description: "Redeem points for one free coffee.",
    pointsRequired: 100,
    rewardType: "free_item",
    icon: "🎁",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-dessert",
    name: "Free Dessert",
    description: "Redeem points for one complimentary dessert.",
    pointsRequired: 200,
    rewardType: "free_item",
    icon: "🍰",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-soft-drink",
    name: "Free Soft Drink",
    description: "Redeem points for one free drink.",
    pointsRequired: 80,
    rewardType: "free_item",
    icon: "🥤",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-side-dish",
    name: "Free Side Dish",
    description: "Redeem points for one free side item.",
    pointsRequired: 120,
    rewardType: "free_item",
    icon: "🍟",
    status: "active",
    category: "free_items",
  },
  {
    id: "buy-5-coffee-get-1",
    name: "Buy 5 Coffees, Get 1 Free",
    description: "After five coffee purchases, redeem for one free coffee.",
    pointsRequired: 250,
    rewardType: "coupon",
    icon: "☕",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-burger",
    name: "Free Burger",
    description: "Redeem points for one free burger.",
    pointsRequired: 350,
    rewardType: "free_item",
    icon: "🍔",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-salad",
    name: "Free Salad",
    description: "Redeem points for one free salad.",
    pointsRequired: 180,
    rewardType: "free_item",
    icon: "🥗",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-pizza",
    name: "Free Pizza",
    description: "Redeem points for one free pizza.",
    pointsRequired: 400,
    rewardType: "free_item",
    icon: "🍕",
    status: "active",
    category: "free_items",
  },
  {
    id: "free-main-course",
    name: "Free Main Course",
    description: "Redeem points for one free main course.",
    pointsRequired: 500,
    rewardType: "free_item",
    icon: "🍝",
    status: "active",
    category: "free_items",
  },
  {
    id: "discount-5",
    name: "5% Discount",
    description: "Redeem points for a 5% discount on your order.",
    pointsRequired: 150,
    rewardType: "discount",
    icon: "💰",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-10",
    name: "10% Discount",
    description: "Redeem points for a 10% discount on your order.",
    pointsRequired: 300,
    rewardType: "discount",
    icon: "💰",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-15",
    name: "15% Discount",
    description: "Redeem points for a 15% discount on your order.",
    pointsRequired: 450,
    rewardType: "discount",
    icon: "💰",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-20",
    name: "20% Discount",
    description: "Redeem points for a 20% discount on your order.",
    pointsRequired: 600,
    rewardType: "discount",
    icon: "💰",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-kwd-1",
    name: "KWD 1 Discount",
    description: "Redeem points for KWD 1 off your order.",
    pointsRequired: 100,
    rewardType: "discount",
    icon: "💳",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-kwd-2",
    name: "KWD 2 Discount",
    description: "Redeem points for KWD 2 off your order.",
    pointsRequired: 200,
    rewardType: "discount",
    icon: "💳",
    status: "active",
    category: "discounts",
  },
  {
    id: "discount-kwd-5",
    name: "KWD 5 Discount",
    description: "Redeem points for KWD 5 off your order.",
    pointsRequired: 450,
    rewardType: "discount",
    icon: "💳",
    status: "active",
    category: "discounts",
  },
  {
    id: "birthday-reward",
    name: "Birthday Reward",
    description: "A special birthday treat for valued loyalty members.",
    pointsRequired: 50,
    rewardType: "gift",
    icon: "🎂",
    status: "active",
    category: "special_occasions",
  },
  {
    id: "anniversary-reward",
    name: "Anniversary Reward",
    description: "Celebrate your anniversary with a complimentary reward.",
    pointsRequired: 100,
    rewardType: "gift",
    icon: "🎉",
    status: "active",
    category: "special_occasions",
  },
  {
    id: "welcome-reward",
    name: "Welcome Reward",
    description: "Welcome new loyalty members with a starter reward.",
    pointsRequired: 50,
    rewardType: "gift",
    icon: "🎈",
    status: "active",
    category: "special_occasions",
  },
];

export const REWARD_TEMPLATE_CATEGORY_ORDER: Array<
  Exclude<RewardTemplateCategory, "custom">
> = ["free_items", "discounts", "special_occasions"];

export function filterRewardTemplates(
  templates: RewardTemplate[],
  query: string,
): RewardTemplate[] {
  const q = query.trim().toLowerCase();
  if (!q) return templates;
  return templates.filter((template) => {
    const hay = `${template.name} ${template.description} ${template.rewardType} ${template.pointsRequired}`.toLowerCase();
    return hay.includes(q);
  });
}
