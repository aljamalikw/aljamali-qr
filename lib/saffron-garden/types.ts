export type MenuCategory =
  | "starters"
  | "soups"
  | "salads"
  | "main-course"
  | "burgers"
  | "pizza"
  | "pasta"
  | "desserts"
  | "drinks";

export type Language = "en" | "ar";

export interface MenuItem {
  id: string;
  category: MenuCategory;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  price: number;
  image: string;
  chefSpecial?: boolean;
  vegetarian?: boolean;
  spicy?: boolean;
}

export interface CategoryMeta {
  id: MenuCategory;
  label: { en: string; ar: string };
  icon: string;
}
