export const TOTAL_ONBOARDING_STEPS = 5;

export const ONBOARDING_STEP_LABELS = [
  "Restaurant Info",
  "Branding",
  "Categories",
  "Menu Items",
  "First QR Code",
] as const;

export const RESTAURANT_TYPE_OPTIONS = [
  "Fine Dining",
  "Casual Dining",
  "Fast Food",
  "Cafe",
  "Bakery & Sweets",
  "Food Truck",
  "Cloud Kitchen",
  "Bar & Lounge",
  "Buffet",
  "Other",
] as const;

export const PREFERRED_LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
] as const;

export const FONT_STYLE_OPTIONS = [
  { value: "serif", label: "Serif — Elegant" },
  { value: "sans", label: "Sans — Modern" },
  { value: "rounded", label: "Rounded — Friendly" },
] as const;

export type CategorySeedSuggestion = {
  nameEn: string;
  nameAr: string;
  icon: string;
};

export const CATEGORY_SEED_SUGGESTIONS: CategorySeedSuggestion[] = [
  { nameEn: "Starters", nameAr: "المقبلات", icon: "🥗" },
  { nameEn: "Main Course", nameAr: "الأطباق الرئيسية", icon: "🍽️" },
  { nameEn: "Desserts", nameAr: "الحلويات", icon: "🍰" },
  { nameEn: "Drinks", nameAr: "المشروبات", icon: "🥤" },
  { nameEn: "Breakfast", nameAr: "الإفطار", icon: "🍳" },
  { nameEn: "Lunch", nameAr: "الغداء", icon: "🍛" },
  { nameEn: "Dinner", nameAr: "العشاء", icon: "🍷" },
];

export type QrPresetOption = {
  value:
    | "restaurant-table"
    | "vip-room"
    | "outdoor"
    | "delivery"
    | "takeaway"
    | "kitchen"
    | "custom";
  label: string;
};

export const QR_PRESET_OPTIONS: QrPresetOption[] = [
  { value: "restaurant-table", label: "Table Number" },
  { value: "takeaway", label: "Pickup" },
  { value: "delivery", label: "Delivery" },
  { value: "vip-room", label: "Reception" },
  { value: "kitchen", label: "Counter" },
  { value: "custom", label: "Custom" },
];
