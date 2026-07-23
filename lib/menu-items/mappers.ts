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
    descriptionEn: metadata.descriptionEn,
    descriptionAr: metadata.descriptionAr,
    image: row.image_url?.trim() || DEFAULT_MENU_ITEM_IMAGE,
    status: metadata.status,
    vegetarian: metadata.vegetarian,
    spicy: metadata.spicy,
    chefSpecial: metadata.chefSpecial,
    updatedAt: row.updated_at.slice(0, 10),
  };
}

export function mapMenuFormToRow(form: MenuFormData) {
  return {
    name: form.nameEn.trim(),
    description: serializeMetadata(form),
    price: Number(form.price),
    image_url: form.image.trim() || null,
    category_id: form.categoryId || null,
    is_available: form.status === "published",
  };
}
