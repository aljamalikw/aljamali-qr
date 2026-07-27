import type { DashboardMenuItem, MenuFormData } from "@/lib/dashboard/menu/types";
import {
  DEFAULT_MENU_ITEM_IMAGE,
  type MenuItemMetadata,
  type MenuItemRow,
} from "./types";

function parseMetadata(description: string | null): MenuItemMetadata {
  const defaults: MenuItemMetadata = {
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
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

  if (!description) return defaults;

  try {
    const parsed = JSON.parse(description) as Partial<MenuItemMetadata>;
    return {
      nameAr: typeof parsed.nameAr === "string" ? parsed.nameAr : defaults.nameAr,
      descriptionEn:
        typeof parsed.descriptionEn === "string" ? parsed.descriptionEn : defaults.descriptionEn,
      descriptionAr:
        typeof parsed.descriptionAr === "string" ? parsed.descriptionAr : defaults.descriptionAr,
      status:
        parsed.status === "published" ||
        parsed.status === "draft" ||
        parsed.status === "archived"
          ? parsed.status
          : defaults.status,
      vegetarian: Boolean(parsed.vegetarian),
      spicy: Boolean(parsed.spicy),
      chefSpecial: Boolean(parsed.chefSpecial),
      popular: Boolean(parsed.popular),
      recommended: Boolean(parsed.recommended),
      vegan: Boolean(parsed.vegan),
      glutenFree: Boolean(parsed.glutenFree),
      halal: Boolean(parsed.halal),
      preparationTime:
        typeof parsed.preparationTime === "string" ? parsed.preparationTime : defaults.preparationTime,
      calories: typeof parsed.calories === "string" ? parsed.calories : defaults.calories,
      ingredients: typeof parsed.ingredients === "string" ? parsed.ingredients : defaults.ingredients,
    };
  } catch {
    return { ...defaults, descriptionEn: description };
  }
}

function serializeMetadata(form: MenuFormData): string {
  const metadata: MenuItemMetadata = {
    nameAr: form.nameAr.trim(),
    descriptionEn: form.descriptionEn.trim(),
    descriptionAr: form.descriptionAr.trim(),
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
  };

  return JSON.stringify(metadata);
}

export function mapMenuItemRowToDashboard(row: MenuItemRow): DashboardMenuItem {
  const metadata = parseMetadata(row.description);

  return {
    id: row.id,
    nameEn: row.name,
    nameAr: metadata.nameAr,
    categoryId: row.category_id ?? "",
    price: Number(row.price),
    discountPrice: row.discount_price !== null && row.discount_price !== undefined
      ? Number(row.discount_price)
      : null,
    descriptionEn: metadata.descriptionEn,
    descriptionAr: metadata.descriptionAr,
    image: row.image_url?.trim() || DEFAULT_MENU_ITEM_IMAGE,
    status: metadata.status,
    vegetarian: metadata.vegetarian,
    spicy: metadata.spicy,
    chefSpecial: metadata.chefSpecial,
    popular: metadata.popular,
    recommended: metadata.recommended,
    vegan: metadata.vegan,
    glutenFree: metadata.glutenFree,
    halal: metadata.halal,
    preparationTime: metadata.preparationTime,
    calories: metadata.calories,
    ingredients: metadata.ingredients,
    isArchived: row.is_archived ?? false,
    deletedAt: row.deleted_at ?? null,
    updatedAt: row.updated_at.slice(0, 10),
  };
}

export function mapMenuFormToRow(form: MenuFormData) {
  const discount = form.discountPrice.trim();
  return {
    name: form.nameEn.trim(),
    description: serializeMetadata(form),
    price: Number(form.price),
    discount_price: discount && !Number.isNaN(Number(discount)) ? Number(discount) : null,
    image_url: form.image.trim() || null,
    category_id: form.categoryId || null,
    is_available: form.status === "published",
  };
}
