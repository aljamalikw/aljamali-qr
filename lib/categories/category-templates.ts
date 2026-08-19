export interface CategoryTemplate {
  nameEn: string;
  nameAr: string;
  icon: string;
}

export interface CategoryTemplateGroup {
  label: string;
  labelAr: string;
  templates: CategoryTemplate[];
}

export const CATEGORY_TEMPLATE_GROUPS: CategoryTemplateGroup[] = [
  {
    label: "Food",
    labelAr: "الطعام",
    templates: [
      { nameEn: "Starters", nameAr: "المقبلات", icon: "🥗" },
      { nameEn: "Soups", nameAr: "الشوربات", icon: "🍲" },
      { nameEn: "Salads", nameAr: "السلطات", icon: "🥬" },
      { nameEn: "Main Course", nameAr: "الأطباق الرئيسية", icon: "🍽️" },
      { nameEn: "Grills", nameAr: "المشويات", icon: "🥩" },
      { nameEn: "Burgers", nameAr: "برغر", icon: "🍔" },
      { nameEn: "Sandwiches", nameAr: "سندويشات", icon: "🥪" },
      { nameEn: "Wraps", nameAr: "راب", icon: "🌯" },
      { nameEn: "Pizza", nameAr: "بيتزا", icon: "🍕" },
      { nameEn: "Pasta", nameAr: "باستا", icon: "🍝" },
      { nameEn: "Seafood", nameAr: "المأكولات البحرية", icon: "🦐" },
      { nameEn: "Rice", nameAr: "أرز", icon: "🍚" },
      { nameEn: "Chicken", nameAr: "دجاج", icon: "🍗" },
      { nameEn: "Meat", nameAr: "لحوم", icon: "🥘" },
      { nameEn: "Vegetarian", nameAr: "نباتي", icon: "🥦" },
      { nameEn: "Sides", nameAr: "أطباق جانبية", icon: "🍟" },
      { nameEn: "Kids Meals", nameAr: "وجبات أطفال", icon: "🧒" },
    ],
  },
  {
    label: "Desserts",
    labelAr: "الحلويات",
    templates: [
      { nameEn: "Desserts", nameAr: "الحلويات", icon: "🍰" },
      { nameEn: "Cakes", nameAr: "كيك", icon: "🎂" },
      { nameEn: "Ice Cream", nameAr: "آيس كريم", icon: "🍦" },
      { nameEn: "Pastries", nameAr: "معجنات", icon: "🥐" },
    ],
  },
  {
    label: "Drinks",
    labelAr: "المشروبات",
    templates: [
      { nameEn: "Beverages", nameAr: "المشروبات", icon: "🥤" },
      { nameEn: "Soft Drinks", nameAr: "مشروبات غازية", icon: "🥫" },
      { nameEn: "Juices", nameAr: "عصائر", icon: "🧃" },
      { nameEn: "Mocktails", nameAr: "موكتيل", icon: "🍹" },
      { nameEn: "Hot Drinks", nameAr: "مشروبات ساخنة", icon: "☕" },
      { nameEn: "Coffee", nameAr: "قهوة", icon: "☕" },
      { nameEn: "Tea", nameAr: "شاي", icon: "🍵" },
    ],
  },
  {
    label: "Breakfast",
    labelAr: "الإفطار",
    templates: [
      { nameEn: "Breakfast", nameAr: "الإفطار", icon: "🍳" },
      { nameEn: "Brunch", nameAr: "برانش", icon: "🥞" },
    ],
  },
  {
    label: "Other",
    labelAr: "أخرى",
    templates: [
      { nameEn: "Specials", nameAr: "العروض الخاصة", icon: "⭐" },
      { nameEn: "Combos", nameAr: "وجبات كومبو", icon: "🍱" },
      { nameEn: "Chef's Specials", nameAr: "أطباق الشيف", icon: "👨‍🍳" },
      { nameEn: "Sauces & Dips", nameAr: "صلصات و مقبلات", icon: "🫙" },
    ],
  },
];

export function getAllTemplates(): CategoryTemplate[] {
  return CATEGORY_TEMPLATE_GROUPS.flatMap((g) => g.templates);
}
