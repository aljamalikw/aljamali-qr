export const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Demo", href: "/demo" },
  { label: "Why Choose Us", href: "#testimonials" },
  { label: "Contact", href: "#contact" },
] as const;

export const mobileNavLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Demo", href: "/demo" },
  { label: "Contact", href: "#contact" },
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

export const pricingPlans = [
  {
    name: "Starter",
    price: "29",
    period: "month",
    description: "Perfect for single-location cafés and small restaurants.",
    features: [
      "1 branch location",
      "Up to 50 menu items",
      "English & Arabic menus",
      "Basic analytics",
      "Email support",
    ],
    highlighted: false,
    cta: "Get Started",
  },
  {
    name: "Business",
    price: "79",
    period: "month",
    description: "Ideal for growing restaurants with multiple service areas.",
    features: [
      "Up to 5 branch locations",
      "Unlimited menu items",
      "Advanced analytics",
      "Custom branding",
      "Priority support",
      "Table-specific QR codes",
    ],
    highlighted: true,
    cta: "Get Started",
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Tailored solutions for hotel groups and restaurant chains.",
    features: [
      "Unlimited branches",
      "Dedicated account manager",
      "API access & integrations",
      "White-label options",
      "SLA & onboarding",
      "Custom analytics reports",
    ],
    highlighted: false,
    cta: "Contact Sales",
  },
] as const;

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
    question: "Do customers need to download an app?",
    answer:
      "No. Guests simply scan the QR code with their phone camera and the menu opens instantly in their browser — no app, no sign-up.",
  },
  {
    question: "Can I update my menu in real time?",
    answer:
      "Yes. Any change you make in the dashboard — prices, descriptions, availability — goes live immediately for all scanned menus.",
  },
  {
    question: "Is Arabic RTL supported properly?",
    answer:
      "Absolutely. Our menus are built for true bilingual support with proper RTL layout, Arabic typography, and seamless language switching.",
  },
  {
    question: "How many QR codes can I generate?",
    answer:
      "Starter plans include table QR codes for one location. Business and Enterprise plans support unlimited QR codes across all your branches.",
  },
  {
    question: "Can I try before I commit?",
    answer:
      "Yes. Click View Demo to explore a live sample menu, or start a 14-day free trial on any plan — no credit card required.",
  },
] as const;

export const socialLinks = [
  { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
  { label: "Instagram", href: "https://instagram.com", icon: "instagram" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
  { label: "Facebook", href: "https://facebook.com", icon: "facebook" },
] as const;
