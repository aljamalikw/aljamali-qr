"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  feedbackKindLabel,
  fetchOwnedOrderFeedback,
  type RestaurantReview,
} from "@/lib/reviews/reviews";

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

function StaffGate() {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
      <h1 className="font-serif text-2xl font-bold text-white">
        Restaurant feedback view
      </h1>
      <p className="mt-2 text-sm text-white/55">
        This page is for restaurant staff. Customers now send feedback from the
        order confirmation screen.
      </p>
      <p className="mt-3 text-sm text-white/55">
        View submissions in Dashboard → Feedback & Complaints.
      </p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link href="/login" className="menu-btn-secondary">
          Staff sign in
        </Link>
        <Link href="/dashboard/reviews" className="menu-btn-primary">
          Open Feedback & Complaints
        </Link>
      </div>
    </div>
  );
}

function FeedbackDetails({
  orderNumber,
  customerName,
  review,
}: {
  orderNumber: string;
  customerName: string | null;
  review: RestaurantReview | null;
}) {
  if (!review) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
          Restaurant view
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-white">
          No customer feedback yet
        </h1>
        <p className="mt-2 text-sm text-white/55">
          Customers can submit feedback from the order confirmation screen after
          placing order {orderNumber}.
        </p>
        <Link href="/dashboard/reviews" className="menu-btn-primary mt-6 inline-flex">
          Open Feedback & Complaints
        </Link>
      </div>
    );
  }

  const isComplaint = review.feedbackKind === "complaint";

  return (
    <div
      className={`rounded-2xl border p-6 ${
        isComplaint
          ? "border-rose-400/25 bg-rose-500/5"
          : "border-white/10 bg-black/30"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
        Restaurant view
      </p>
      <h1 className="mt-2 font-serif text-2xl font-bold text-white">
        Customer feedback
      </h1>
      <p className="mt-4 text-sm text-white/70">
        {review.rating}★ · {feedbackKindLabel(review.feedbackKind)}
      </p>
      <p className="mt-1 text-sm text-white/50">Order {orderNumber}</p>
      {customerName ? (
        <p className="mt-1 text-sm text-white/50">{customerName}</p>
      ) : null}
      <p className="mt-1 text-xs text-white/40">
        {formatSubmittedAt(review.createdAt)}
      </p>
      {review.comment ? (
        <p className="mt-4 text-sm text-white/70">{review.comment}</p>
      ) : (
        <p className="mt-4 text-sm text-white/35">No written message</p>
      )}
      <Link href="/dashboard/reviews" className="menu-btn-primary mt-6 inline-flex">
        Open Feedback & Complaints
      </Link>
    </div>
  );
}

export function RestaurantOrderFeedbackView({ orderId }: { orderId: string }) {
  const { user, loading: authLoading } = useAuthUser();
  const [payload, setPayload] = useState<
    | {
        orderNumber: string;
        customerName: string | null;
        review: RestaurantReview | null;
      }
    | null
    | undefined
  >(undefined);

  useEffect(() => {
    if (authLoading || !user) return;

    let cancelled = false;
    void (async () => {
      const result = await fetchOwnedOrderFeedback(orderId);
      if (cancelled) return;
      setPayload(result.ok ? result.data : null);
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, user, orderId]);

  if (authLoading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
        <p className="text-sm text-white/55">Loading…</p>
      </div>
    );
  }

  if (!user) {
    return <StaffGate />;
  }

  if (payload === undefined) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
        <p className="text-sm text-white/55">Loading…</p>
      </div>
    );
  }

  if (payload === null) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-white">
          No customer feedback is available
        </h1>
        <p className="mt-2 text-sm text-white/55">
          This page is for restaurant staff. View submissions in Dashboard →
          Feedback & Complaints.
        </p>
        <Link href="/dashboard/reviews" className="menu-btn-primary mt-6 inline-flex">
          Open Feedback & Complaints
        </Link>
      </div>
    );
  }

  return (
    <FeedbackDetails
      orderNumber={payload.orderNumber}
      customerName={payload.customerName}
      review={payload.review}
    />
  );
}
