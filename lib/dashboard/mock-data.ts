import type { ActivityItem, DashboardStat, RestaurantProfile } from "./types";

export const restaurantProfile: RestaurantProfile = {
  name: "Saffron Garden",
  initials: "SG",
  plan: "Premium",
  userName: "Layla Al-Mutairi",
  userRole: "Restaurant Owner",
  avatarUrl: null,
  notificationCount: 3,
};

export const dashboardStats: DashboardStat[] = [
  {
    id: "qr-scans",
    label: "QR Scans Today",
    value: "248",
    change: "+18% vs yesterday",
    trend: "up",
    icon: "qr-scans",
  },
  {
    id: "menu-views",
    label: "Total Menu Views",
    value: "1,842",
    change: "+12% this week",
    trend: "up",
    icon: "views",
  },
  {
    id: "active-tables",
    label: "Active Tables",
    value: "14",
    change: "6 tables scanning now",
    trend: "neutral",
    icon: "tables",
  },
  {
    id: "total-categories",
    label: "Total Categories",
    value: "9",
    change: "27 menu items live",
    trend: "neutral",
    icon: "categories",
  },
];

export const recentActivity: ActivityItem[] = [
  {
    id: "act-1",
    title: "QR scan — Table 12",
    description: "Guest opened the dinner menu in English",
    time: "2 min ago",
    type: "scan",
  },
  {
    id: "act-2",
    title: "Menu view spike",
    description: "48 views in the last hour during lunch service",
    time: "18 min ago",
    type: "view",
  },
  {
    id: "act-3",
    title: "Item updated",
    description: "Grilled Hammour price changed to 8.950 KD",
    time: "1 hr ago",
    type: "update",
  },
  {
    id: "act-4",
    title: "QR scan — Table 7",
    description: "Guest switched to Arabic menu view",
    time: "1 hr ago",
    type: "scan",
  },
  {
    id: "act-5",
    title: "WhatsApp order inquiry",
    description: "Guest requested the Chef's Special platter",
    time: "2 hrs ago",
    type: "order",
  },
  {
    id: "act-6",
    title: "Category published",
    description: "Desserts section went live with 3 new items",
    time: "3 hrs ago",
    type: "update",
  },
];

export const quickInsights = [
  {
    id: "insight-1",
    label: "Peak hour",
    value: "7:30 PM",
    detail: "Most scans today",
  },
  {
    id: "insight-2",
    label: "Top category",
    value: "Main Course",
    detail: "412 views this week",
  },
  {
    id: "insight-3",
    label: "Language split",
    value: "62% / 38%",
    detail: "English / Arabic",
  },
];
