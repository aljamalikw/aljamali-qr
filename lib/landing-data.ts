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

/** Canonical marketing prices — single source of truth for landing/SEO. */
export const PRICING_CURRENCY = "KWD";
export const PRICING_LOW_PRICE = "0";
export const PRICING_HIGH_PRICE = "15";

export const pricingPlans = [
  {
    id: "free",
    name: "Free",
    subtitle: "Best for trying Aljamali QR",
    description: "Explore the platform before upgrading.",
    monthlyPrice: "Free",
    yearlyPrice: "Free",
    monthlySuffix: "",
    yearlySuffix: "",
    featuresIntro: null as string | null,
    features: [
      { label: "1 Restaurant" },
      { label: "1 QR Code" },
      { label: "5 Menu Items" },
      { label: "Basic Digital Menu" },
      { label: "Basic QR Analytics" },
      { label: "Aljamali Branding" },
      { label: "Community Support" },
    ] as PricingFeature[],
    premiumFeaturesTitle: null as string | null,
    premiumFeatures: null as PricingFeature[] | null,
    highlighted: false,
    badge: "Try Before You Buy",
    cta: "Get Started",
    ctaHref: "/register",
    showYearlySavings: false,
  },
  {
    id: "starter",
    name: "Starter",
    subtitle: "Perfect for cafés & small restaurants",
    description: "Everything you need to digitize your menu.",
    monthlyPrice: "8",
    yearlyPrice: "80",
    monthlySuffix: "KWD / month",
    yearlySuffix: "KWD / year",
    featuresIntro: "Everything in Free PLUS",
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
    highlighted: false,
    badge: "Best Value",
    cta: "Start Free Trial",
    ctaHref: "/register",
    showYearlySavings: true,
  },
  {
    id: "professional",
    name: "Professional",
    subtitle: "Best for growing restaurants & multiple branches",
    description:
      "Advanced tools to increase sales and automate operations.",
    monthlyPrice: "15",
    yearlyPrice: "150",
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
    highlighted: true,
    badge: "Most Popular",
    cta: "Start Free Trial",
    ctaHref: "/register",
    showYearlySavings: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    subtitle: "Built for restaurant chains",
    description:
      "Tailored solutions with dedicated support and custom integrations.",
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
    highlighted: false,
    badge: "Custom Solution",
    cta: "Contact Sales",
    ctaHref: "#contact",
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
  free: PricingComparisonValue;
  starter: PricingComparisonValue;
  professional: PricingComparisonValue;
  enterprise: PricingComparisonValue;
}> = [
  {
    feature: "Restaurants / Branches",
    free: "1",
    starter: "1",
    professional: "2",
    enterprise: "Unlimited",
  },
  {
    feature: "Menu Items",
    free: "5",
    starter: "25",
    professional: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "QR Codes",
    free: "1",
    starter: "5",
    professional: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Categories",
    free: "Basic",
    starter: "Unlimited",
    professional: "Unlimited",
    enterprise: "Unlimited",
  },
  {
    feature: "Analytics",
    free: "Basic QR",
    starter: "QR Scan",
    professional: "Sales Analytics",
    enterprise: "Sales Analytics",
  },
  {
    feature: "Restaurant Branding",
    free: "Aljamali Branding",
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Remove Aljamali Branding",
    free: false,
    starter: false,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Menu Images",
    free: false,
    starter: true,
    professional: true,
    enterprise: true,
  },
  {
    feature: "Online Ordering",
    free: false,
    starter: false,
    professional: "Soon",
    enterprise: "Soon",
  },
  {
    feature: "Online Payments",
    free: false,
    starter: false,
    professional: "Soon",
    enterprise: "Soon",
  },
  {
    feature: "Kitchen / Table Ordering",
    free: false,
    starter: false,
    professional: "Soon",
    enterprise: "Soon",
  },
  {
    feature: "Support",
    free: "Community",
    starter: "Priority Email",
    professional: "Priority",
    enterprise: "Priority SLA",
  },
  {
    feature: "Staff Roles & Permissions",
    free: false,
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    feature: "API / POS / Custom Domain",
    free: false,
    starter: false,
    professional: false,
    enterprise: true,
  },
  {
    feature: "Dedicated Account Manager",
    free: false,
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
