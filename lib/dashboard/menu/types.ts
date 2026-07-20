import type { MenuCategory } from "@/lib/saffron-garden/types";

export type MenuSortOption = "newest" | "oldest" | "price" | "name";
export type AvailabilityFilter = "all" | "available" | "unavailable";

export interface DashboardMenuItem {
  id: string;
  category: MenuCategory;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  image: string;
  preparationTime: number;
  calories: number;
  available: boolean;
  chefSpecial: boolean;
  vegetarian: boolean;
  spicy: boolean;
  createdAt: string;
}

export interface MenuItemFormData {
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  category: MenuCategory;
  price: string;
  preparationTime: string;
  calories: string;
  image: string;
  vegetarian: boolean;
  spicy: boolean;
  chefSpecial: boolean;
  available: boolean;
}

export type MenuFormMode = "create" | "edit";
