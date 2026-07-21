import type { DashboardMenuItem } from "./types";

export const menuCategories = [
  { id: "starters", label: "Starters" },
  { id: "main-course", label: "Main Course" },
  { id: "desserts", label: "Desserts" },
  { id: "drinks", label: "Drinks" },
];

export const initialMenuItems: DashboardMenuItem[] = [
  {
    id: "mi-1",
    nameEn: "Hummus Royale",
    nameAr: "حمص رويال",
    categoryId: "starters",
    price: 2.75,
    descriptionEn: "Creamy chickpea dip with tahini and pine nuts",
    descriptionAr: "حمص كريمي مع الطحينة والصنوبر",
    image: "https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=400&q=80",
    status: "published",
    vegetarian: true,
    spicy: false,
    chefSpecial: false,
    updatedAt: "2026-07-18",
  },
  {
    id: "mi-2",
    nameEn: "Grilled Hammour",
    nameAr: "هامور مشوي",
    categoryId: "main-course",
    price: 8.95,
    descriptionEn: "Fresh Gulf hammour with lemon herb butter",
    descriptionAr: "هامور خليجي طازج مع زبدة الأعشاب والليمون",
    image: "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80",
    status: "published",
    vegetarian: false,
    spicy: false,
    chefSpecial: true,
    updatedAt: "2026-07-19",
  },
  {
    id: "mi-3",
    nameEn: "Kunafa Cheesecake",
    nameAr: "تشيز كيك كنافة",
    categoryId: "desserts",
    price: 4.5,
    descriptionEn: "Fusion dessert with pistachio syrup",
    descriptionAr: "حلوى مبتكرة مع دبس الفستق",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&q=80",
    status: "draft",
    vegetarian: true,
    spicy: false,
    chefSpecial: false,
    updatedAt: "2026-07-20",
  },
];

export function getCategoryLabel(id: string): string {
  return menuCategories.find((c) => c.id === id)?.label ?? id;
}
