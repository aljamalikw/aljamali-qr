import type { MenuItemStatus } from "@/lib/dashboard/menu/types";

export type MenuItemRow = {
  id: string;
  restaurant_id: string;
  category_id: string | null;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_available: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type MenuItemMetadata = {
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  status: MenuItemStatus;
  vegetarian: boolean;
  spicy: boolean;
  chefSpecial: boolean;
};

export const DEFAULT_MENU_ITEM_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80";
