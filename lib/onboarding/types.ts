export type RestaurantInfoFormData = {
  restaurantName: string;
  restaurantType: string;
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
  timezone: string;
  preferredLanguage: string;
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
