import type { Metadata } from "next";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Under Maintenance | Aljamali QR",
  description: "Aljamali QR is undergoing scheduled maintenance.",
};

export default function MaintenancePage() {
  return (
    <AuthLayout>
      <AuthCard>
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/20 bg-gold/10 text-gold">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-7 w-7"
              aria-hidden="true"
            >
              <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L2 19v3h3l7.3-7.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2-2z" />
            </svg>
          </div>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Scheduled Maintenance
          </p>
          <h1 className="mt-3 font-serif text-3xl font-bold text-white">
            We&apos;ll be right back
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Aljamali QR is currently undergoing scheduled maintenance to bring
            you an even better experience. Please check back shortly.
          </p>
          <p className="mt-8 text-xs text-white/35">
            Need urgent help? Reach us at{" "}
            <a
              href="mailto:hello@aljamaliqr.com"
              className="text-gold hover:underline"
            >
              hello@aljamaliqr.com
            </a>
          </p>
        </div>
      </AuthCard>
    </AuthLayout>
  );
}
