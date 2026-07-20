export type DayOfWeek =
  | "sunday"
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday";

export type RestaurantStatus = "open" | "busy" | "closed" | "vacation";
export type BorderRadiusOption = "sm" | "md" | "lg" | "xl";
export type CardStyleOption = "minimal" | "premium" | "elevated";
export type SettingsTabId =
  | "profile"
  | "contact"
  | "hours"
  | "social"
  | "menu"
  | "theme"
  | "notifications"
  | "danger";

export interface BusinessDayHours {
  open: string;
  close: string;
  closed: boolean;
}

export interface RestaurantSettingsData {
  profile: {
    name: string;
    logo: string;
    coverImage: string;
    cuisineType: string;
    description: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
  };
  location: {
    country: string;
    city: string;
    area: string;
    street: string;
    mapsUrl: string;
  };
  businessHours: Record<DayOfWeek, BusinessDayHours>;
  social: {
    instagram: string;
    facebook: string;
    tiktok: string;
    twitter: string;
  };
  menuSettings: {
    defaultLanguage: "en" | "ar";
    secondaryLanguage: "en" | "ar";
    enableArabic: boolean;
    enableEnglish: boolean;
    rtl: boolean;
    showPrices: boolean;
    showBadges: boolean;
    showWhatsApp: boolean;
  };
  theme: {
    primaryColor: string;
    accentColor: string;
    borderRadius: BorderRadiusOption;
    cardStyle: CardStyleOption;
  };
  status: RestaurantStatus;
  notifications: {
    email: boolean;
    whatsapp: boolean;
    dailyAnalytics: boolean;
    weeklyReport: boolean;
  };
}

export interface SettingsTab {
  id: SettingsTabId;
  label: string;
  icon: string;
}
