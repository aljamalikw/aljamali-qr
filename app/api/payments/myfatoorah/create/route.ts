import { NextRequest, NextResponse } from "next/server";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";
import {
  getAppBaseUrl,
  getMyFatoorahConfig,
} from "@/lib/payments/myfatoorah/config";
import { executeMyFatoorahPayment } from "@/lib/payments/myfatoorah/client";
import {
  getPlanMonthlyPriceFromDb,
  isPricedPlan,
} from "@/lib/payments/myfatoorah/pricing";

type CreatePaymentBody = {
  restaurantId?: unknown;
  plan?: unknown;
};

type RestaurantRow = {
  id: string;
  restaurant_name: string | null;
  owner_name: string | null;
  email: string | null;
  currency: string | null;
};

type PaymentInsertRow = {
  id: string;
};

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function serverError(message: string) {
  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(request: NextRequest) {
  let body: CreatePaymentBody;

  try {
    body = (await request.json()) as CreatePaymentBody;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const restaurantId =
    typeof body.restaurantId === "string" ? body.restaurantId.trim() : "";
  const plan = typeof body.plan === "string" ? body.plan.trim() : "";

  if (!restaurantId) {
    return badRequest("restaurantId is required.");
  }
  if (!plan) {
    return badRequest("plan is required.");
  }
  if (!isPricedPlan(plan) || plan === "Enterprise") {
    return badRequest(
      "plan must be Starter or Professional. Enterprise requires Contact Sales.",
    );
  }

  const mfConfig = getMyFatoorahConfig();
  if (!mfConfig.ok) {
    return serverError(mfConfig.message);
  }

  let supabase;
  try {
    supabase = createServiceSupabaseClient();
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Supabase admin client failed.";
    return serverError(message);
  }

  const { data: restaurantData, error: restaurantError } = await supabase
    .from("restaurants")
    .select("id, restaurant_name, owner_name, email, currency")
    .eq("id", restaurantId)
    .maybeSingle();

  if (restaurantError) {
    return serverError(restaurantError.message);
  }
  if (!restaurantData) {
    return badRequest("Restaurant not found.");
  }

  const restaurant = restaurantData as RestaurantRow;

  const pricing = await getPlanMonthlyPriceFromDb(supabase, plan);
  if (!pricing.ok) {
    return serverError(pricing.message);
  }

  const currency = (
    restaurant.currency?.trim() ||
    pricing.currency ||
    "KWD"
  ).toUpperCase();
  const amount = pricing.amount;

  const customerName =
    restaurant.owner_name?.trim() ||
    restaurant.restaurant_name?.trim() ||
    "Restaurant Owner";
  const customerEmail = restaurant.email?.trim() || "billing@aljamaliqr.com";

  const { data: paymentData, error: paymentInsertError } = await supabase
    .from("payments")
    .insert({
      restaurant_id: restaurantId,
      amount,
      currency,
      payment_method: "myfatoorah",
      status: "pending",
      invoice_number: null,
    })
    .select("id")
    .single();

  if (paymentInsertError || !paymentData) {
    return serverError(
      paymentInsertError?.message || "Failed to create pending payment record.",
    );
  }

  const payment = paymentData as PaymentInsertRow;
  const appBaseUrl = getAppBaseUrl(request.nextUrl.origin);
  const callBackUrl = `${appBaseUrl}/dashboard/subscription?payment=success&paymentId=${encodeURIComponent(payment.id)}`;
  const errorUrl = `${appBaseUrl}/dashboard/subscription?payment=error&paymentId=${encodeURIComponent(payment.id)}`;

  try {
    const result = await executeMyFatoorahPayment(mfConfig.config, {
      invoiceValue: amount,
      currencyIso: currency,
      customerName,
      customerEmail,
      customerReference: restaurantId,
      callBackUrl,
      errorUrl,
      userDefinedField: payment.id,
    });

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        invoice_number: String(result.invoiceId),
      })
      .eq("id", payment.id);

    if (updateError) {
      return serverError(
        `Payment created at MyFatoorah but failed to store invoice ID: ${updateError.message}`,
      );
    }

    return NextResponse.json({
      paymentUrl: result.paymentUrl,
      invoiceId: result.invoiceId,
      paymentId: payment.id,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to create MyFatoorah payment.";

    // Keep the pending row for audit; admin can reconcile manually.
    await supabase
      .from("payments")
      .update({
        payment_method: "myfatoorah_failed",
      })
      .eq("id", payment.id);

    return serverError(message);
  }
}
