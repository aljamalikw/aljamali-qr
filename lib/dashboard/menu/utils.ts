import type {
  DashboardMenuItem,
  MenuFormData,
  MenuSortOption,
  MenuStatusFilter,
} from "./types";
import { DEFAULT_MENU_ITEM_IMAGE } from "@/lib/menu-items/types";
export function createEmptyMenuForm(): MenuFormData {
  return {
    nameEn: "",
    nameAr: "",
    categoryId: "",
    price: "",
    discountPrice: "",
    descriptionEn: "",
    descriptionAr: "",
    image: "",
    status: "draft",
    vegetarian: false,
    spicy: false,
    chefSpecial: false,
    popular: false,
    recommended: false,
    vegan: false,
    glutenFree: false,
    halal: false,
    preparationTime: "",
    calories: "",
    ingredients: "",
  };
}

export function validateMenuForm(form: MenuFormData): string | null {
  if (!form.nameEn.trim()) return "Please enter the English name.";
  if (!form.nameAr.trim()) return "Please enter the Arabic name.";
  if (!form.price || Number.isNaN(Number(form.price)) || Number(form.price) <= 0)
    return "Please enter a valid price.";
  if (
    form.discountPrice.trim() &&
    (Number.isNaN(Number(form.discountPrice)) || Number(form.discountPrice) < 0)
  )
    return "Please enter a valid offer price.";
  if (
    form.discountPrice.trim() &&
    Number(form.discountPrice) >= Number(form.price)
  )
    return "Offer price must be lower than the regular price.";
  return null;
}

export function formToMenuItem(form: MenuFormData, id?: string): DashboardMenuItem {
  return {
    id: id ?? `mi-${Date.now()}`,
    nameEn: form.nameEn.trim(),
    nameAr: form.nameAr.trim(),
    categoryId: form.categoryId,
    price: Number(form.price),
    discountPrice: form.discountPrice.trim() ? Number(form.discountPrice) : null,
    descriptionEn: form.descriptionEn.trim(),
    descriptionAr: form.descriptionAr.trim(),
    image: form.image.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    status: form.status,
    vegetarian: form.vegetarian,
    spicy: form.spicy,
    chefSpecial: form.chefSpecial,
    popular: form.popular,
    recommended: form.recommended,
    vegan: form.vegan,
    glutenFree: form.glutenFree,
    halal: form.halal,
    preparationTime: form.preparationTime.trim(),
    calories: form.calories.trim(),
    ingredients: form.ingredients.trim(),
    isArchived: false,
    deletedAt: null,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export function menuItemToForm(item: DashboardMenuItem): MenuFormData {
  return {
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    categoryId: item.categoryId,
    price: String(item.price),
    discountPrice: item.discountPrice !== null ? String(item.discountPrice) : "",
    descriptionEn: item.descriptionEn,
    descriptionAr: item.descriptionAr,
    image: item.image === DEFAULT_MENU_ITEM_IMAGE ? "" : item.image,
    status: item.status,
    vegetarian: item.vegetarian,
    spicy: item.spicy,
    chefSpecial: item.chefSpecial,
    popular: item.popular,
    recommended: item.recommended,
    vegan: item.vegan,
    glutenFree: item.glutenFree,
    halal: item.halal,
    preparationTime: item.preparationTime,
    calories: item.calories,
    ingredients: item.ingredients,
  };
}
export function filterAndSortMenuItems(
  items: DashboardMenuItem[],
  opts: { search: string; status: MenuStatusFilter; sort: MenuSortOption; showArchived?: boolean },
): DashboardMenuItem[] {
  let result = [...items];
  const q = opts.search.trim().toLowerCase();

  result = result.filter((i) => opts.showArchived ? true : !i.isArchived);

  if (q) {
    result = result.filter(
      (i) =>
        i.nameEn.toLowerCase().includes(q) ||
        i.nameAr.includes(q) ||
        i.descriptionEn.toLowerCase().includes(q),
    );
  }
  if (opts.status !== "all") {
    result = result.filter((i) => i.status === opts.status);
  }
  switch (opts.sort) {
    case "name":
      result.sort((a, b) => a.nameEn.localeCompare(b.nameEn));
      break;
    case "price-high":
      result.sort((a, b) => b.price - a.price);
      break;
    case "price-low":
      result.sort((a, b) => a.price - b.price);
      break;
    default:
      result.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }
  return result;
}

export function formatPrice(price: number): string {
  return `${price.toFixed(3)} KD`;
}
