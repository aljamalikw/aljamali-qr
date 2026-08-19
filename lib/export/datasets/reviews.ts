import type { RestaurantReview, ReviewSummary } from "@/lib/reviews/reviews";
import type { ExportDataset } from "../types";

export function buildReviewsExportDataset(input: {
  reviews: RestaurantReview[];
  summary: ReviewSummary;
  restaurantName: string;
  orderNumbers?: Map<string, string>;
}): ExportDataset {
  const rows = input.reviews.map((review) => ({
    rating: review.rating,
    comment: review.comment ?? "",
    customerName: review.customerName ?? "",
    orderNumber: review.orderId
      ? (input.orderNumbers?.get(review.orderId) ?? review.orderId)
      : "",
    date: review.createdAt,
    restaurant: input.restaurantName,
  }));

  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    label: `${star} star`,
    value: String(input.reviews.filter((review) => review.rating === star).length),
  }));

  return {
    filenamePrefix: "reviews",
    meta: {
      title: "Reviews Export",
      restaurantName: input.restaurantName,
    },
    columns: [
      { key: "rating", header: "Rating", type: "number" },
      { key: "comment", header: "Comment" },
      { key: "customerName", header: "Customer Name" },
      { key: "orderNumber", header: "Order Number" },
      { key: "date", header: "Date", type: "datetime" },
      { key: "restaurant", header: "Restaurant" },
    ],
    rows,
    summary: [
      { label: "Average rating", value: input.summary.averageRating.toFixed(1) },
      { label: "Review count", value: String(input.summary.totalReviews) },
      { label: "Positive %", value: `${input.summary.positivePct}%` },
      { label: "Negative %", value: `${input.summary.negativePct}%` },
      ...distribution,
    ],
  };
}
