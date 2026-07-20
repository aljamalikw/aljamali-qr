import { RESTAURANT } from "@/lib/saffron-garden/menu-data";
import type { DayOfWeek, RestaurantSettingsData } from "./types";

const defaultHours = { open: "12:00", close: "23:00", closed: false };

export const settingsTabs = [
  { id: "profile" as const, label: "Profile", icon: "🏛️" },
  { id: "contact" as const, label: "Contact & Location", icon: "📍" },
  { id: "hours" as const, label: "Business Hours", icon: "🕐" },
  { id: "social" as const, label: "Social Media", icon: "📱" },
  { id: "menu" as const, label: "Menu Settings", icon: "📋" },
  { id: "theme" as const, label: "Theme", icon: "🎨" },
  { id: "notifications" as const, label: "Notifications", icon: "🔔" },
  { id: "danger" as const, label: "Danger Zone", icon: "⚠️" },
];

export const dayLabels: Record<DayOfWeek, string> = {
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
};

export const initialSettings: RestaurantSettingsData = {
  profile: {
    name: RESTAURANT.name.en,
    logo: "",
    coverImage: RESTAURANT.coverImage,
    cuisineType: "Mediterranean & Gulf",
    description:
      "Fine Mediterranean and Gulf cuisine in the heart of Kuwait. Experience authentic flavors with a modern luxury dining atmosphere.",
  },
  contact: {
    phone: RESTAURANT.phone,
    whatsapp: RESTAURANT.whatsapp,
    email: RESTAURANT.email,
    website: "https://saffrongarden.com",
  },
  location: {
    country: "Kuwait",
    city: "Kuwait City",
    area: "Salmiya",
    street: "Salem Al Mubarak Street",
    mapsUrl: "https://maps.google.com/?q=Salmiya+Kuwait",
  },
  businessHours: {
    sunday: { ...defaultHours },
    monday: { ...defaultHours },
    tuesday: { ...defaultHours },
    wednesday: { ...defaultHours },
    thursday: { ...defaultHours },
    friday: { open: "13:00", close: "00:00", closed: false },
    saturday: { open: "13:00", close: "00:00", closed: false },
  },
  social: {
    instagram: RESTAURANT.social.instagram,
    facebook: RESTAURANT.social.facebook,
    tiktok: "https://tiktok.com/@saffrongarden",
    twitter: RESTAURANT.social.twitter,
  },
  menuSettings: {
    defaultLanguage: "en",
    secondaryLanguage: "ar",
    enableArabic: true,
    enableEnglish: true,
    rtl: true,
    showPrices: true,
    showBadges: true,
    showWhatsApp: true,
  },
  theme: {
    primaryColor: "#d4af37",
    accentColor: "#e8c547",
    borderRadius: "lg",
    cardStyle: "premium",
  },
  status: "open",
  notifications: {
    email: true,
    whatsapp: true,
    dailyAnalytics: false,
    weeklyReport: true,
  },
};

export function cloneSettings(
  data: RestaurantSettingsData,
): RestaurantSettingsData {
  return JSON.parse(JSON.stringify(data)) as RestaurantSettingsData;
}
