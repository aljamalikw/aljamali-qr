import { menuItems } from "@/lib/saffron-garden/menu-data";
import type { DashboardMenuItem } from "./types";

const prepTimes = [10, 12, 15, 18, 20, 25, 30, 35, 40, 45];
const calorieValues = [180, 220, 280, 320, 380, 420, 480, 520, 580, 650];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

export const initialMenuItems: DashboardMenuItem[] = menuItems.map(
  (item, index) => ({
    id: item.id,
    category: item.category,
    name: { ...item.name },
    description: { ...item.description },
    price: item.price,
    image: item.image,
    preparationTime: prepTimes[index % prepTimes.length],
    calories: calorieValues[index % calorieValues.length],
    available: index % 7 !== 5,
    chefSpecial: item.chefSpecial ?? false,
    vegetarian: item.vegetarian ?? false,
    spicy: item.spicy ?? false,
    createdAt: daysAgo(index + 1),
  }),
);
