import { updateWithColumnFallback } from "@/lib/supabase/persist-with-fallback";
import type { RestaurantSettings } from "@/lib/dashboard/settings/types";
import type { Restaurant } from "@/lib/restaurants/types";

const ERROR = "Unable to save restaurant settings. Please try again.";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function mapRestaurantToSettings(
  restaurant: Restaurant,
): RestaurantSettings {
  return {
    nameEn: restaurant.restaurant_name ?? "",
    nameAr: restaurant.restaurant_name_ar ?? "",
    taglineEn: restaurant.tagline_en ?? "",
    taglineAr: restaurant.tagline_ar ?? "",
    phone: restaurant.phone ?? "",
    whatsapp: restaurant.whatsapp_number ?? "",
    email: restaurant.email ?? "",
    addressEn: restaurant.address_en ?? "",
    addressAr: restaurant.address_ar ?? "",
    openingHours: restaurant.opening_hours ?? "",
    holidaySchedule: restaurant.holiday_schedule ?? "",
    logoUrl: restaurant.logo_url ?? "",
    coverUrl: restaurant.cover_url ?? "",
    galleryUrls: toStringArray(restaurant.gallery_urls),
    aboutUs: restaurant.about_us ?? "",
    cuisineType: restaurant.cuisine_type ?? "",
    branches: toStringArray(restaurant.branches),
    socialInstagram: restaurant.social_instagram ?? "",
    socialFacebook: restaurant.social_facebook ?? "",
    socialTiktok: restaurant.social_tiktok ?? "",
    website: restaurant.website ?? "",
    googleMapsUrl: restaurant.google_maps_url ?? "",
    deliveryEnabled: restaurant.delivery_enabled ?? false,
    deliveryNotes: restaurant.delivery_notes ?? "",
    deliveryPlatforms: toStringArray(restaurant.delivery_platforms),
    taxNumber: restaurant.tax_number ?? "",
    commercialRegistration: restaurant.commercial_registration ?? "",
    vatNumber: restaurant.vat_number ?? "",
    currency: restaurant.currency || "KWD",
    timezone: restaurant.timezone || "Asia/Kuwait",
    seoTitle: restaurant.seo_title ?? "",
    seoDescription: restaurant.seo_description ?? "",
    seoKeywords: restaurant.seo_keywords ?? "",
    ogImageUrl: restaurant.og_image_url ?? "",
    themePrimaryColor: restaurant.theme_primary_color ?? "#d4af37",
    languages: restaurant.languages?.length
      ? restaurant.languages
      : ["en", "ar"],
    showPrices: restaurant.show_prices ?? true,
    bilingualMenu: restaurant.bilingual_menu ?? true,
    whatsappOrders: restaurant.whatsapp_orders ?? false,
    tableQrOrdering: restaurant.table_qr_ordering ?? false,
    showNutrition: restaurant.show_nutrition ?? false,
    darkModeDefault: restaurant.dark_mode_default ?? true,
  };
}

export async function updateRestaurantSettings(
  restaurantId: string,
  settings: RestaurantSettings,
): Promise<{ ok: true; data: Restaurant } | { ok: false; message: string }> {
  try {
    const payload: Record<string, unknown> = {
      restaurant_name: settings.nameEn.trim() || null,
      restaurant_name_ar: settings.nameAr.trim() || null,
      tagline_en: settings.taglineEn.trim() || null,
      tagline_ar: settings.taglineAr.trim() || null,
      phone: settings.phone.trim() || null,
      whatsapp_number: settings.whatsapp.trim() || null,
      email: settings.email.trim() || null,
      address_en: settings.addressEn.trim() || null,
      address_ar: settings.addressAr.trim() || null,
      opening_hours: settings.openingHours.trim() || null,
      holiday_schedule: settings.holidaySchedule.trim() || null,
      logo_url: settings.logoUrl.trim() || null,
      cover_url: settings.coverUrl.trim() || null,
      gallery_urls: settings.galleryUrls.filter((url) => url.trim()),
      about_us: settings.aboutUs.trim() || null,
      cuisine_type: settings.cuisineType.trim() || null,
      branches: settings.branches.filter((b) => b.trim()),
      social_instagram: settings.socialInstagram.trim() || null,
      social_facebook: settings.socialFacebook.trim() || null,
      social_tiktok: settings.socialTiktok.trim() || null,
      website: settings.website.trim() || null,
      google_maps_url: settings.googleMapsUrl.trim() || null,
      delivery_enabled: settings.deliveryEnabled,
      delivery_notes: settings.deliveryNotes.trim() || null,
      delivery_platforms: settings.deliveryPlatforms.filter((p) => p.trim()),
      tax_number: settings.taxNumber.trim() || null,
      commercial_registration: settings.commercialRegistration.trim() || null,
      vat_number: settings.vatNumber.trim() || null,
      currency: settings.currency.trim() || "KWD",
      timezone: settings.timezone.trim() || "Asia/Kuwait",
      seo_title: settings.seoTitle.trim() || null,
      seo_description: settings.seoDescription.trim() || null,
      seo_keywords: settings.seoKeywords.trim() || null,
      og_image_url: settings.ogImageUrl.trim() || null,
      theme_primary_color: settings.themePrimaryColor.trim() || "#d4af37",
      languages: settings.languages.length ? settings.languages : ["en"],
      show_prices: settings.showPrices,
      bilingual_menu: settings.bilingualMenu,
      whatsapp_orders: settings.whatsappOrders,
      table_qr_ordering: settings.tableQrOrdering,
      show_nutrition: settings.showNutrition,
      dark_mode_default: settings.darkModeDefault,
    };

    const result = await updateWithColumnFallback<Restaurant>(
      "restaurants",
      { id: restaurantId },
      payload,
    );

    if (!result.ok) {
      return { ok: false, message: result.message === "NO_COLUMNS_AVAILABLE" ? ERROR : result.message };
    }

    return { ok: true, data: result.data };
  } catch {
    return { ok: false, message: ERROR };
  }
}
