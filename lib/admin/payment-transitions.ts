import type { PaymentStatus } from "@/lib/admin/payments";

/** Allowed admin payment status transitions. Terminal states have no outbound edges. */
const ALLOWED: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ["paid", "failed", "overdue"],
  overdue: ["paid", "failed", "pending"],
  failed: ["paid", "pending"],
  paid: ["refunded"],
  refunded: [],
};

export function canTransitionPaymentStatus(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  if (from === to) return true;
  return ALLOWED[from]?.includes(to) ?? false;
}

export function assertPaymentStatusTransition(
  from: PaymentStatus,
  to: PaymentStatus,
): string | null {
  if (from === to) return null;
  if (canTransitionPaymentStatus(from, to)) return null;
  return `Cannot change payment status from "${from}" to "${to}".`;
}

export const DESTRUCTIVE_PAYMENT_TRANSITIONS: Array<{
  from: PaymentStatus;
  to: PaymentStatus;
}> = [{ from: "paid", to: "refunded" }];

export function requiresPaymentTransitionConfirm(
  from: PaymentStatus,
  to: PaymentStatus,
): boolean {
  return DESTRUCTIVE_PAYMENT_TRANSITIONS.some(
    (item) => item.from === from && item.to === to,
  );
}
