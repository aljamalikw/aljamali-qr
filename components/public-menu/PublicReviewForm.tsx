"use client";

import { useMemo, useState } from "react";

type ReviewOrderInfo = {
  orderId: string;
  restaurantId: string;
  restaurantName: string;
  googleReviewUrl: string | null;
  customerName: string | null;
  alreadyReviewed: boolean;
  status: string;
};

export function PublicReviewForm({ order }: { order: ReviewOrderInfo }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(order.alreadyReviewed);
  const [googleClicked, setGoogleClicked] = useState(false);

  const showGoogle = rating >= 4;
  const showPrivateComment = rating >= 1 && rating <= 3;

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);

  if (order.status !== "Completed") {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-white">
          Feedback unavailable
        </h1>
        <p className="mt-2 text-sm text-white/55">
          This order is not completed yet.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-center">
        <h1 className="font-serif text-2xl font-bold text-white">Thank you</h1>
        <p className="mt-2 text-sm text-white/55">
          Your feedback for {order.restaurantName} has been recorded.
        </p>
        {showGoogle && order.googleReviewUrl ? (
          <a
            href={order.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="menu-btn-primary mt-5 inline-flex"
            onClick={() => setGoogleClicked(true)}
          >
            Leave a Google review
          </a>
        ) : null}
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1) {
      setError("Please choose a star rating.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: order.restaurantId,
          orderId: order.orderId,
          rating,
          comment: showPrivateComment ? comment : comment || null,
          googleReviewClicked: googleClicked,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setError(json.message || "Unable to submit feedback.");
        setSubmitting(false);
        return;
      }
      setDone(true);
    } catch {
      setError("Unable to submit feedback.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="rounded-2xl border border-white/10 bg-black/30 p-6 sm:p-8"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-200/90">
        {order.restaurantName}
      </p>
      <h1 className="mt-2 font-serif text-3xl font-bold text-white">
        How was your visit?
      </h1>
      <p className="mt-2 text-sm text-white/55">
        {order.customerName
          ? `Thanks ${order.customerName} — tap a star to rate your order.`
          : "Tap a star to rate your order."}
      </p>

      <div className="mt-6 flex justify-center gap-2">
        {stars.map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} star${value === 1 ? "" : "s"}`}
            onClick={() => setRating(value)}
            className={`h-12 w-12 rounded-xl border text-xl transition ${
              rating >= value
                ? "border-amber-300/50 bg-amber-300/20 text-amber-200"
                : "border-white/10 bg-white/5 text-white/35 hover:border-white/20"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      {showPrivateComment ? (
        <div className="mt-6">
          <label className="text-sm text-white/60" htmlFor="private-comment">
            Private feedback (shared only with the restaurant)
          </label>
          <textarea
            id="private-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-amber-200/40 focus:outline-none"
            placeholder="Tell us what we can improve…"
          />
        </div>
      ) : null}

      {showGoogle && order.googleReviewUrl ? (
        <div className="mt-6 rounded-xl border border-amber-200/20 bg-amber-200/5 p-4 text-center">
          <p className="text-sm text-white/70">
            Glad you enjoyed it — a public Google review helps a lot.
          </p>
          <a
            href={order.googleReviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="menu-btn-secondary mt-3 inline-flex"
            onClick={() => setGoogleClicked(true)}
          >
            Open Google review
          </a>
        </div>
      ) : null}

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || rating < 1}
        className="menu-btn-primary mt-6 w-full disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit feedback"}
      </button>
    </form>
  );
}
