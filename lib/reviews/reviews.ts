import type { SupabaseClient } from "@supabase/supabase-js";
import { createNotification } from "@/lib/notifications/createNotification";
import { supabase } from "@/lib/supabase";

export const FEEDBACK_KINDS = [
  "compliment",
  "complaint",
  "suggestion",
] as const;
export type FeedbackKind = (typeof FEEDBACK_KINDS)[number];

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isFeedbackOrderId(value: string): boolean {
  return UUID_RE.test(value);
}

export function parseFeedbackKind(value: unknown): FeedbackKind | null {
  if (
    value === "compliment" ||
    value === "complaint" ||
    value === "suggestion"
  ) {
    return value;
  }
  return null;
}

export function feedbackKindLabel(kind: FeedbackKind): string {
  if (kind === "complaint") return "Complaint";
  if (kind === "suggestion") return "Suggestion";
  return "Feedback / Compliment";
}

export const FEEDBACK_STATUSES = ["open", "closed"] as const;
export type FeedbackStatus = (typeof FEEDBACK_STATUSES)[number];

export function parseFeedbackStatus(value: unknown): FeedbackStatus {
  return value === "closed" ? "closed" : "open";
}

export type RestaurantReview = {
  id: string;
  restaurantId: string;
  orderId: string | null;
  orderNumber: string | null;
  customerId: string | null;
  customerName: string | null;
  customerPhone: string | null;
  rating: number;
  comment: string | null;
  feedbackType: "public" | "private";
  feedbackKind: FeedbackKind;
  googleReviewClicked: boolean;
  isRead: boolean;
  status: FeedbackStatus;
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
  feedback_kind?: string | null;
  google_review_clicked: boolean;
  metadata?: unknown;
  is_read?: boolean | null;
  status?: string | null;
  created_at: string;
};

function readFeedbackKind(row: ReviewRecord): FeedbackKind {
  const fromColumn = parseFeedbackKind(row.feedback_kind);
  if (fromColumn) return fromColumn;
  const meta =
    row.metadata &&
    typeof row.metadata === "object" &&
    !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};
  return parseFeedbackKind(meta.feedback_kind) ?? "compliment";
}

function mapReview(
  row: ReviewRecord,
  orderNumber: string | null = null,
): RestaurantReview {
  return {
    id: row.id,
    restaurantId: row.restaurant_id,
    orderId: row.order_id,
    orderNumber,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    rating: Number(row.rating),
    comment: row.comment,
    feedbackType: row.feedback_type === "private" ? "private" : "public",
    feedbackKind: readFeedbackKind(row),
    googleReviewClicked: Boolean(row.google_review_clicked),
    isRead: Boolean(row.is_read),
    status: parseFeedbackStatus(row.status),
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
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / total;
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

    const rows = (data ?? []) as ReviewRecord[];
    const orderIds = [
      ...new Set(
        rows
          .map((row) => row.order_id)
          .filter((id): id is string => Boolean(id)),
      ),
    ];

    const orderNumbers = new Map<string, string>();
    if (orderIds.length > 0) {
      const { data: orders } = await supabase
        .from("orders")
        .select("id, order_number")
        .eq("restaurant_id", restaurantId)
        .in("id", orderIds);

      for (const order of (orders ?? []) as Array<{
        id: string;
        order_number: string;
      }>) {
        orderNumbers.set(order.id, order.order_number);
      }
    }

    return {
      ok: true,
      data: rows.map((row) =>
        mapReview(
          row,
          row.order_id ? (orderNumbers.get(row.order_id) ?? null) : null,
        ),
      ),
    };
  } catch {
    return { ok: false, message: "Unable to load reviews." };
  }
}

type SubmitFeedbackResult =
  | { ok: true; data: RestaurantReview }
  | { ok: false; message: string; alreadySubmitted?: boolean; status?: number };

export async function submitOrderFeedbackWithClient(
  client: SupabaseClient,
  input: {
    orderId: string;
    rating: number;
    comment?: string | null;
    feedbackKind: FeedbackKind;
  },
): Promise<SubmitFeedbackResult> {
  const orderId = input.orderId.trim();
  if (!isFeedbackOrderId(orderId)) {
    return { ok: false, message: "Invalid feedback payload.", status: 400 };
  }

  const rating = Math.min(5, Math.max(1, Math.trunc(input.rating)));
  if (rating < 1) {
    return { ok: false, message: "Please choose a star rating.", status: 400 };
  }

  const { data: order, error: orderError } = await client
    .from("orders")
    .select("id, restaurant_id, status, customer_name, customer_phone")
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return { ok: false, message: "Unable to submit feedback.", status: 404 };
  }

  const orderRow = order as {
    id: string;
    restaurant_id: string;
    status: string;
    customer_name: string | null;
    customer_phone: string | null;
  };

  if (orderRow.status === "Cancelled") {
    return {
      ok: false,
      message: "Feedback is not available for cancelled orders.",
      status: 400,
    };
  }

  const restaurantId = orderRow.restaurant_id;
  const { data: existing } = await client
    .from("restaurant_reviews")
    .select("id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (existing) {
    return {
      ok: false,
      message: "Feedback already submitted for this order.",
      alreadySubmitted: true,
      status: 409,
    };
  }

  const feedbackKind = input.feedbackKind;
  const feedbackType =
    feedbackKind === "complaint" || rating <= 3 ? "private" : "public";
  const comment = input.comment?.trim() || null;

  const payload = {
    restaurant_id: restaurantId,
    order_id: orderId,
    customer_name: orderRow.customer_name,
    customer_phone: orderRow.customer_phone,
    rating,
    comment,
    feedback_type: feedbackType,
    feedback_kind: feedbackKind,
    google_review_clicked: false,
    metadata: { feedback_kind: feedbackKind },
  };

  let insert = await client
    .from("restaurant_reviews")
    .insert(payload)
    .select("*")
    .single();

  if (
    insert.error &&
    /feedback_kind/i.test(insert.error.message || "")
  ) {
    const { feedback_kind: _unused, ...withoutKindColumn } = payload;
    void _unused;
    insert = await client
      .from("restaurant_reviews")
      .insert(withoutKindColumn)
      .select("*")
      .single();
  }

  if (insert.error || !insert.data) {
    if (insert.error?.code === "23505") {
      return {
        ok: false,
        message: "Feedback already submitted for this order.",
        alreadySubmitted: true,
        status: 409,
      };
    }
    const rawMessage = insert.error?.message || "Unable to save feedback.";
    return {
      ok: false,
      message: /schema cache|does not exist/i.test(rawMessage)
        ? "Unable to save feedback."
        : rawMessage,
      status: 500,
    };
  }

  const review = mapReview(insert.data as ReviewRecord);
  if (feedbackKind === "complaint" || rating <= 3) {
    await notifyFeedback(client, restaurantId, review);
  }
  return { ok: true, data: review };
}

async function notifyFeedback(
  client: SupabaseClient,
  restaurantId: string,
  review: RestaurantReview,
): Promise<void> {
  try {
    const { data: restaurant } = await client
      .from("restaurants")
      .select("owner_id, restaurant_name")
      .eq("id", restaurantId)
      .maybeSingle();

    const ownerId = (restaurant as { owner_id?: string } | null)?.owner_id;
    if (!ownerId) return;

    const isComplaint = review.feedbackKind === "complaint";
    await createNotification(
      {
        userId: ownerId,
        restaurantId,
        type: "new_review",
        title: isComplaint ? "New complaint" : "New private feedback",
        body: `${review.customerName || "A guest"} left a ${review.rating}★ ${
          isComplaint ? "complaint" : "review"
        }.`,
        href: "/dashboard/reviews",
        meta: {
          reviewId: review.id,
          rating: review.rating,
          feedbackKind: review.feedbackKind,
        },
      },
      client,
    );
  } catch {
    // Non-blocking
  }
}

export async function updateRestaurantReviewManagement(
  restaurantId: string,
  reviewId: string,
  patch: { isRead?: boolean; status?: FeedbackStatus },
): Promise<
  { ok: true; data: RestaurantReview } | { ok: false; message: string }
> {
  if (!restaurantId || !reviewId) {
    return { ok: false, message: "Unable to update feedback." };
  }

  const payload: { is_read?: boolean; status?: FeedbackStatus; updated_at: string } = {
    updated_at: new Date().toISOString(),
  };
  if (typeof patch.isRead === "boolean") payload.is_read = patch.isRead;
  if (patch.status) payload.status = patch.status;

  if (payload.is_read === undefined && payload.status === undefined) {
    return { ok: false, message: "Unable to update feedback." };
  }

  try {
    const { data, error } = await supabase
      .from("restaurant_reviews")
      .update(payload)
      .eq("id", reviewId)
      .eq("restaurant_id", restaurantId)
      .select("*")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        message: /schema cache|does not exist|column/i.test(error.message)
          ? "Unable to update feedback."
          : error.message,
      };
    }
    if (!data) {
      return { ok: false, message: "Feedback not found for this restaurant." };
    }
    return { ok: true, data: mapReview(data as ReviewRecord) };
  } catch {
    return { ok: false, message: "Unable to update feedback." };
  }
}

export async function submitOrderReview(input: {
  orderId: string;
  rating: number;
  comment?: string | null;
  feedbackKind: FeedbackKind;
}): Promise<SubmitFeedbackResult> {
  return submitOrderFeedbackWithClient(supabase, input);
}

export async function fetchOwnedOrderFeedback(orderId: string): Promise<
  | {
      ok: true;
      data: {
        orderNumber: string;
        customerName: string | null;
        review: RestaurantReview | null;
      };
    }
  | { ok: false; message: string }
> {
  try {
    if (!isFeedbackOrderId(orderId)) {
      return { ok: false, message: "Unable to load feedback." };
    }

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, restaurant_id, order_number, customer_name")
      .eq("id", orderId)
      .maybeSingle();

    if (error || !order) {
      return { ok: false, message: "Unable to load feedback." };
    }

    const orderRow = order as {
      id: string;
      restaurant_id: string;
      order_number: string;
      customer_name: string | null;
    };

    const { data: existing } = await supabase
      .from("restaurant_reviews")
      .select("*")
      .eq("order_id", orderId)
      .eq("restaurant_id", orderRow.restaurant_id)
      .maybeSingle();

    return {
      ok: true,
      data: {
        orderNumber: orderRow.order_number,
        customerName: orderRow.customer_name,
        review: existing
          ? mapReview(existing as ReviewRecord, orderRow.order_number)
          : null,
      },
    };
  } catch {
    return { ok: false, message: "Unable to load feedback." };
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
      return { ok: false, message: "Unable to load feedback." };
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
    return { ok: false, message: "Unable to load feedback." };
  }
}
