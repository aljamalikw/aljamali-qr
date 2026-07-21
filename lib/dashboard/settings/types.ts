export interface RestaurantSettings {
  nameEn: string;
  nameAr: string;
  taglineEn: string;
  taglineAr: string;
  phone: string;
  whatsapp: string;
  email: string;
  addressEn: string;
  addressAr: string;
  logoUrl: string;
  coverUrl: string;
  showPrices: boolean;
  bilingualMenu: boolean;
  whatsappOrders: boolean;
  tableQrOrdering: boolean;
  showNutrition: boolean;
  darkModeDefault: boolean;
}

export const defaultSettings: RestaurantSettings = {
  nameEn: "Saffron Garden",
  nameAr: "حديقة الزعفران",
  taglineEn: "Fine Mediterranean & Gulf Cuisine",
  taglineAr: "مطبخ متوسطي وخليجي فاخر",
  phone: "+965 2222 3344",
  whatsapp: "96550000000",
  email: "hello@saffrongarden.com",
  addressEn: "Salem Al Mubarak St, Salmiya, Kuwait City",
  addressAr: "شارع سالم المبارك، السالمية، مدينة الكويت",
  logoUrl: "",
  coverUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80",
  showPrices: true,
  bilingualMenu: true,
  whatsappOrders: true,
  tableQrOrdering: true,
  showNutrition: false,
  darkModeDefault: true,
};
