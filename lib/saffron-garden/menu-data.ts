import type { CategoryMeta, Language, MenuItem } from "./types";

export const RESTAURANT = {
  name: { en: "Saffron Garden", ar: "حديقة الزعفران" },
  tagline: {
    en: "Fine Mediterranean & Gulf Cuisine",
    ar: "مطبخ متوسطي وخليجي فاخر",
  },
  coverImage:
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
  whatsapp: "96550000000",
} as const;

export const categories: CategoryMeta[] = [
  { id: "starters", label: { en: "Starters", ar: "المقبلات" }, icon: "🥗" },
  { id: "soups", label: { en: "Soups", ar: "الشوربات" }, icon: "🍲" },
  { id: "salads", label: { en: "Salads", ar: "السلطات" }, icon: "🥬" },
  {
    id: "main-course",
    label: { en: "Main Course", ar: "الأطباق الرئيسية" },
    icon: "🍽️",
  },
  { id: "burgers", label: { en: "Burgers", ar: "البرجر" }, icon: "🍔" },
  { id: "pizza", label: { en: "Pizza", ar: "البيتزا" }, icon: "🍕" },
  { id: "pasta", label: { en: "Pasta", ar: "الباستا" }, icon: "🍝" },
  { id: "desserts", label: { en: "Desserts", ar: "الحلويات" }, icon: "🍰" },
  { id: "drinks", label: { en: "Drinks", ar: "المشروبات" }, icon: "🥤" },
];

export const menuItems: MenuItem[] = [
  {
    id: "st-1",
    category: "starters",
    name: { en: "Hummus Royale", ar: "حمص رويال" },
    description: {
      en: "Creamy chickpea dip with tahini, olive oil, and pine nuts",
      ar: "حمص كريمي مع الطحينة وزيت الزيتون والصنوبر",
    },
    price: 2.75,
    image: "https://images.unsplash.com/photo-1668236540534-995f3a0d4a2a?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "st-2",
    category: "starters",
    name: { en: "Spicy Lamb Kibbeh", ar: "كبة لحم حارة" },
    description: {
      en: "Crispy bulgur shells filled with spiced minced lamb",
      ar: "قشرة برغل مقرمشة محشوة بلحم الغنم المتبل",
    },
    price: 3.5,
    image: "https://images.unsplash.com/photo-1601050690597-df0568fa7098?w=600&q=80",
    spicy: true,
    chefSpecial: true,
  },
  {
    id: "st-3",
    category: "starters",
    name: { en: "Stuffed Grape Leaves", ar: "ورق عنب محشي" },
    description: {
      en: "Hand-rolled vine leaves with rice, herbs, and lemon",
      ar: "ورق عنب ملفوف يدوياً مع الأرز والأعشاب والليمون",
    },
    price: 2.95,
    image: "https://images.unsplash.com/photo-1625944236921-2b879f03698c?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "sp-1",
    category: "soups",
    name: { en: "Lentil Soup", ar: "شوربة عدس" },
    description: {
      en: "Traditional red lentil soup with cumin and fresh lemon",
      ar: "شوربة عدس تقليدية مع الكمون والليمون الطازج",
    },
    price: 1.85,
    image: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "sp-2",
    category: "soups",
    name: { en: "Seafood Chowder", ar: "شوربة مأكولات بحرية" },
    description: {
      en: "Rich cream soup with shrimp, fish, and saffron broth",
      ar: "شوربة كريمية غنية بالروبيان والسمك ومرق الزعفران",
    },
    price: 3.25,
    image: "https://images.unsplash.com/photo-1626200419199-3912954a2c5b?w=600&q=80",
    chefSpecial: true,
  },
  {
    id: "sp-3",
    category: "soups",
    name: { en: "Tomato Basil Soup", ar: "شوربة طماطم بالريحان" },
    description: {
      en: "Roasted tomato soup with fresh basil and a touch of cream",
      ar: "شوربة طماطم مشوية مع ريحان طازج ولمسة من الكريمة",
    },
    price: 2.15,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "sa-1",
    category: "salads",
    name: { en: "Fattoush Garden", ar: "فتوش الحديقة" },
    description: {
      en: "Mixed greens, tomatoes, radish, and crispy pita chips",
      ar: "خضار مشكلة، طماطم، فجل، ورقائق خبز مقرمشة",
    },
    price: 2.65,
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "sa-2",
    category: "salads",
    name: { en: "Quinoa Power Bowl", ar: "طبق الكينوا" },
    description: {
      en: "Quinoa, avocado, roasted chickpeas, and tahini dressing",
      ar: "كينوا، أفوكado، حمص محمّص، وصلصة طحينة",
    },
    price: 3.15,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&q=80",
    vegetarian: true,
    chefSpecial: true,
  },
  {
    id: "sa-3",
    category: "salads",
    name: { en: "Caesar Royale", ar: "سلطة سيزر رويال" },
    description: {
      en: "Romaine lettuce, parmesan crisps, and house Caesar dressing",
      ar: "خس رومaine مع جبنة بارمezan مقرمشة وصلصة سيزر منزلية",
    },
    price: 2.85,
    image: "https://images.unsplash.com/photo-1550304943-4f24f11dd0f0?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "mc-1",
    category: "main-course",
    name: { en: "Grilled Hammour", ar: "همور مشوي" },
    description: {
      en: "Fresh Gulf hammour fillet with herb butter and grilled vegetables",
      ar: "فillet سمك همور طازج من الخليج مع زبدة الأعشاب وخضار مشوية",
    },
    price: 8.95,
    image: "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&q=80",
    chefSpecial: true,
  },
  {
    id: "mc-2",
    category: "main-course",
    name: { en: "Lamb Ouzi", ar: "أوزي لحم" },
    description: {
      en: "Slow-roasted lamb shoulder on spiced rice with roasted nuts",
      ar: "كتف غنم مشوي ببطء على أرز متبل مع مكسرات محمصة",
    },
    price: 9.5,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80",
  },
  {
    id: "mc-3",
    category: "main-course",
    name: { en: "Spicy Chicken Machboos", ar: "مجبوس دجاج حار" },
    description: {
      en: "Aromatic basmati rice with tender chicken and baharat spices",
      ar: "أرز بسمتي عطري مع دجاج طري وبهارات مشكلة",
    },
    price: 5.75,
    image: "https://images.unsplash.com/photo-1603133872878-684f208fb589?w=600&q=80",
    spicy: true,
  },
  {
    id: "bg-1",
    category: "burgers",
    name: { en: "Saffron Wagyu Burger", ar: "برجر وagyu زعفران" },
    description: {
      en: "Premium wagyu patty, aged cheddar, saffron aioli, brioche bun",
      ar: "قطعة لحم وagyu فاخرة، شيدر معتق، مايونيز زعفران، خبز brioche",
    },
    price: 6.25,
    image: "https://images.unsplash.com/photo-1568901347635-c5570a71a092?w=600&q=80",
    chefSpecial: true,
  },
  {
    id: "bg-2",
    category: "burgers",
    name: { en: "Garden Veggie Burger", ar: "برجر نباتي" },
    description: {
      en: "Grilled portobello, halloumi, roasted peppers, and pesto",
      ar: "بورتobello مشوي، حلوم، فلفل محمص، وبستو",
    },
    price: 4.5,
    image: "https://images.unsplash.com/photo-1520072959219-c595dc870360?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "bg-3",
    category: "burgers",
    name: { en: "Spicy Chicken Burger", ar: "برجر دجاج حار" },
    description: {
      en: "Crispy chicken, harissa mayo, pickles, and slaw on brioche",
      ar: "دجاج مقرمش، مايونيز هرissa، مخلل، وslaw على خبز brioche",
    },
    price: 4.95,
    image: "https://images.unsplash.com/photo-1572802419224-296b0a5650de?w=600&q=80",
    spicy: true,
  },
  {
    id: "pz-1",
    category: "pizza",
    name: { en: "Truffle Margherita", ar: "مارgherita ترuffle" },
    description: {
      en: "San Marzano tomatoes, buffalo mozzarella, fresh basil, truffle oil",
      ar: "طماطم San Marzano، موزارella جاموس، ريحان طازج، زيت ترuffle",
    },
    price: 5.5,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80a002?w=600&q=80",
    vegetarian: true,
    chefSpecial: true,
  },
  {
    id: "pz-2",
    category: "pizza",
    name: { en: "Spicy Diavola", ar: "ديavola حارة" },
    description: {
      en: "Spicy salami, chili flakes, mozzarella, and tomato base",
      ar: "سالami حار، فلفل حار، موزارella، وصلصة طماطم",
    },
    price: 5.25,
    image: "https://images.unsplash.com/photo-1628840042765-356cda07504e?w=600&q=80",
    spicy: true,
  },
  {
    id: "pz-3",
    category: "pizza",
    name: { en: "Four Cheese Garden", ar: "بيتزا الأجبان الأربعة" },
    description: {
      en: "Mozzarella, gorgonzola, parmesan, and ricotta on thin crust",
      ar: "موزارella، gorgonzola، بارmesan، وricotta على عجينة رقيقة",
    },
    price: 5.75,
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "pa-1",
    category: "pasta",
    name: { en: "Lobster Linguine", ar: "linguine كركند" },
    description: {
      en: "Fresh linguine in saffron cream sauce with Atlantic lobster",
      ar: "linguine طازجة بصلصة كريمة الزعفران مع كركند أطلسي",
    },
    price: 7.85,
    image: "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=600&q=80",
    chefSpecial: true,
  },
  {
    id: "pa-2",
    category: "pasta",
    name: { en: "Penne Arrabbiata", ar: "penne arrabbiata" },
    description: {
      en: "Penne in fiery tomato sauce with garlic and fresh parsley",
      ar: "penne بصلصة طماطم حارة مع الثوم والبقدونس الطازج",
    },
    price: 4.25,
    image: "https://images.unsplash.com/photo-1563379926898-05f4575a58d5?w=600&q=80",
    spicy: true,
    vegetarian: true,
  },
  {
    id: "pa-3",
    category: "pasta",
    name: { en: "Creamy Mushroom Fettuccine", ar: "fettuccine فطر كريمي" },
    description: {
      en: "Wild mushrooms, garlic cream sauce, and shaved truffle",
      ar: "فطر بري، صلصة كريمة بالثوم، وترuffle مبشور",
    },
    price: 4.75,
    image: "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "ds-1",
    category: "desserts",
    name: { en: "Knafeh Napoli", ar: "كنافة نابoli" },
    description: {
      en: "Warm knafeh with akawi cheese, pistachios, and rose syrup",
      ar: "كنافة ساخنة مع جبنة عكawi، فستق، وشراب الورد",
    },
    price: 2.95,
    image: "https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=600&q=80",
    chefSpecial: true,
  },
  {
    id: "ds-2",
    category: "desserts",
    name: { en: "Dark Chocolate Fondant", ar: "فondant شوكolade داكن" },
    description: {
      en: "Molten dark chocolate center with vanilla bean ice cream",
      ar: "قلب شوكolade داكنة ذائبة مع آيس كريم فانيلia",
    },
    price: 3.35,
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "ds-3",
    category: "desserts",
    name: { en: "Umm Ali", ar: "أم علي" },
    description: {
      en: "Traditional Egyptian bread pudding with nuts and cream",
      ar: "حلوى أم علي تقليدية مع المكسرات والكريمة",
    },
    price: 2.65,
    image: "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "dr-1",
    category: "drinks",
    name: { en: "Saffron Latte", ar: "latte زعفرan" },
    description: {
      en: "Espresso with steamed milk infused with Kuwaiti saffron",
      ar: "إسpresso مع حليب مبخر منقوع بالزعفرan الكويتي",
    },
    price: 1.75,
    image: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80",
    vegetarian: true,
    chefSpecial: true,
  },
  {
    id: "dr-2",
    category: "drinks",
    name: { en: "Fresh Mint Lemonade", ar: "ليمonada نعnaع" },
    description: {
      en: "House-made lemonade with fresh mint and crushed ice",
      ar: "ليمonada منزلية مع نعnaع طازج وثلج مجروش",
    },
    price: 1.45,
    image: "https://images.unsplash.com/photo-1523677011781-c91e1a2a325a?w=600&q=80",
    vegetarian: true,
  },
  {
    id: "dr-3",
    category: "drinks",
    name: { en: "Mango Lassi", ar: "lassi مانgo" },
    description: {
      en: "Creamy yogurt blend with Alphonso mango and cardamom",
      ar: "مزيج زبادي كريمي مع مانgo Alphonso والهيل",
    },
    price: 1.65,
    image: "https://images.unsplash.com/photo-1623065424887-8af8182a8ec8?w=600&q=80",
    vegetarian: true,
  },
];

export const uiStrings = {
  searchPlaceholder: {
    en: "Search dishes...",
    ar: "ابحث عن الأطباق...",
  },
  allCategories: { en: "All", ar: "الكل" },
  noResults: {
    en: "No dishes found. Try a different search.",
    ar: "لم يتم العثور على أطباق. جرّب بحثاً مختلفاً.",
  },
  chefSpecial: { en: "Chef's Special", ar: "طبق الشيف" },
  vegetarian: { en: "Vegetarian", ar: "نباتي" },
  spicy: { en: "Spicy", ar: "حار" },
  poweredBy: { en: "Powered by Aljamali QR", ar: "مدعوم من Aljamali QR" },
  orderVia: { en: "Order via WhatsApp", ar: "اطلب عبر واتساب" },
  backToHome: { en: "Back to Home", ar: "العودة للرئيسية" },
  items: { en: "items", ar: "طبق" },
  clearSearch: { en: "Clear", ar: "مسح" },
} as const;

export function formatPrice(price: number, lang: Language): string {
  const formatted = price.toFixed(3);
  return lang === "ar" ? `${formatted} د.ك` : `${formatted} KD`;
}

export function t(key: keyof typeof uiStrings, lang: Language): string {
  return uiStrings[key][lang];
}
