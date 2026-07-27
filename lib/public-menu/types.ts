export type PublicLanguage = "en" | "ar";

export type PublicRestaurant = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  coverUrl: string | null;
  currency: string;
  phone: string | null;
  aboutUs: string;
  cuisineType: string;
  galleryUrls: string[];
  openingHours: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  whatsappNumber: string;
  website: string;
  googleMapsUrl: string;
  reservationsEnabled: boolean;
  onlineOrderingEnabled: boolean;
  taxRate: number;
};

export type PublicCategory = {
  id: string;
  nameEn: string;
  nameAr: string;
  icon: string;
  sortOrder: number;
};

export type PublicMenuItem = {
  id: string;
  categoryId: string;
  nameEn: string;
  nameAr: string;
  descriptionEn: string;
  descriptionAr: string;
  price: number;
  discountPrice: number | null;
  image: string;
  vegetarian: boolean;
  vegan: boolean;
  glutenFree: boolean;
  halal: boolean;
  spicy: boolean;
  chefSpecial: boolean;
  popular: boolean;
  recommended: boolean;
  preparationTime: string;
  calories: string;
  sortOrder: number;
};

export type PublicCategoryGroup = {
  category: PublicCategory;
  items: PublicMenuItem[];
};

export type PublicMenuData = {
  restaurant: PublicRestaurant;
  groups: PublicCategoryGroup[];
  totalItems: number;
  popularItems: PublicMenuItem[];
  recommendedItems: PublicMenuItem[];
  chefSpecialItems: PublicMenuItem[];
  offerItems: PublicMenuItem[];
};
