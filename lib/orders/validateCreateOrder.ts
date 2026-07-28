import type { CreateOrderInput, OrderType } from "./types";

export type CreateOrderValidationResult =
  | { ok: true }
  | { ok: false; message: string };

export function validateCreateOrder(
  input: Pick<
    CreateOrderInput,
    | "orderType"
    | "customerName"
    | "customerPhone"
    | "deliveryAddress"
    | "landmark"
    | "tableNumber"
    | "items"
  >,
): CreateOrderValidationResult {
  if (!input.items.length) {
    return { ok: false, message: "Your cart is empty." };
  }

  const orderType: OrderType = input.orderType;

  if (orderType === "Dine In") {
    if (!input.tableNumber?.trim()) {
      return { ok: false, message: "Please confirm your table number." };
    }
    return { ok: true };
  }

  if (orderType === "Takeaway") {
    return { ok: true };
  }

  // Delivery
  if (!input.customerName?.trim() || !input.customerPhone?.trim()) {
    return { ok: false, message: "Please enter your name and phone number." };
  }
  if (!input.deliveryAddress?.trim()) {
    return { ok: false, message: "Please enter a delivery address." };
  }

  return { ok: true };
}
