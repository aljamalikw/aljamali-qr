import { NextResponse } from "next/server";
import {
  isFeedbackOrderId,
  parseFeedbackKind,
  submitOrderFeedbackWithClient,
} from "@/lib/reviews/reviews";
import { createServiceSupabaseClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const orderId =
      new URL(request.url).searchParams.get("orderId")?.trim() ?? "";
    if (!isFeedbackOrderId(orderId)) {
      return NextResponse.json(
        { ok: false, alreadySubmitted: false, message: "Invalid order." },
        { status: 400 },
      );
    }

    const client = createServiceSupabaseClient();
    const { data: existing } = await client
      .from("restaurant_reviews")
      .select("id")
      .eq("order_id", orderId)
      .maybeSingle();

    return NextResponse.json({
      ok: true,
      alreadySubmitted: Boolean(existing),
    });
  } catch {
    return NextResponse.json(
      { ok: false, alreadySubmitted: false, message: "Unable to check feedback." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      orderId?: string;
      rating?: number;
      comment?: string | null;
      feedbackKind?: string;
    };

    const orderId = body.orderId?.trim() ?? "";
    const feedbackKind = parseFeedbackKind(body.feedbackKind);
    const rating = Math.min(5, Math.max(1, Math.trunc(Number(body.rating) || 0)));

    if (!isFeedbackOrderId(orderId) || !feedbackKind || rating < 1) {
      return NextResponse.json(
        { ok: false, message: "Invalid feedback payload." },
        { status: 400 },
      );
    }

    const result = await submitOrderFeedbackWithClient(
      createServiceSupabaseClient(),
      {
        orderId,
        rating,
        comment: body.comment,
        feedbackKind,
      },
    );

    if (!result.ok) {
      return NextResponse.json(
        {
          ok: false,
          message: result.message,
          alreadySubmitted: Boolean(result.alreadySubmitted),
        },
        { status: result.status ?? 400 },
      );
    }

    return NextResponse.json({ ok: true, data: result.data });
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
