import type { MarketingTemplate } from "./types";

/** System defaults — restaurants can override via marketing_templates. */
export const DEFAULT_MARKETING_TEMPLATES: MarketingTemplate[] = [
  {
    slug: "birthday",
    name: "Birthday",
    subject: "Happy Birthday from us!",
    message:
      "Happy Birthday {{name}}! Enjoy a special treat on us next time you visit. Show this message to redeem.",
  },
  {
    slug: "welcome",
    name: "Welcome",
    subject: "Welcome — we're glad you're here",
    message:
      "Welcome {{name}}! Thanks for joining us. We can't wait to serve you again soon.",
  },
  {
    slug: "thank-you",
    name: "Thank You",
    subject: "Thank you for dining with us",
    message:
      "Thank you {{name}} for visiting! We hope you enjoyed your experience. See you again soon.",
  },
  {
    slug: "win-back",
    name: "Win Back",
    subject: "We miss you — come back soon",
    message:
      "Hi {{name}}, it's been a while! Come back this week and enjoy a welcome-back offer waiting for you.",
  },
  {
    slug: "vip-offer",
    name: "VIP Offer",
    subject: "An exclusive offer for our VIP guests",
    message:
      "{{name}}, as a valued VIP guest you get priority seating and an exclusive offer on your next visit.",
  },
  {
    slug: "holiday-promotion",
    name: "Holiday Promotion",
    subject: "Celebrate with us this holiday season",
    message:
      "Hi {{name}}! Join us for our holiday specials. Book a table or order ahead — we can't wait to see you.",
  },
];

export function applyTemplatePlaceholders(
  text: string,
  vars: { name?: string | null },
): string {
  const name = vars.name?.trim() || "there";
  return text.replaceAll("{{name}}", name);
}
