import type { DashboardCategory } from "@/lib/dashboard/categories/types";
import type { CategoryInput, CategoryRow } from "./types";

type CategoryDescription = {
  nameAr: string;
  icon: string;
};

function parseDescription(description: string | null): CategoryDescription {
  if (!description) {
    return { nameAr: "", icon: "🍽️" };
  }

  try {
    const parsed = JSON.parse(description) as Partial<CategoryDescription>;
    if (typeof parsed.nameAr === "string" && typeof parsed.icon === "string") {
      return { nameAr: parsed.nameAr, icon: parsed.icon };
    }
  } catch {
    return { nameAr: description, icon: "🍽️" };
  }

  return { nameAr: "", icon: "🍽️" };
}

function serializeDescription(nameAr: string, icon: string): string {
  return JSON.stringify({ nameAr, icon });
}

export function mapCategoryRowToDashboard(row: CategoryRow): DashboardCategory {
  const { nameAr, icon } = parseDescription(row.description);

  return {
    id: row.id,
    nameEn: row.name,
    nameAr,
    icon,
    itemCount: 0,
    visible: row.is_active,
    sortOrder: row.display_order,
  };
}

export function mapCategoryInputToRow(input: CategoryInput) {
  return {
    name: input.nameEn.trim(),
    description: serializeDescription(input.nameAr.trim(), input.icon),
    is_active: input.visible,
  };
}
