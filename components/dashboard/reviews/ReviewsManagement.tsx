"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExportMenu, exportFormatSuccessLabel } from "@/components/dashboard/ExportMenu";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { FormSkeleton, StatCardSkeleton } from "@/components/ui/Skeleton";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import { isAdminRole } from "@/lib/auth/roles";
import {
  feedbackKindLabel,
  fetchRestaurantReviews,
  summarizeReviews,
  type FeedbackKind,
  type RestaurantReview,
} from "@/lib/reviews/reviews";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { planAllowsReviews } from "@/lib/subscriptions/plans";
import { buildReviewsExportDataset } from "@/lib/export/datasets/reviews";
import { useToast } from "@/components/ui/ToastProvider";

type KindFilter = "all" | FeedbackKind;
type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;

const KIND_FILTERS: { id: KindFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "compliment", label: "Feedback / Compliments" },
  { id: "complaint", label: "Complaints" },
  { id: "suggestion", label: "Suggestions" },
];

const RATING_FILTERS: { id: RatingFilter; label: string }[] = [
  { id: "all", label: "All ratings" },
  { id: 5, label: "5★" },
  { id: 4, label: "4★" },
  { id: 3, label: "3★" },
  { id: 2, label: "2★" },
  { id: 1, label: "1★" },
];

function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function filterClass(active: boolean): string {
  return `rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
    active
      ? "border-gold/40 bg-gold/15 text-gold"
      : "border-white/10 bg-white/5 text-white/60 hover:border-gold/25 hover:text-white"
  }`;
}

export function ReviewsManagement() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { access, loading: accessLoading } = useSubscriptionAccess();
  const { role, loading: authLoading } = useAuthUser();
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [ratingFilter, setRatingFilter] = useState<RatingFilter>("all");

  const allowed =
    isAdminRole(role) || planAllowsReviews(access.locationPlan);
  const restaurantId = restaurant?.id ?? null;

  const applyResult = useCallback(
    (
      result:
        | { ok: true; data: RestaurantReview[] }
        | { ok: false; message: string },
    ) => {
      if (!result.ok) {
        setError(result.message);
        setReviews([]);
        setLoading(false);
        return;
      }
      setReviews(result.data);
      setError(null);
      setLoading(false);
    },
    [],
  );

  const load = useCallback(async () => {
    if (!restaurantId || !allowed) return;
    const result = await fetchRestaurantReviews(restaurantId);
    applyResult(result);
  }, [restaurantId, allowed, applyResult]);

  useEffect(() => {
    if (!restaurantId || !allowed) return;
    let cancelled = false;
    void (async () => {
      const result = await fetchRestaurantReviews(restaurantId);
      if (cancelled) return;
      applyResult(result);
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurantId, allowed, applyResult]);

  const filtered = useMemo(() => {
    return reviews.filter((review) => {
      if (kindFilter !== "all" && review.feedbackKind !== kindFilter) {
        return false;
      }
      if (ratingFilter !== "all" && review.rating !== ratingFilter) {
        return false;
      }
      return true;
    });
  }, [reviews, kindFilter, ratingFilter]);

  const summary = useMemo(() => summarizeReviews(filtered), [filtered]);

  const restaurantName =
    restaurant?.restaurant_name?.trim() || "Restaurant";

  const getExportDataset = useCallback(
    () =>
      buildReviewsExportDataset({
        reviews: filtered,
        summary,
        restaurantName,
      }),
    [filtered, summary, restaurantName],
  );

  if (accessLoading || authLoading || restaurantLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <FormSkeleton />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="mx-auto max-w-3xl">
        <DashboardCard className="p-6 sm:p-8" hover={false}>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
            Feedback & Complaints
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-white">
            Guest feedback on Professional+
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Collect star ratings and feedback after customers place an order.
            Available on Professional and Enterprise plans.
          </p>
          <Link
            href="/dashboard/subscription"
            className="menu-btn-primary mt-5 inline-flex"
          >
            View plans
          </Link>
        </DashboardCard>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-white/50">
          Complete restaurant onboarding to manage feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Feedback & Complaints
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Customer ratings and comments from this restaurant&apos;s orders.
          </p>
        </div>
        <ExportMenu
          getDataset={getExportDataset}
          disabled={loading}
          onEmpty={() =>
            showToast("No data matches the current filters.", "error")
          }
          onError={(message) => showToast(message, "error")}
          onSuccess={(format, rowCount) =>
            showToast(
              format === "pdf"
                ? exportFormatSuccessLabel(format)
                : `✓ Exported ${rowCount} reviews`,
            )
          }
        />
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Average rating", value: summary.averageRating.toFixed(1) },
            { label: "Total feedback", value: String(summary.totalReviews) },
            { label: "Positive %", value: `${summary.positivePct}%` },
            { label: "Negative %", value: `${summary.negativePct}%` },
          ].map((kpi, index) => (
            <DashboardCard key={kpi.label} delay={index * 0.05} className="p-5">
              <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
                {kpi.label}
              </p>
              <p className="mt-3 font-serif text-3xl font-bold text-white">
                {kpi.value}
              </p>
            </DashboardCard>
          ))}
        </div>
      )}

      <DashboardCard className="p-5 sm:p-6" hover={false}>
        <h2 className="font-serif text-xl font-bold text-white">All feedback</h2>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {KIND_FILTERS.map((filter) => (
            <button
              key={filter.id}
              type="button"
              onClick={() => setKindFilter(filter.id)}
              className={filterClass(kindFilter === filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {RATING_FILTERS.map((filter) => (
            <button
              key={String(filter.id)}
              type="button"
              onClick={() => setRatingFilter(filter.id)}
              className={filterClass(ratingFilter === filter.id)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {error ? (
          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">{error}</p>
            <button
              type="button"
              className="menu-btn-primary mt-4"
              onClick={() => void load()}
            >
              Try again
            </button>
          </div>
        ) : loading ? (
          <p className="mt-6 text-sm text-white/45">Loading feedback…</p>
        ) : reviews.length === 0 ? (
          <p className="mt-6 text-sm text-white/45">
            No feedback yet. Customers can send feedback after placing an order.
          </p>
        ) : filtered.length === 0 ? (
          <p className="mt-6 text-sm text-white/45">
            No feedback matches the current filters.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {filtered.map((review) => {
              const isComplaint = review.feedbackKind === "complaint";
              return (
                <li
                  key={review.id}
                  className={`rounded-xl border px-4 py-3 ${
                    isComplaint
                      ? "border-rose-400/25 bg-rose-500/5"
                      : "border-white/5 bg-black/20"
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-white">
                        {review.rating}★
                        {review.customerName ? ` · ${review.customerName}` : ""}
                      </p>
                      <p
                        className={`mt-0.5 text-xs font-medium uppercase tracking-wider ${
                          isComplaint ? "text-rose-300/80" : "text-white/40"
                        }`}
                      >
                        {feedbackKindLabel(review.feedbackKind)}
                      </p>
                    </div>
                    <span className="text-xs text-white/35">
                      {formatSubmittedAt(review.createdAt)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/45">
                    Order {review.orderNumber || review.orderId || "—"}
                  </p>
                  {review.comment ? (
                    <p className="mt-2 text-sm text-white/60">{review.comment}</p>
                  ) : (
                    <p className="mt-2 text-sm text-white/35">No written message</p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
