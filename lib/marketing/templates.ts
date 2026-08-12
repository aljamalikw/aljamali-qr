import type { Customer } from "@/lib/customers/sync-customer";
import type { MarketingTemplate } from "./types";

/** System defaults — restaurants can override via marketing_templates (Enterprise). */
export const DEFAULT_MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    slug: "welcome",
    name: "Welcome",
    subject: "Welcome — we're glad you're here",
    message:
      "Welcome {{customer_name}}! Thanks for joining {{restaurant_name}}. We can't wait to serve you again soon.",
  },
  {
    slug: "birthday",
    name: "Birthday",
    subject: "Happy Birthday from us!",
    message:
      "Happy Birthday {{first_name}} 🎉\n\nEnjoy a special treat on us next time you visit {{restaurant_name}}.\n\nWe look forward to celebrating with you!",
  },
  {
    slug: "win-back",
    name: "Win Back",
    subject: "We miss you — come back soon",
    message:
      "Hi {{customer_name}} 👋\n\nIt's been a while since your last visit ({{last_order_date}}).\nCome back this week for a welcome-back offer at {{restaurant_name}}!\n\nWe miss you.",
  },
  {
    slug: "vip",
    name: "VIP",
    subject: "An exclusive offer for our VIP guests",
    message:
      "Hello {{customer_name}} ✨\n\nAs a valued VIP guest of {{restaurant_name}}, enjoy an exclusive offer on your next visit.\n\nYou currently have {{loyalty_points}} loyalty points.",
  },
  {
    slug: "weekend-offer",
    name: "Weekend Offer",
    subject: "Weekend special just for you",
    message:
      "Hello {{first_name}} 👋\n\nWe have a special offer just for you!\nEnjoy 20% OFF this weekend at {{restaurant_name}}.\n\nWe look forward to serving you!",
  },
  {
    slug: "new-menu",
    name: "New Menu",
    subject: "New dishes just landed",
    message:
      "Hi {{customer_name}}!\n\nOur new menu is live at {{restaurant_name}}. Come try the latest chef specials — we saved a table for you.",
  },
  {
    slug: "ramadan",
    name: "Ramadan",
    subject: "Ramadan Kareem",
    message:
      "Ramadan Kareem {{customer_name}} 🌙\n\nJoin us at {{restaurant_name}} for iftar and suhoor specials this holy month.\n\nWe look forward to welcoming you.",
  },
  {
    slug: "national-day",
    name: "National Day",
    subject: "Celebrate with us",
    message:
      "Hello {{customer_name}} 🇰🇼\n\nCelebrate National Day with specials at {{restaurant_name}}.\nBring family and friends — we can't wait to see you!",
  },
  {
    slug: "loyalty",
    name: "Loyalty",
    subject: "Your loyalty rewards await",
    message:
      "Hi {{customer_name}}!\n\nYou have {{loyalty_points}} points and {{total_orders}} orders with {{restaurant_name}}.\nRedeem rewards on your next visit!",
  },
  {
    slug: "custom",
    name: "Custom",
    subject: "A note from us",
    message:
      "Hello {{customer_name}} 👋\n\nWe have something special for you at {{restaurant_name}}.\n\nWe look forward to serving you!",
  },
];

export type CampaignPlaceholderVars = {
  customerName?: string | null;
  restaurantName?: string | null;
  loyaltyPoints?: number | null;
  lastOrderDate?: string | null;
  totalOrders?: number | null;
};

function firstNameFrom(fullName: string): string {
  const part = fullName.trim().split(/\s+/)[0];
  return part || fullName;
}

/**
 * Apply campaign placeholders for WhatsApp / email bodies.
 * Supports: {{customer_name}} {{restaurant_name}} {{loyalty_points}}
 * {{first_name}} {{last_order_date}} {{total_orders}} and legacy {{name}}.
 */
export function applyCampaignPlaceholders(
  text: string,
  vars: CampaignPlaceholderVars,
): string {
  const customerName = vars.customerName?.trim() || "there";
  const restaurantName = vars.restaurantName?.trim() || "our restaurant";
  const loyaltyPoints = String(Math.max(0, Number(vars.loyaltyPoints ?? 0)));
  const lastOrderDate = vars.lastOrderDate?.trim() || "recently";
  const totalOrders = String(Math.max(0, Number(vars.totalOrders ?? 0)));
  const firstName = firstNameFrom(customerName);

  return text
    .replaceAll("{{customer_name}}", customerName)
    .replaceAll("{{name}}", customerName)
    .replaceAll("{{first_name}}", firstName)
    .replaceAll("{{restaurant_name}}", restaurantName)
    .replaceAll("{{loyalty_points}}", loyaltyPoints)
    .replaceAll("{{last_order_date}}", lastOrderDate)
    .replaceAll("{{total_orders}}", totalOrders);
}

/** @deprecated Prefer applyCampaignPlaceholders */
export function applyTemplatePlaceholders(
  text: string,
  vars: { name?: string | null },
): string {
  return applyCampaignPlaceholders(text, { customerName: vars.name });
}

export function buildPreviewVars(
  restaurantName: string,
  sample?: Customer | null,
): CampaignPlaceholderVars {
  return {
    customerName: sample?.fullName?.trim() || "Ahmed Ali",
    restaurantName: restaurantName || "Crafting Hands",
    loyaltyPoints: sample?.loyaltyPoints ?? 120,
    lastOrderDate: sample?.lastVisit
      ? new Date(sample.lastVisit).toLocaleDateString()
      : "last weekend",
    totalOrders: sample?.totalOrders ?? 5,
  };
}
