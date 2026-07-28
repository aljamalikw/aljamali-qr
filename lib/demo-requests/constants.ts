import type {
  CurrentMenuTypeOption,
  DemoRequestFormData,
  DemoRequestPriority,
  DemoRequestStatus,
  RestaurantTypeOption,
} from "./types";

export const RESTAURANT_TYPE_OPTIONS: RestaurantTypeOption[] = [
  "Restaurant",
  "Cafe",
  "Bakery",
  "Hotel",
  "Food Truck",
  "Cloud Kitchen",
  "Other",
];

export const DEMO_REQUEST_STATUS_OPTIONS: DemoRequestStatus[] = [
  "New",
  "Contacted",
  "Scheduled",
  "Completed",
  "Customer",
  "Closed",
];

export const PRIORITY_OPTIONS: DemoRequestPriority[] = [
  "Low",
  "Medium",
  "High",
  "Urgent",
];

export const SALESPERSON_OPTIONS = [
  "Unassigned",
  "Sara",
  "Omar",
  "Layla",
  "Khalid",
] as const;

export const CURRENT_MENU_TYPE_OPTIONS: CurrentMenuTypeOption[] = [
  "Paper Menu",
  "QR Menu",
  "Tablet Menu",
  "No Menu",
];

export const PREFERRED_TIME_OPTIONS = [
  "10:00 AM",
  "11:00 AM",
  "12:00 PM",
  "1:00 PM",
  "2:00 PM",
  "3:00 PM",
  "4:00 PM",
  "5:00 PM",
  "6:00 PM",
  "7:00 PM",
] as const;

export const SUCCESS_CONFIRMATION_CARDS = [
  "Request Received",
  "We will contact you",
  "Live Restaurant Demonstration",
  "No obligation",
] as const;

export function createEmptyDemoRequestForm(): DemoRequestFormData {
  return {
    restaurantName: "",
    contactPerson: "",
    mobileNumber: "",
    email: "",
    city: "",
    restaurantType: "",
    branches: "1",
    preferredDate: "",
    preferredTime: "",
    alternateDate: "",
    currentMenuType: "",
    notes: "",
  };
}
