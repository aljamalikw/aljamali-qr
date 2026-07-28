import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Page Not Found | Aljamali QR",
  description: "The page you are looking for could not be found.",
};

export default function NotFound() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            404
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-white">
            Page Not Found
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            The page you are looking for does not exist or may have been
            moved.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="menu-btn-primary">
              Back to Home
            </Link>
            <Link href="/dashboard" className="menu-btn-secondary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
