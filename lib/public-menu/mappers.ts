import { mapCategoryRowToDashboard } from "@/lib/categories/mappers";
import type { CategoryRow } from "@/lib/categories/types";
import { mapMenuItemRowToDashboard } from "@/lib/menu-items/mappers";
import type { MenuItemRow } from "@/lib/menu-items/types";
import type { Restaurant } from "@/lib/restaurants/types";
import type {
  PublicCategory,
  PublicCategoryGroup,
  PublicMenuItem,
  PublicRestaurant,
} from "./types";

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function mapRestaurantToPublic(row: Restaurant): PublicRestaurant {
  return {
    id: row.id,
    slug: row.slug ?? "",
    name: row.restaurant_name?.trim() || "Restaurant",
    logoUrl: row.logo_url?.trim() || null,
    coverUrl: row.cover_url?.trim() || null,
    currency: row.currency,
    phone: row.phone?.trim() || null,
    aboutUs: row.about_us?.trim() ?? "",
    cuisineType: row.cuisine_type?.trim() ?? "",
    galleryUrls: toStringArray(row.gallery_urls),
    openingHours: row.opening_hours?.trim() ?? "",
    socialInstagram: row.social_instagram?.trim() ?? "",
    socialFacebook: row.social_facebook?.trim() ?? "",
    socialTiktok: row.social_tiktok?.trim() ?? "",
    whatsappNumber: row.whatsapp_number?.trim() ?? "",
    website: row.website?.trim() ?? "",
    googleMapsUrl: row.google_maps_url?.trim() ?? "",
    reservationsEnabled: row.reservations_enabled ?? true,
    onlineOrderingEnabled: row.online_ordering_enabled ?? true,
    subscriptionPlan: row.subscription_plan ?? "Starter",
    taxRate: Number(row.tax_rate ?? 0) || 0,
  };
}

export function mapCategoryRowToPublic(row: CategoryRow): PublicCategory {
  const mapped = mapCategoryRowToDashboard(row);

  return {
    id: mapped.id,
    nameEn: mapped.nameEn,
    nameAr: mapped.nameAr,
    icon: mapped.icon,
    sortOrder: mapped.sortOrder,
  };
}

export function mapMenuItemRowToPublic(row: MenuItemRow): PublicMenuItem | null {
  const mapped = mapMenuItemRowToDashboard(row);

  if (mapped.status !== "published" || !mapped.categoryId || mapped.isArchived) {
    return null;
  }

  return {
    id: mapped.id,
    categoryId: mapped.categoryId,
    nameEn: mapped.nameEn,
    nameAr: mapped.nameAr,
    descriptionEn: mapped.descriptionEn,
    descriptionAr: mapped.descriptionAr,
    price: mapped.price,
    discountPrice: mapped.discountPrice,
    image: mapped.image,
    vegetarian: mapped.vegetarian,
    vegan: mapped.vegan,
    glutenFree: mapped.glutenFree,
    halal: mapped.halal,
    spicy: mapped.spicy,
    chefSpecial: mapped.chefSpecial,
    popular: mapped.popular,
    recommended: mapped.recommended,
    preparationTime: mapped.preparationTime,
    calories: mapped.calories,
    sortOrder: row.display_order,
  };
}

export function groupMenuItemsByCategory(
  categories: PublicCategory[],
  items: PublicMenuItem[],
): PublicCategoryGroup[] {
  const categoryIds = new Set(categories.map((category) => category.id));

  const publishedItems = items.filter((item) => categoryIds.has(item.categoryId));

  return categories
    .map((category) => ({
      category,
      items: publishedItems
        .filter((item) => item.categoryId === category.id)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    }))
    .filter((group) => group.items.length > 0);
}
