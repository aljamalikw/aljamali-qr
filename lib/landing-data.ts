import { SUBSCRIPTION_PLANS } from "@/lib/subscriptions/plans";

export const PLATFORM_WHATSAPP = "96550000000";
export const PLATFORM_EMAIL = "hello@aljamaliqr.com";
export const PLATFORM_PHONE = "+965 5000 0000";

export const whatsappPrefillMessage =
  "Hello, I would like to know more about Aljamali QR.";

export const navLinks = [
  { label: "Home", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "Why Us", href: "#why-us" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
] as const;

export const mobileNavLinks = [
  { label: "Home", href: "#hero" },
  { label: "Features", href: "#features" },
  { label: "Why Us", href: "#why-us" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
  { label: "Login", href: "/login" },
] as const;

export const whyUsReasons = [
  {
    title: "Premium QR Experience",
    description:
      "A polished black-and-gold digital menu that matches the standard of fine dining and modern hospitality brands.",
    icon: "qr",
  },
  {
    title: "Instant Menu Updates",
    description:
      "Change prices, specials, or availability in seconds — every table sees the latest menu immediately.",
    icon: "update",
  },
  {
    title: "Unlimited Menu Changes",
    description:
      "Edit as often as you need with no printing costs, no delays, and no limits on everyday updates.",
    icon: "unlimited",
  },
  {
    title: "Multi-Language Menus",
    description:
      "Serve guests in English and Arabic with elegant bilingual layouts and proper RTL support.",
    icon: "language",
  },
  {
    title: "QR Analytics",
    description:
      "Understand scans, peak hours, and menu engagement so you can make sharper operational decisions.",
    icon: "analytics",
  },
  {
    title: "No App Required",
    description:
      "Guests open your menu instantly in the browser — no downloads, no accounts, no friction.",
    icon: "phone",
  },
  {
    title: "Secure Cloud Platform",
    description:
      "Your menus and data stay protected on a secure cloud foundation built for restaurant operations.",
    icon: "shield",
  },
  {
    title: "Fast Onboarding",
    description:
      "Go live quickly with guided setup, clear workflows, and a free trial that gets you operational fast.",
    icon: "rocket",
  },
] as const;

export const features = [
  {
    title: "QR Menus",
    description:
      "Beautiful, scannable menus that open instantly on any smartphone — no app download required.",
    icon: "qr",
  },
  {
    title: "English & Arabic",
    description:
      "Full bilingual support with elegant RTL layout, so every guest feels at home.",
    icon: "language",
  },
  {
    title: "Instant Updates",
    description:
      "Change prices, add specials, or mark items sold out in seconds — live for every table.",
    icon: "update",
  },
  {
    title: "Analytics",
    description:
      "Track menu views, popular dishes, and peak hours to make smarter business decisions.",
    icon: "analytics",
  },
  {
    title: "Unlimited Menu Items",
    description:
      "No caps on categories or dishes. Build menus as rich and detailed as your cuisine.",
    icon: "unlimited",
  },
  {
    title: "Multi-Branch Support",
    description:
      "Manage every location from one dashboard with branch-specific menus and branding.",
    icon: "branches",
  },
] as const;

export const steps = [
  {
    step: "01",
    title: "Create Your Menu",
    description:
      "Upload your dishes, photos, and prices through our intuitive dashboard. Set up English and Arabic in minutes.",
  },
  {
    step: "02",
    title: "Generate QR Codes",
    description:
      "We create unique, branded QR codes for each table or branch. Print them on elegant table tents or stickers.",
  },
  {
    step: "03",
    title: "Go Live & Grow",
    description:
      "Guests scan and browse instantly. Update anytime, track analytics, and delight customers with a premium experience.",
  },
] as const;

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
      { label: "Table Ordering", comingSoon: true },
      { label: "Happy Hour Pricing", comingSoon: true },
      { label: "Customer Reviews", comingSoon: true },
      { label: "Priority Support" },
    ] as PricingFeature[],
    premiumFeaturesTitle: "Premium Business Tools",
    premiumFeatures: [
      { label: "Online Ordering", comingSoon: true },
      { label: "Online Payments", comingSoon: true },
      { label: "Kitchen Display", comingSoon: true },
      { label: "Waiter Call", comingSoon: true },
      { label: "Discount Coupons", comingSoon: true },
      { label: "Sales Analytics" },
      { label: "Remove Aljamali Branding" },
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
    professional: true,
    enterprise: true,
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
    professional: "Soon",
    enterprise: "Soon",
  },
  {
    feature: "Online Payments",
    starter: false,
    professional: "Soon",
    enterprise: "Soon",
  },
  {
    feature: "Kitchen / Table Ordering",
    starter: false,
    professional: "Soon",
    enterprise: "Soon",
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

export const testimonials = [
  {
    quote:
      "Aljamali QR transformed how we serve guests. Updates go live instantly, and our bilingual menu has been a hit with tourists and locals alike.",
    author: "Chef Omar Al-Rashid",
    role: "Owner, Maison Levant",
    rating: 5,
  },
  {
    quote:
      "We replaced printed menus across four branches in one afternoon. The gold-themed digital experience matches our brand perfectly.",
    author: "Sarah Mitchell",
    role: "Operations Director, Ember & Oak",
    rating: 5,
  },
  {
    quote:
      "The analytics alone paid for the subscription. We discovered which dishes drive repeat visits and optimized our menu accordingly.",
    author: "Khalid Al-Farsi",
    role: "General Manager, Noor Bistro",
    rating: 5,
  },
] as const;

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
      "Starter is ideal for single-location restaurants with up to 5 QR codes and 25 menu items. Professional supports 2 restaurants/branches, unlimited QR codes and menu items, sales analytics, remove Aljamali branding, priority support, and upcoming ordering tools.",
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
