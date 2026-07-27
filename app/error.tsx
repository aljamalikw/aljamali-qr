"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Error
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-white">
            Something went wrong
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            An unexpected error occurred while loading this page. You can try
            again or head back to safety.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => reset()}
              className="menu-btn-primary"
            >
              Try Again
            </button>
            <Link href="/" className="menu-btn-secondary">
              Back to Home
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
