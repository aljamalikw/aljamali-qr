"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { t } from "@/lib/public-menu/i18n";
import type { PublicLanguage } from "@/lib/public-menu/types";
import {
  FEEDBACK_KINDS,
  type FeedbackKind,
} from "@/lib/reviews/reviews";

type CustomerFeedbackFormProps = {
  orderId: string;
  lang: PublicLanguage;
  onSubmitted: () => void;
};

const KIND_COPY: Record<FeedbackKind, "feedbackKindCompliment" | "feedbackKindComplaint" | "feedbackKindSuggestion"> = {
  compliment: "feedbackKindCompliment",
  complaint: "feedbackKindComplaint",
  suggestion: "feedbackKindSuggestion",
};

export function CustomerFeedbackForm({
  orderId,
  lang,
  onSubmitted,
}: CustomerFeedbackFormProps) {
  const [rating, setRating] = useState(0);
  const [feedbackKind, setFeedbackKind] = useState<FeedbackKind>("compliment");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stars = useMemo(() => [1, 2, 3, 4, 5], []);
  const onSubmittedRef = useRef(onSubmitted);

  useEffect(() => {
    onSubmittedRef.current = onSubmitted;
  }, [onSubmitted]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/reviews/submit?orderId=${encodeURIComponent(orderId)}`,
        );
        const json = (await res.json()) as { alreadySubmitted?: boolean };
        if (!cancelled && json.alreadySubmitted) {
          onSubmittedRef.current();
        }
      } catch {
        // Form remains available; submit will re-check.
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (rating < 1) {
      setError(t("ratingRequired", lang));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/reviews/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          rating,
          feedbackKind,
          comment: comment.trim() || null,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        alreadySubmitted?: boolean;
      };
      if (json.alreadySubmitted) {
        onSubmitted();
        return;
      }
      if (!res.ok || !json.ok) {
        setError(json.message || t("feedbackSubmitError", lang));
        return;
      }
      onSubmitted();
    } catch {
      setError(t("feedbackSubmitError", lang));
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <p className="text-center text-sm text-white/45">
        {t("loadingFeedback", lang)}
      </p>
    );
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="w-full text-start">
      <h3 className="font-serif text-xl font-bold text-white">
        {t("feedbackTitle", lang)}
      </h3>
      <p className="mt-1 text-sm text-white/55">{t("feedbackDesc", lang)}</p>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/45">
        {t("overallRating", lang)}
      </p>
      <div className="mt-2 flex justify-center gap-2">
        {stars.map((value) => (
          <button
            key={value}
            type="button"
            aria-label={`${value} ${value === 1 ? "star" : "stars"}`}
            onClick={() => {
              setRating(value);
              setError(null);
            }}
            className={`h-11 w-11 rounded-xl border text-xl transition ${
              rating >= value
                ? "border-gold/40 bg-gold/15 text-gold"
                : "border-white/10 bg-white/5 text-white/35 hover:border-white/20"
            }`}
          >
            ★
          </button>
        ))}
      </div>

      <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-white/45">
        {t("feedbackTypeLabel", lang)}
      </p>
      <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {FEEDBACK_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => setFeedbackKind(kind)}
            className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
              feedbackKind === kind
                ? "border-gold/40 bg-gold/15 text-gold"
                : "border-white/10 bg-black/20 text-white/60 hover:border-white/20"
            }`}
          >
            {t(KIND_COPY[kind], lang)}
          </button>
        ))}
      </div>

      <label className="mt-5 block text-xs font-semibold uppercase tracking-wider text-white/45">
        {t("feedbackMessageOptional", lang)}
      </label>
      <textarea
        value={comment}
        onChange={(event) => setComment(event.target.value)}
        rows={3}
        placeholder={t("feedbackMessagePlaceholder", lang)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15"
      />

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={submitting || rating < 1}
        className="menu-btn-primary mt-5 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? t("submittingFeedback", lang) : t("submitFeedback", lang)}
      </button>
    </form>
  );
}
