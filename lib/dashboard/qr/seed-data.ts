import type { QrTypeMeta } from "./types";

export const qrTypes: QrTypeMeta[] = [
  { value: "restaurant-table", label: "Restaurant Table" },
  { value: "vip-room", label: "VIP Room" },
  { value: "outdoor", label: "Outdoor" },
  { value: "delivery", label: "Delivery" },
  { value: "takeaway", label: "Takeaway" },
  { value: "kitchen", label: "Kitchen" },
  { value: "custom", label: "Custom" },
];

export function getQrTypeLabel(type: string): string {
  return qrTypes.find((t) => t.value === type)?.label ?? type;
}
