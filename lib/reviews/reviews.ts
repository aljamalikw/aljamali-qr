import { createNotification } from "@/lib/notifications/createNotification";
import { supabase } from "@/lib/supabase";

export type RestaurantReview = {
  id: string;
  restaurantId: string;
  orderId: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  rating: number;
  comment: string | null;
  feedbackType: "public" | "private";
  googleReviewClicked: boolean;
  createdAt: string;
};

export type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  positivePct: number;
  negativePct: number;
};

type ReviewRecord = {
  id: string;
  restaurant_id: string;
  order_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  rating: number;
  comment: string | null;
  feedback_type: string;
  google_review_clicked: boolean;
  created_at: string;
};

function mapReview(row: ReviewRecord): RestaurantReview {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    orderId: row.order_id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    rating: Number(row.rating),
    comment: row.comment,
    feedbackType: row.feedback_type === "private" ? "private" : "public",
    googleReviewClicked: Boolean(row.google_review_clicked),
    createdAt: row.created_at,
  };
}

export function summarizeReviews(reviews: RestaurantReview[]): ReviewSummary {
  if (reviews.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      positivePct: 0,
      negativePct: 0,
    };
  }
  const total = reviews.length;
  const avg =
    reviews.reduce((sum, r) => sum + r.rating, 0) / total;
  const positive = reviews.filter((r) => r.rating >= 4).length;
  const negative = reviews.filter((r) => r.rating <= 3).length;
  return {
    averageRating: Math.round(avg * 10) / 10,
    totalReviews: total,
    positivePct: Math.round((positive / total) * 1000) / 10,
    negativePct: Math.round((negative / total) * 1000) / 10,
  };
}

export async function fetchRestaurantReviews(
  restaurantId: string,
): Promise<
  { ok: true; data: RestaurantReview[] } | { ok: false; message: string }
> {
  try {
    const { data, error } = await supabase
      .from("restaurant_reviews")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) return { ok: false, message: error.message };
    return {
      ok: true,
      data: ((data ?? []) as ReviewRecord[]).map(mapReview),
    };
  } catch {
    return { ok: false, message: "Unable to load reviews." };
  }
}

export async function submitOrderReview(input: {
  restaurantId: string;
  orderId: string;
  rating: number;
  comment?: string | null;
  googleReviewClicked?: boolean;
}): Promise<
  { ok: true; data: RestaurantReview } | { ok: false; message: string }
> {
  try {
    const rating = Math.min(5, Math.max(1, Math.trunc(input.rating)));
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select(
        "id, restaurant_id, status, customer_name, customer_phone, customer_email",
      )
      .eq("id", input.orderId)
      .eq("restaurant_id", input.restaurantId)
      .maybeSingle();

    if (orderError || !order) {
      return { ok: false, message: "Order not found." };
    }

    const orderRow = order as {
      id: string;
      restaurant_id: string;
      status: string;
      customer_name: string | null;
      customer_phone: string | null;
    };

    if (orderRow.status !== "Completed") {
      return {
        ok: false,
        message: "Feedback is available after the order is completed.",
      };
    }

    const feedbackType = rating >= 4 ? "public" : "private";

    const { data, error } = await supabase
      .from("restaurant_reviews")
      .upsert(
        {
          restaurant_id: input.restaurantId,
          order_id: input.orderId,
          customer_name: orderRow.customer_name,
          customer_phone: orderRow.customer_phone,
          rating,
          comment: input.comment?.trim() || null,
          feedback_type: feedbackType,
          google_review_clicked: Boolean(input.googleReviewClicked),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "order_id" },
      )
      .select("*")
      .single();

    if (error || !data) {
      // Unique index is partial — fallback to insert if upsert unsupported.
      const insert = await supabase
        .from("restaurant_reviews")
        .insert({
          restaurant_id: input.restaurantId,
          order_id: input.orderId,
          customer_name: orderRow.customer_name,
          customer_phone: orderRow.customer_phone,
          rating,
          comment: input.comment?.trim() || null,
          feedback_type: feedbackType,
          google_review_clicked: Boolean(input.googleReviewClicked),
        })
        .select("*")
        .single();
      if (insert.error || !insert.data) {
        return {
          ok: false,
          message:
            insert.error?.message ||
            error?.message ||
            "Unable to save feedback.",
        };
      }
      await notifyLowRating(input.restaurantId, mapReview(insert.data as ReviewRecord));
      return { ok: true, data: mapReview(insert.data as ReviewRecord) };
    }

    const review = mapReview(data as ReviewRecord);
    if (rating <= 3) {
      await notifyLowRating(input.restaurantId, review);
    }
    return { ok: true, data: review };
  } catch {
    return { ok: false, message: "Unable to submit feedback." };
  }
}

async function notifyLowRating(
  restaurantId: string,
  review: RestaurantReview,
): Promise<void> {
  try {
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("owner_id, restaurant_name")
      .eq("id", restaurantId)
      .maybeSingle();

    const ownerId = (restaurant as { owner_id?: string } | null)?.owner_id;
    if (!ownerId) return;

    await createNotification({
      userId: ownerId,
      restaurantId,
      type: "new_review",
      title: "New private feedback",
      body: `${review.customerName || "A guest"} left a ${review.rating}★ review.`,
      href: "/dashboard/reviews",
      meta: { reviewId: review.id, rating: review.rating },
    });
  } catch {
    // Non-blocking
  }
}

export async function fetchOrderForReview(
  orderId: string,
  restaurantId?: string,
): Promise<
  | {
      ok: true;
      data: {
        orderId: string;
        restaurantId: string;
        restaurantName: string;
        googleReviewUrl: string | null;
        status: string;
        customerName: string | null;
        alreadyReviewed: boolean;
      };
    }
  | { ok: false; message: string }
> {
  try {
    let query = supabase
      .from("orders")
      .select("id, restaurant_id, status, customer_name")
      .eq("id", orderId);
    if (restaurantId) query = query.eq("restaurant_id", restaurantId);

    const { data: order, error } = await query.maybeSingle();
    if (error || !order) {
      return { ok: false, message: "Order not found." };
    }

    const orderRow = order as {
      id: string;
      restaurant_id: string;
      status: string;
      customer_name: string | null;
    };

    const [{ data: restaurant }, { data: existing }] = await Promise.all([
      supabase
        .from("restaurants")
        .select("restaurant_name, google_maps_url, metadata")
        .eq("id", orderRow.restaurant_id)
        .maybeSingle(),
      supabase
        .from("restaurant_reviews")
        .select("id")
        .eq("order_id", orderId)
        .maybeSingle(),
    ]);

    const meta =
      restaurant &&
      typeof (restaurant as { metadata?: unknown }).metadata === "object" &&
      (restaurant as { metadata: Record<string, unknown> }).metadata
        ? (restaurant as { metadata: Record<string, unknown> }).metadata
        : {};

    const googleReviewUrl =
      (typeof meta.google_review_url === "string" && meta.google_review_url) ||
      (typeof (restaurant as { google_maps_url?: string } | null)
        ?.google_maps_url === "string"
        ? (restaurant as { google_maps_url?: string }).google_maps_url!
        : null);

    return {
      ok: true,
      data: {
        orderId: orderRow.id,
        restaurantId: orderRow.restaurant_id,
        restaurantName:
          (restaurant as { restaurant_name?: string } | null)?.restaurant_name?.trim() ||
          "Restaurant",
        googleReviewUrl,
        status: orderRow.status,
        customerName: orderRow.customer_name,
        alreadyReviewed: Boolean(existing),
      },
    };
  } catch {
    return { ok: false, message: "Unable to load review form." };
  }
}
