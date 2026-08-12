import type { CreateOrderInput, OrderType } from "./types";

export type CreateOrderValidationResult =
  | { ok: true }
  | { ok: false; message: string };

function isValidEmail(email: string): boolean {
  // Practical checkout check — not a full RFC parser.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Public checkout validation.
 * Every order type requires customer name + phone so CRM can sync.
 */
export function validateCreateOrder(
  input: Pick<
    CreateOrderInput,
    | "orderType"
    | "customerName"
    | "customerPhone"
    | "customerEmail"
    | "deliveryAddress"
    | "landmark"
    | "tableNumber"
    | "items"
  >,
): CreateOrderValidationResult {
  if (!input.items.length) {
    return { ok: false, message: "Your cart is empty." };
  }

  const name = input.customerName?.trim() ?? "";
  const phone = input.customerPhone?.trim() ?? "";
  const email = input.customerEmail?.trim() ?? "";

  if (name.length < 2) {
    return {
      ok: false,
      message: "Please enter your full name (at least 2 characters).",
    };
  }
  if (!phone) {
    return { ok: false, message: "Please enter your mobile number." };
  }
  if (email && !isValidEmail(email)) {
    return { ok: false, message: "Please enter a valid email address." };
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
  if (!input.deliveryAddress?.trim()) {
    return { ok: false, message: "Please enter a delivery address." };
  }

  return { ok: true };
}
