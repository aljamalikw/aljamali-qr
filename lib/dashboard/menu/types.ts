export type MenuItemStatus = "published" | "draft" | "archived";

export interface DashboardMenuItem {
  id: string;
  nameEn: string;
  nameAr: string;
  categoryId: string;
  price: number;
  discountPrice: number | null;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  status: MenuItemStatus;
  vegetarian: boolean;
  spicy: boolean;
  chefSpecial: boolean;
  popular: boolean;
  recommended: boolean;
  vegan: boolean;
  glutenFree: boolean;
  halal: boolean;
  preparationTime: string;
  calories: string;
  ingredients: string;
  isArchived: boolean;
  deletedAt: string | null;
  updatedAt: string;
}

export interface MenuFormData {
  nameEn: string;
  nameAr: string;
  categoryId: string;
  price: string;
  discountPrice: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  status: MenuItemStatus;
  vegetarian: boolean;
  spicy: boolean;
  chefSpecial: boolean;
  popular: boolean;
  recommended: boolean;
  vegan: boolean;
  glutenFree: boolean;
  halal: boolean;
  preparationTime: string;
  calories: string;
  ingredients: string;
}

export type MenuSortOption = "newest" | "name" | "price-high" | "price-low";
export type MenuStatusFilter = "all" | MenuItemStatus;
