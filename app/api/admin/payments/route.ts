import { NextRequest, NextResponse } from "next/server";
import {
  badRequest,
  requirePlatformAdmin,
  serverError,
} from "@/lib/admin/api-auth";
import {
  createManualPaymentAsAdmin,
  PAYMENT_METHOD_OPTIONS,
} from "@/lib/admin/payment-management";
import { PAYMENT_STATUSES, type PaymentStatus } from "@/lib/admin/payments";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

type CreateBody = {
  ownerId?: unknown;
  amount?: unknown;
  currency?: unknown;
  paymentMethod?: unknown;
  status?: unknown;
  paidAt?: unknown;
  reference?: unknown;
  notes?: unknown;
  paymentDate?: unknown;
};

function asPaymentStatus(value: unknown): PaymentStatus | null {
  if (typeof value !== "string") return null;
  return (PAYMENT_STATUSES as readonly string[]).includes(value)
    ? (value as PaymentStatus)
    : null;
}

export async function POST(request: NextRequest) {
  const auth = await requirePlatformAdmin(request);
  if (!auth.ok) return auth.response;

  let body: CreateBody;
  try {
    body = (await request.json()) as CreateBody;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const ownerId = typeof body.ownerId === "string" ? body.ownerId.trim() : "";
  const amount =
    typeof body.amount === "number"
      ? body.amount
      : typeof body.amount === "string"
        ? Number(body.amount)
        : NaN;
  const paymentMethod =
    typeof body.paymentMethod === "string" ? body.paymentMethod.trim() : "";
  const status = asPaymentStatus(body.status);

  if (!ownerId) return badRequest("ownerId is required.");
  if (!Number.isFinite(amount) || amount <= 0) {
    return badRequest("amount must be a positive number.");
  }
  if (
    !paymentMethod ||
    !(PAYMENT_METHOD_OPTIONS as readonly string[]).includes(paymentMethod)
  ) {
    return badRequest("paymentMethod is invalid.");
  }
  if (!status) return badRequest("status is invalid.");

  let client;
  try {
    client = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Service client unavailable.";
    return serverError(message);
  }

  const result = await createManualPaymentAsAdmin(
    client,
    {
      ownerId,
      amount,
      currency: typeof body.currency === "string" ? body.currency : "KWD",
      paymentMethod,
      status,
      paidAt: typeof body.paidAt === "string" ? body.paidAt : null,
      reference: typeof body.reference === "string" ? body.reference : null,
      notes: typeof body.notes === "string" ? body.notes : null,
      paymentDate:
        typeof body.paymentDate === "string" ? body.paymentDate : null,
    },
    {
      userId: auth.userId,
      email: auth.email,
      role: auth.role,
    },
  );

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, data: result.data });
}
