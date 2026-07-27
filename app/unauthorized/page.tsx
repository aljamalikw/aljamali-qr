import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Unauthorized | Aljamali QR",
  description: "You do not have permission to access this area.",
};

export default function UnauthorizedPage() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            403
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-white">
            Unauthorized
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            You do not have permission to access this area of Aljamali QR.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/dashboard" className="menu-btn-primary">
              Restaurant Dashboard
            </Link>
            <Link href="/admin/login" className="menu-btn-secondary">
              Admin Login
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
