import { fetchCategories } from "./fetchCategories";

export type MenuCategoryOption = {
  id: string;
  label: string;
};

export async function fetchMenuCategoryOptions(): Promise<
  { ok: true; data: MenuCategoryOption[] } | { ok: false; message: string }
> {
  const result = await fetchCategories();

  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    data: result.data.map((category) => ({
      id: category.id,
      label: category.nameEn,
    })),
  };
}

export function getCategoryLabel(
  id: string,
  categories: MenuCategoryOption[] = [],
): string {
  return categories.find((category) => category.id === id)?.label ?? id;
}
