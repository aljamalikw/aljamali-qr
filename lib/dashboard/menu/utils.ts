import { categories } from "@/lib/saffron-garden/menu-data";
import type { MenuCategory } from "@/lib/saffron-garden/types";
import type {
  AvailabilityFilter,
  DashboardMenuItem,
  MenuItemFormData,
  MenuSortOption,
} from "./types";

export function getCategoryLabel(category: MenuCategory): string {
  return categories.find((c) => c.id === category)?.label.en ?? category;
}

export function formatMenuPrice(price: number): string {
  return `${price.toFixed(3)} KD`;
}

export function generateMenuItemId(): string {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createEmptyFormData(): MenuItemFormData {
  return {
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    category: "starters",
    price: "",
    preparationTime: "",
    calories: "",
    image: "",
    vegetarian: false,
    spicy: false,
    chefSpecial: false,
    available: true,
  };
}

export function menuItemToFormData(item: DashboardMenuItem): MenuItemFormData {
  return {
    nameEn: item.name.en,
    nameAr: item.name.ar,
    descriptionEn: item.description.en,
    descriptionAr: item.description.ar,
    category: item.category,
    price: item.price.toFixed(3),
    preparationTime: String(item.preparationTime),
    calories: String(item.calories),
    image: item.image,
    vegetarian: item.vegetarian,
    spicy: item.spicy,
    chefSpecial: item.chefSpecial,
    available: item.available,
  };
}

export function formDataToMenuItem(
  data: MenuItemFormData,
  id: string,
  createdAt?: string,
): DashboardMenuItem {
  return {
    id,
    category: data.category,
    name: { en: data.nameEn.trim(), ar: data.nameAr.trim() },
    description: {
      en: data.descriptionEn.trim(),
      ar: data.descriptionAr.trim(),
    },
    price: parseFloat(data.price) || 0,
    image:
      data.image ||
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=85&auto=format&fit=crop",
    preparationTime: parseInt(data.preparationTime, 10) || 0,
    calories: parseInt(data.calories, 10) || 0,
    available: data.available,
    chefSpecial: data.chefSpecial,
    vegetarian: data.vegetarian,
    spicy: data.spicy,
    createdAt: createdAt ?? new Date().toISOString(),
  };
}

export function duplicateMenuItem(item: DashboardMenuItem): DashboardMenuItem {
  return {
    ...item,
    id: generateMenuItemId(),
    name: {
      en: `${item.name.en} (Copy)`,
      ar: `${item.name.ar} (نسخة)`,
    },
    createdAt: new Date().toISOString(),
  };
}

export interface MenuFilterParams {
  search: string;
  category: MenuCategory | "all";
  availability: AvailabilityFilter;
  sort: MenuSortOption;
}

export function filterAndSortMenuItems(
  items: DashboardMenuItem[],
  params: MenuFilterParams,
): DashboardMenuItem[] {
  const query = params.search.trim().toLowerCase();

  let result = items.filter((item) => {
    if (params.category !== "all" && item.category !== params.category) {
      return false;
    }
    if (params.availability === "available" && !item.available) return false;
    if (params.availability === "unavailable" && item.available) return false;
    if (!query) return true;

    return (
      item.name.en.toLowerCase().includes(query) ||
      item.name.ar.includes(query) ||
      item.description.en.toLowerCase().includes(query) ||
      getCategoryLabel(item.category).toLowerCase().includes(query)
    );
  });

  result = [...result].sort((a, b) => {
    switch (params.sort) {
      case "newest":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "oldest":
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case "price":
        return a.price - b.price;
      case "name":
        return a.name.en.localeCompare(b.name.en);
      default:
        return 0;
    }
  });

  return result;
}

export function validateFormData(data: MenuItemFormData): string | null {
  if (!data.nameEn.trim()) return "Dish name is required.";
  if (!data.nameAr.trim()) return "Arabic dish name is required.";
  if (!data.price.trim() || isNaN(parseFloat(data.price))) {
    return "A valid price is required.";
  }
  if (parseFloat(data.price) < 0) return "Price cannot be negative.";
  return null;
}
