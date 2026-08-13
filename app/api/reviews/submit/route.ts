import { NextResponse } from "next/server";
import { createNotification } from "@/lib/notifications/createNotification";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      restaurantId?: string;
      orderId?: string;
      rating?: number;
      comment?: string | null;
      googleReviewClicked?: boolean;
    };

    const restaurantId = body.restaurantId?.trim();
    const orderId = body.orderId?.trim();
    const rating = Math.min(5, Math.max(1, Math.trunc(Number(body.rating) || 0)));

    if (!restaurantId || !orderId || rating < 1) {
      return NextResponse.json(
        { ok: false, message: "Invalid feedback payload." },
        { status: 400 },
      );
    }

    const client = createServiceSupabaseClient();

    const { data: order, error: orderError } = await client
      .from("orders")
      .select("id, restaurant_id, status, customer_name, customer_phone")
      .eq("id", orderId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    if (orderError || !order) {
      return NextResponse.json(
        { ok: false, message: "Order not found." },
        { status: 404 },
      );
    }

    const orderRow = order as {
      id: string;
      restaurant_id: string;
      status: string;
      customer_name: string | null;
      customer_phone: string | null;
    };

    if (orderRow.status !== "Completed") {
      return NextResponse.json(
        {
          ok: false,
          message: "Feedback is available after the order is completed.",
        },
        { status: 400 },
      );
    }

    const { data: existing } = await client
      .from("restaurant_reviews")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { ok: false, message: "Feedback already submitted for this order." },
        { status: 409 },
      );
    }

    const feedbackType = rating >= 4 ? "public" : "private";
    const { data, error } = await client
      .from("restaurant_reviews")
      .insert({
        restaurant_id: restaurantId,
        order_id: orderId,
        customer_name: orderRow.customer_name,
        customer_phone: orderRow.customer_phone,
        rating,
        comment: body.comment?.trim() || null,
        feedback_type: feedbackType,
        google_review_clicked: Boolean(body.googleReviewClicked),
      })
      .select("*")
      .single();

    if (error || !data) {
      return NextResponse.json(
        { ok: false, message: error?.message || "Unable to save feedback." },
        { status: 500 },
      );
    }

    if (rating <= 3) {
      const { data: restaurant } = await client
        .from("restaurants")
        .select("owner_id")
        .eq("id", restaurantId)
        .maybeSingle();
      const ownerId = (restaurant as { owner_id?: string } | null)?.owner_id;
      if (ownerId) {
        await createNotification(
          {
            userId: ownerId,
            restaurantId,
            type: "new_review",
            title: "New private feedback",
            body: `${orderRow.customer_name || "A guest"} left a ${rating}★ review.`,
            href: "/dashboard/reviews",
            meta: {
              reviewId: (data as { id: string }).id,
              rating,
            },
          },
          client,
        );
      }
    }

    return NextResponse.json({ ok: true, data });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to submit feedback.",
      },
      { status: 500 },
    );
  }
}
