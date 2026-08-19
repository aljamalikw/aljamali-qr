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
  fetchRestaurantReviews,
  summarizeReviews,
  type RestaurantReview,
} from "@/lib/reviews/reviews";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { planAllowsReviews } from "@/lib/subscriptions/plans";
import { buildReviewsExportDataset } from "@/lib/export/datasets/reviews";
import { useToast } from "@/components/ui/ToastProvider";

export function ReviewsManagement() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { access, loading: accessLoading } = useSubscriptionAccess();
  const { role, loading: authLoading } = useAuthUser();
  const [reviews, setReviews] = useState<RestaurantReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const allowed =
    isAdminRole(role) || planAllowsReviews(access.locationPlan);

  const load = useCallback(async () => {
    if (!restaurant?.id || !allowed) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    const result = await fetchRestaurantReviews(restaurant.id);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      setReviews([]);
      return;
    }
    setReviews(result.data);
  }, [restaurant?.id, allowed]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => summarizeReviews(reviews), [reviews]);

  const restaurantName =
    restaurant?.restaurant_name?.trim() || "Restaurant";

  const getExportDataset = useCallback(
    () =>
      buildReviewsExportDataset({
        reviews,
        summary,
        restaurantName,
      }),
    [reviews, summary, restaurantName],
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
            Reviews
          </p>
          <h1 className="mt-2 font-serif text-2xl font-bold text-white">
            Guest feedback on Professional+
          </h1>
          <p className="mt-2 text-sm text-white/55">
            Collect star ratings and private feedback after completed orders.
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
          Complete restaurant onboarding to manage reviews.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Reviews
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Guest ratings and feedback from completed orders.
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
            { label: "Total reviews", value: String(summary.totalReviews) },
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
        <h2 className="font-serif text-xl font-bold text-white">All reviews</h2>
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
          <p className="mt-6 text-sm text-white/45">Loading reviews…</p>
        ) : reviews.length === 0 ? (
          <p className="mt-6 text-sm text-white/45">
            No reviews yet. Share feedback links from completed orders.
          </p>
        ) : (
          <ul className="mt-5 space-y-3">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="rounded-xl border border-white/5 bg-black/20 px-4 py-3"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">
                      {review.customerName || "Guest"} · {review.rating}★
                    </p>
                    <p className="mt-0.5 text-xs uppercase tracking-wider text-white/40">
                      {review.feedbackType}
                    </p>
                  </div>
                  <span className="text-xs text-white/35">
                    {review.createdAt.slice(0, 10)}
                  </span>
                </div>
                {review.comment ? (
                  <p className="mt-2 text-sm text-white/60">{review.comment}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </DashboardCard>
    </div>
  );
}
