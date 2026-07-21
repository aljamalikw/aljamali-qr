import type { DashboardCategory } from "./types";

export const initialCategories: DashboardCategory[] = [
  { id: "starters", nameEn: "Starters", nameAr: "المقبلات", icon: "🥗", itemCount: 8, visible: true, sortOrder: 1 },
  { id: "soups", nameEn: "Soups", nameAr: "الشوربات", icon: "🍲", itemCount: 4, visible: true, sortOrder: 2 },
  { id: "main-course", nameEn: "Main Course", nameAr: "الأطباق الرئيسية", icon: "🍽️", itemCount: 12, visible: true, sortOrder: 3 },
  { id: "desserts", nameEn: "Desserts", nameAr: "الحلويات", icon: "🍰", itemCount: 6, visible: true, sortOrder: 4 },
  { id: "drinks", nameEn: "Drinks", nameAr: "المشروبات", icon: "🥤", itemCount: 10, visible: false, sortOrder: 5 },
];

export function createEmptyCategoryForm() {
  return { nameEn: "", nameAr: "", icon: "🍽️", visible: true };
}

export function validateCategoryForm(form: { nameEn: string; nameAr: string }): string | null {
  if (!form.nameEn.trim()) return "Please enter the English category name.";
  if (!form.nameAr.trim()) return "Please enter the Arabic category name.";
  return null;
}
