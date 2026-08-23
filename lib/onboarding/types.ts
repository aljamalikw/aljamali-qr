export type RestaurantInfoFormData = {
  restaurantName: string;
  restaurantType: string;
  cuisineType: string;
  aboutUs: string;
  ownerName: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  addressEn: string;
  city: string;
  country: string;
  googleMapsUrl: string;
  openingHours: string;
  logoUrl: string;
};

export type PreferencesFormData = {
  currency: string;
  timezone: string;
  preferredLanguage: string;
  bilingualMenu: boolean;
  reservationsEnabled: boolean;
};

export type BrandingFormData = {
  logoUrl: string;
  coverUrl: string;
  faviconUrl: string;
  themePrimaryColor: string;
  menuAccentColor: string;
  fontStyle: string;
  darkModeDefault: boolean;
};

export type OnboardingQrResult = {
  name: string;
  url: string;
};

export type AdvanceOnboardingOptions = {
  /** Mark the previous step as skipped in activity + completed_steps. */
  skipped?: boolean;
};
