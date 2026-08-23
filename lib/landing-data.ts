import {
  DEFAULT_PLATFORM_WHATSAPP_MESSAGE,
  getConfiguredWhatsAppNumber,
  OFFICIAL_ALJAMALI_WHATSAPP_DISPLAY,
  OFFICIAL_ALJAMALI_WHATSAPP_NUMBER,
} from "@/lib/company/whatsapp";
import { SUBSCRIPTION_PLANS } from "@/lib/subscriptions/plans";

/** Digits-only official platform WhatsApp (wa.me). Prefer env when set. */
export const PLATFORM_WHATSAPP =
  getConfiguredWhatsAppNumber() ?? OFFICIAL_ALJAMALI_WHATSAPP_NUMBER;

export const PLATFORM_EMAIL = "hello@aljamaliqr.com";
export const PLATFORM_PHONE = OFFICIAL_ALJAMALI_WHATSAPP_DISPLAY;

export const whatsappPrefillMessage = DEFAULT_PLATFORM_WHATSAPP_MESSAGE;

export const navLinks = [
  { label: "Home", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Why Us", href: "#why-us" },
  { label: "Contact", href: "#contact" },
] as const;

export const mobileNavLinks = [
  { label: "Home", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Why Us", href: "#why-us" },
  { label: "Contact", href: "#contact" },
  { label: "Login", href: "/login" },
] as const;

export const heroValueProps = [
  { title: "Bilingual English & Arabic", icon: "language" as const },
  { title: "Instant Menu Updates", icon: "update" as const },
  { title: "QR Ordering & Reservations", icon: "order" as const },
  { title: "Built-in Analytics Dashboard", icon: "analytics" as const },
] as const;

/** Compact checklist shown in the split hero (reference layout). */
export const heroChecklist = [
  "Bilingual English & Arabic",
  "Instant Menu Updates",
] as const;

/** Neutral trust strip — no invented ratings or restaurant counts. */
export const trustStripItems = [
  "Built for modern restaurants",
  "Secure & Reliable",
  "Fast & Easy Setup",
  "MyFatoorah Billing",
] as const;

export const whyUsReasons = [
  {
    title: "Bilingual Menus",
    description:
      "Serve guests in English and Arabic with elegant layouts and proper RTL support.",
    icon: "language",
  },
  {
    title: "Fast Daily Operations",
    description:
      "Update prices, specials, and availability in seconds — every table stays current.",
    icon: "update",
  },
  {
    title: "Easy to Manage",
    description:
      "One clear dashboard for menus, QR codes, orders, and guest relationships.",
    icon: "rocket",
  },
  {
    title: "Customer CRM",
    description:
      "Know who visits, orders, and returns — built around restaurant guest journeys.",
    icon: "crm",
  },
  {
    title: "Loyalty & Rewards",
    description:
      "Turn visits into points and rewards that bring guests back to your tables.",
    icon: "loyalty",
  },
  {
    title: "WhatsApp Marketing",
    description:
      "Reach opted-in customers with campaigns that feel personal, not spammy.",
    icon: "whatsapp",
  },
  {
    title: "Business Analytics",
    description:
      "Understand revenue, peak hours, and top dishes so you can grow with clarity.",
    icon: "analytics",
  },
  {
    title: "Multi-Restaurant Ready",
    description:
      "Manage multiple locations from one account with separate menus and insights.",
    icon: "branches",
  },
  {
    title: "Restaurant-Focused",
    description:
      "Designed for hospitality teams — not generic SaaS workflows.",
    icon: "dish",
  },
] as const;

export const features = [
  {
    title: "Digital QR Menu",
    description:
      "Beautiful bilingual menus that open instantly — no app download required.",
    icon: "dish",
  },
  {
    title: "Online Ordering",
    description:
      "Let guests scan, browse, and order from the table with a premium flow.",
    icon: "order",
  },
  {
    title: "Reservations",
    description:
      "Capture bookings cleanly and keep your floor plan running smoothly.",
    icon: "reservation",
  },
  {
    title: "Kitchen Display",
    description:
      "Route orders to the kitchen with clarity so tickets move faster.",
    icon: "kitchen",
  },
  {
    title: "Customer CRM",
    description:
      "Build a living guest profile from orders, visits, and preferences.",
    icon: "crm",
  },
  {
    title: "Loyalty Rewards",
    description:
      "Reward regulars with points and offers that drive repeat visits.",
    icon: "loyalty",
  },
  {
    title: "WhatsApp CRM",
    description:
      "Chat with opted-in guests through a consent-gated WhatsApp workflow.",
    icon: "whatsapp",
  },
  {
    title: "Marketing",
    description:
      "Share campaigns with opted-in customers — personal, not spammy.",
    icon: "marketing",
  },
  {
    title: "Business Analytics",
    description:
      "See revenue, orders, and peak hours in one restaurant-ready view.",
    icon: "analytics",
  },
  {
    title: "Multi-Restaurant Management",
    description:
      "Operate every location from one account with clear separation.",
    icon: "branches",
  },
] as const;

export const steps = [
  {
    step: "01",
    title: "Create Your Restaurant",
    description:
      "Set up your brand, location, and essentials in a guided flow built for busy owners.",
  },
  {
    step: "02",
    title: "Build Your Digital Menu",
    description:
      "Add dishes, photos, and prices in English and Arabic — ready for guests instantly.",
  },
  {
    step: "03",
    title: "Share Your QR Code",
    description:
      "Print elegant QR codes for tables and let guests open your menu in one scan.",
  },
] as const;

export const growthWorkflow = [
  { label: "Digital Menu", icon: "dish" as const },
  { label: "Orders", icon: "order" as const },
  { label: "Customer CRM", icon: "crm" as const },
  { label: "Loyalty", icon: "loyalty" as const },
  { label: "WhatsApp", icon: "whatsapp" as const },
  { label: "Marketing", icon: "marketing" as const },
  { label: "Analytics", icon: "analytics" as const },
] as const;

export const analyticsDemoMetrics = [
  { label: "Revenue", value: "2,480 KWD", hint: "Demo" },
  { label: "Orders", value: "186", hint: "Demo" },
  { label: "Returning Customers", value: "38%", hint: "Demo" },
  { label: "Average Order Value", value: "13.3 KWD", hint: "Demo" },
] as const;

export const analyticsDemoExtra = [
  { label: "Customer Growth", value: "+12%", hint: "Demo month" },
] as const;

export const analyticsDemoItems = [
  { name: "Grilled Sea Bass", value: "42 orders" },
  { name: "Truffle Pasta", value: "37 orders" },
  { name: "Signature Latte", value: "29 orders" },
] as const;

export const analyticsDemoHours = [
  { label: "12–2 PM", level: 70 },
  { label: "2–5 PM", level: 35 },
  { label: "5–8 PM", level: 92 },
  { label: "8–11 PM", level: 80 },
] as const;

export const loyaltyMarketingItems = [
  {
    title: "Loyalty Rewards",
    description: "Points and redeemable treats that make regulars feel valued.",
    icon: "loyalty" as const,
  },
  {
    title: "Customer Segments",
    description: "Group guests by visits, spend, and engagement for smarter outreach.",
    icon: "crm" as const,
  },
  {
    title: "WhatsApp Customer Chat",
    description: "One-click conversations with guests who already know your brand.",
    icon: "whatsapp" as const,
  },
  {
    title: "Campaigns",
    description: "Share offers through a free WhatsApp workflow — no spam blasts.",
    icon: "marketing" as const,
  },
  {
    title: "Birthday Offers",
    description: "Celebrate special days with rewards that feel personal.",
    icon: "gift" as const,
  },
  {
    title: "Win-Back Offers",
    description: "Re-engage quiet guests with timely, permission-based messages.",
    icon: "rocket" as const,
  },
] as const;

export const multiRestaurantPoints = [
  "Centralized management from one owner account",
  "Separate menus for every location",
  "Separate customer lists per restaurant",
  "Separate analytics for each branch",
  "Enterprise-level multi-location reporting",
] as const;

/** Neutral trust statements — no invented restaurant testimonials. */
export const trustStatements = [
  {
    title: "Built for modern restaurants",
    description:
      "A premium digital experience designed around real hospitality workflows.",
  },
  {
    title: "Designed for restaurant teams",
    description:
      "Clear tools for owners, managers, and front-of-house without clutter.",
  },
  {
    title: "Made for fast daily operations",
    description:
      "Update menus, serve guests, and review performance without slowing service.",
  },
] as const;

/** @deprecated Prefer trustStatements — kept for compatibility. */
export const testimonials = trustStatements;

export type PricingFeature = {
  label: string;
  comingSoon?: boolean;
};

/** Canonical marketing prices — derived from shared subscription catalog. */
export const PRICING_CURRENCY = "KWD";
export const PRICING_LOW_PRICE = String(SUBSCRIPTION_PLANS.Starter.monthly ?? 8);
export const PRICING_HIGH_PRICE = String(
  SUBSCRIPTION_PLANS.Professional.monthly ?? 15,
);

export const pricingPlans = [
  {
    id: SUBSCRIPTION_PLANS.Starter.id,
    name: SUBSCRIPTION_PLANS.Starter.name,
    subtitle: SUBSCRIPTION_PLANS.Starter.subtitle,
    description: SUBSCRIPTION_PLANS.Starter.description,
    monthlyPrice: String(SUBSCRIPTION_PLANS.Starter.monthly),
    yearlyPrice: String(SUBSCRIPTION_PLANS.Starter.yearly),
    monthlySuffix: "KWD / month",
    yearlySuffix: "KWD / year",
    featuresIntro: "Includes" as string | null,
    features: [
      { label: "1 Restaurant" },
      { label: "5 QR Codes" },
      { label: "25 Menu Items" },
      { label: "Unlimited Categories" },
      { label: "Restaurant Branding" },
      { label: "Menu Images" },
      { label: "Instant Menu Updates" },
      { label: "QR Scan Analytics" },
      { label: "Priority Email Support" },
    ] as PricingFeature[],
    premiumFeaturesTitle: null as string | null,
    premiumFeatures: null as PricingFeature[] | null,
    highlighted: SUBSCRIPTION_PLANS.Starter.highlighted,
    badge: SUBSCRIPTION_PLANS.Starter.badge,
    cta: SUBSCRIPTION_PLANS.Starter.ctaLabel,
    ctaHref: SUBSCRIPTION_PLANS.Starter.ctaHref,
    showYearlySavings: true,
  },
  {
    id: SUBSCRIPTION_PLANS.Professional.id,
    name: SUBSCRIPTION_PLANS.Professional.name,
    subtitle: SUBSCRIPTION_PLANS.Professional.subtitle,
    description: SUBSCRIPTION_PLANS.Professional.description,
    monthlyPrice: String(SUBSCRIPTION_PLANS.Professional.monthly),
    yearlyPrice: String(SUBSCRIPTION_PLANS.Professional.yearly),
    monthlySuffix: "KWD / month",
    yearlySuffix: "KWD / year",
    featuresIntro: "Everything in Starter PLUS",
    features: [
      { label: "2 Restaurants / Branches" },
      { label: "Unlimited QR Codes" },
      { label: "Unlimited Menu Items" },
      { label: "Live Order Status", comingSoon: true },
      { label: "Table Ordering" },
      { label: "Happy Hour Pricing", comingSoon: true },
      { label: "Customer Reviews" },
      { label: "Priority Support" },
    ] as PricingFeature[],
    premiumFeaturesTitle: "Premium Business Tools",
    premiumFeatures: [
      { label: "Online Ordering" },
      { label: "Online Payments", comingSoon: true },
      { label: "Kitchen Display" },
      { label: "Waiter Call", comingSoon: true },
      { label: "Discount Coupons", comingSoon: true },
      { label: "Sales Analytics" },
      { label: "Remove Aljamali Branding", comingSoon: true },
    ] as PricingFeature[],
    highlighted: SUBSCRIPTION_PLANS.Professional.highlighted,
    badge: SUBSCRIPTION_PLANS.Professional.badge,
    cta: SUBSCRIPTION_PLANS.Professional.ctaLabel,
    ctaHref: SUBSCRIPTION_PLANS.Professional.ctaHref,
    showYearlySavings: true,
  },
  {
    id: SUBSCRIPTION_PLANS.Enterprise.id,
    name: SUBSCRIPTION_PLANS.Enterprise.name,
    subtitle: SUBSCRIPTION_PLANS.Enterprise.subtitle,
    description: SUBSCRIPTION_PLANS.Enterprise.description,
    monthlyPrice: "Contact Us",
    yearlyPrice: "Contact Us",
    monthlySuffix: "",
    yearlySuffix: "",
    featuresIntro: "Everything in Professional PLUS",
    features: [
      { label: "Unlimited Restaurants" },
      { label: "Unlimited Staff Accounts" },
      { label: "Staff Roles & Permissions" },
      { label: "Franchise Management" },
      { label: "POS Integration" },
      { label: "Custom Domain" },
      { label: "API Access" },
      { label: "Dedicated Account Manager" },
      { label: "Priority SLA Support" },
      { label: "Custom Development" },
      { label: "On-site Training" },
    ] as PricingFeature[],
    premiumFeaturesTitle: null as string | null,
    premiumFeatures: null as PricingFeature[] | null,
    highlighted: SUBSCRIPTION_PLANS.Enterprise.highlighted,
    badge: SUBSCRIPTION_PLANS.Enterprise.badge,
    cta: SUBSCRIPTION_PLANS.Enterprise.ctaLabel,
    ctaHref: SUBSCRIPTION_PLANS.Enterprise.ctaHref,
    showYearlySavings: false,
  },
] as const;

export const pricingTrustCards = [
  {
    title: "Setup in under 10 minutes",
    description:
      "Launch your digital menu quickly with a guided setup built for busy restaurant owners.",
    icon: "rocket",
  },
  {
    title: "Update menus instantly",
    description:
      "Change prices, specials, and availability in seconds — every table stays current.",
    icon: "update",
  },
  {
    title: "Customers need no app",
    description:
      "Guests scan and browse instantly in their browser — no downloads, no friction.",
    icon: "phone",
  },
  {
    title: "English & Arabic menus",
    description:
      "Serve every guest elegantly with bilingual menus and proper RTL support.",
    icon: "language",
  },
] as const;

/** Comparison table cells: text value, included (true), or not included (false). */
export type PricingComparisonValue = string | boolean;

export const pricingComparisonRows: ReadonlyArray<{
  feature: string;
  starter: PricingComparisonValue;
  professional: PricingComparisonValue;
  enterprise: PricingComparisonValue;
}> = [
  {
    feature: "Restaurants / Branches",
    starter: "1",
    professional: "2",
    enterprise: "Unlimited",
  },
  {
    feature: "Menu Items",
    starter: "25",
    professional: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "QR Codes",
    starter: "5",
    professional: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Categories",
    starter: "Unlimited",
    professional: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Analytics",
    starter: "QR Scan",
    professional: "Sales Analytics",
    enterprise: "Sales Analytics",
  },
  {
    feature: "Restaurant Branding",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Remove Aljamali Branding",
    starter: false,
    professional: "Planned",
    enterprise: "Planned",
  },
  {
    feature: "Menu Images",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Online Ordering",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Online Payments",
    starter: false,
    professional: "Planned",
    enterprise: "Planned",
  },
  {
    feature: "Kitchen / Table Ordering",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Customer Reviews",
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Support",
    starter: "Priority Email",
    professional: "Priority",
    enterprise: "Priority SLA",
  },
  {
    feature: "Staff Roles & Permissions",
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    feature: "API / POS / Custom Domain",
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    feature: "Dedicated Account Manager",
    starter: false,
    professional: false,
    enterprise: true,
  },
];

export const faqs = [
  {
    question: "How long does setup take?",
    answer:
      "Most restaurants launch their first digital menu in under 30 minutes. Upload dishes, generate QR codes, and go live the same day.",
  },
  {
    question: "Can I update my menu anytime?",
    answer:
      "Yes. Any change you make in the dashboard — prices, descriptions, availability — goes live immediately for every scanned menu.",
  },
  {
    question: "Do customers need an app?",
    answer:
      "No. Guests simply scan the QR code with their phone camera and the menu opens instantly in their browser — no app, no sign-up.",
  },
  {
    question: "How many QR codes can I create?",
    answer:
      "The Free plan includes 1 QR code, Starter includes 5 QR codes, and Professional and Enterprise include unlimited QR codes.",
  },
  {
    question: "What is the difference between Starter and Professional?",
    answer:
      "Starter is ideal for single-location restaurants with up to 5 QR codes and 25 menu items. Professional supports 2 restaurants/branches, unlimited QR codes and menu items, online ordering, kitchen display, table ordering, customer reviews, sales analytics, and priority support.",
  },
  {
    question: "How much does Professional cost?",
    answer:
      "Professional is 15 KWD per month, or 150 KWD per year — saving the equivalent of 2 months with annual billing.",
  },
  {
    question: "Can I upload food images?",
    answer:
      "Absolutely. Upload high-quality dish photos to make your digital menu more appetizing and increase guest engagement.",
  },
] as const;

export const socialLinks = [
  { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
  { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
  { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
] as const;
