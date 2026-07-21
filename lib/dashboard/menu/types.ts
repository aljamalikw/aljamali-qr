export type MenuItemStatus = "published" | "draft" | "archived";

export interface DashboardMenuItem {
  id: string;
  nameEn: string;
  nameAr: string;
  categoryId: string;
  price: number;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  status: MenuItemStatus;
  vegetarian: boolean;
  spicy: boolean;
  chefSpecial: boolean;
  updatedAt: string;
}

export interface MenuFormData {
  nameEn: string;
  nameAr: string;
  categoryId: string;
  price: string;
  descriptionEn: string;
  descriptionAr: string;
  image: string;
  status: MenuItemStatus;
  vegetarian: boolean;
  spicy: boolean;
  chefSpecial: boolean;
}

export type MenuSortOption = "newest" | "name" | "price-high" | "price-low";
export type MenuStatusFilter = "all" | MenuItemStatus;
