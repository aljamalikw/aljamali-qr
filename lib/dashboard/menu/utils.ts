import type {
  DashboardMenuItem,
  MenuFormData,
  MenuSortOption,
  MenuStatusFilter,
} from "./types";

export function createEmptyMenuForm(): MenuFormData {
  return {
    nameEn: "",
    nameAr: "",
    categoryId: "starters",
    price: "",
    descriptionEn: "",
    descriptionAr: "",
    image: "",
    status: "draft",
    vegetarian: false,
    spicy: false,
    chefSpecial: false,
  };
}

export function validateMenuForm(form: MenuFormData): string | null {
  if (!form.nameEn.trim()) return "Please enter the English name.";
  if (!form.nameAr.trim()) return "Please enter the Arabic name.";
  if (!form.price || Number.isNaN(Number(form.price)) || Number(form.price) <= 0)
    return "Please enter a valid price.";
  return null;
}

export function formToMenuItem(form: MenuFormData, id?: string): DashboardMenuItem {
  return {
    id: id ?? `mi-${Date.now()}`,
    nameEn: form.nameEn.trim(),
    nameAr: form.nameAr.trim(),
    categoryId: form.categoryId,
    price: Number(form.price),
    descriptionEn: form.descriptionEn.trim(),
    descriptionAr: form.descriptionAr.trim(),
    image: form.image.trim() || "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80",
    status: form.status,
    vegetarian: form.vegetarian,
    spicy: form.spicy,
    chefSpecial: form.chefSpecial,
    updatedAt: new Date().toISOString().slice(0, 10),
  };
}

export function menuItemToForm(item: DashboardMenuItem): MenuFormData {
  return {
    nameEn: item.nameEn,
    nameAr: item.nameAr,
    categoryId: item.categoryId,
    price: String(item.price),
    descriptionEn: item.descriptionEn,
    descriptionAr: item.descriptionAr,
    image: item.image,
    status: item.status,
    vegetarian: item.vegetarian,
    spicy: item.spicy,
    chefSpecial: item.chefSpecial,
  };
}

export function filterAndSortMenuItems(
  items: DashboardMenuItem[],
  opts: { search: string; status: MenuStatusFilter; sort: MenuSortOption },
): DashboardMenuItem[] {
  let result = [...items];
  const q = opts.search.trim().toLowerCase();
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
