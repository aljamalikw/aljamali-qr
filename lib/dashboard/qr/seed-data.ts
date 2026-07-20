import type { QrCodeItem, QrTypeMeta } from "./types";

export const qrTypes: QrTypeMeta[] = [
  { value: "restaurant-table", label: "Restaurant Table" },
  { value: "vip-room", label: "VIP Room" },
  { value: "outdoor", label: "Outdoor" },
  { value: "delivery", label: "Delivery" },
  { value: "takeaway", label: "Takeaway" },
  { value: "kitchen", label: "Kitchen" },
  { value: "custom", label: "Custom" },
];

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

function hoursAgo(hours: number): string {
  const date = new Date();
  date.setHours(date.getHours() - hours);
  return date.toISOString();
}

export const initialQrCodes: QrCodeItem[] = [
  {
    id: "qr-1",
    name: "Table 1",
    type: "restaurant-table",
    status: "active",
    tableNumber: "1",
    description: "Main dining area — window seat",
    url: "https://aljamaliqr.com/demo?table=1",
    totalScans: 842,
    todayScans: 28,
    lastScan: hoursAgo(1),
    createdAt: daysAgo(45),
  },
  {
    id: "qr-2",
    name: "Table 7",
    type: "restaurant-table",
    status: "active",
    tableNumber: "7",
    description: "Main dining area — center",
    url: "https://aljamaliqr.com/demo?table=7",
    totalScans: 1204,
    todayScans: 42,
    lastScan: hoursAgo(0.5),
    createdAt: daysAgo(45),
  },
  {
    id: "qr-3",
    name: "Table 12",
    type: "restaurant-table",
    status: "active",
    tableNumber: "12",
    description: "Main dining area — corner booth",
    url: "https://aljamaliqr.com/demo?table=12",
    totalScans: 956,
    todayScans: 35,
    lastScan: hoursAgo(2),
    createdAt: daysAgo(40),
  },
  {
    id: "qr-4",
    name: "VIP Room A",
    type: "vip-room",
    status: "active",
    tableNumber: "VIP-A",
    description: "Private dining room with dedicated service",
    url: "https://aljamaliqr.com/demo?room=vip-a",
    totalScans: 312,
    todayScans: 8,
    lastScan: hoursAgo(4),
    createdAt: daysAgo(30),
  },
  {
    id: "qr-5",
    name: "Garden Terrace",
    type: "outdoor",
    status: "active",
    tableNumber: "",
    description: "Outdoor seating area",
    url: "https://aljamaliqr.com/demo?zone=outdoor",
    totalScans: 478,
    todayScans: 18,
    lastScan: hoursAgo(3),
    createdAt: daysAgo(25),
  },
  {
    id: "qr-6",
    name: "Delivery Menu",
    type: "delivery",
    status: "active",
    tableNumber: "",
    description: "QR for delivery partners and drivers",
    url: "https://aljamaliqr.com/demo?mode=delivery",
    totalScans: 2156,
    todayScans: 64,
    lastScan: hoursAgo(0.25),
    createdAt: daysAgo(60),
  },
  {
    id: "qr-7",
    name: "Takeaway Counter",
    type: "takeaway",
    status: "active",
    tableNumber: "",
    description: "Pickup orders at the front counter",
    url: "https://aljamaliqr.com/demo?mode=takeaway",
    totalScans: 1680,
    todayScans: 52,
    lastScan: hoursAgo(1.5),
    createdAt: daysAgo(55),
  },
  {
    id: "qr-8",
    name: "Kitchen Display",
    type: "kitchen",
    status: "inactive",
    tableNumber: "",
    description: "Internal kitchen reference menu",
    url: "https://aljamaliqr.com/demo?mode=kitchen",
    totalScans: 89,
    todayScans: 0,
    lastScan: daysAgo(5),
    createdAt: daysAgo(20),
  },
  {
    id: "qr-9",
    name: "Event Catering",
    type: "custom",
    status: "inactive",
    tableNumber: "",
    description: "Custom QR for private events",
    url: "https://aljamaliqr.com/demo?event=catering",
    totalScans: 156,
    todayScans: 0,
    lastScan: daysAgo(12),
    createdAt: daysAgo(15),
  },
];

export function getQrTypeLabel(type: string): string {
  return qrTypes.find((t) => t.value === type)?.label ?? type;
}
