"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSubscriptionAccess } from "./SubscriptionAccessProvider";

export function SubscriptionLockBanner() {
  const pathname = usePathname();
  const { access, loading } = useSubscriptionAccess();

  if (loading || !access.message) return null;
  if (
    access.effectiveStatus !== "trial" &&
    access.effectiveStatus !== "grace" &&
    access.effectiveStatus !== "suspended" &&
    access.effectiveStatus !== "expired" &&
    access.effectiveStatus !== "cancelled"
  ) {
    return null;
  }

  const urgent =
    access.effectiveStatus === "expired" ||
    access.effectiveStatus === "cancelled" ||
    access.effectiveStatus === "suspended" ||
    (access.trialDaysLeft !== null && access.trialDaysLeft <= 3) ||
    (access.graceDaysLeft !== null && access.graceDaysLeft <= 1);

  const onBilling = pathname.startsWith("/dashboard/subscription");

  if (onBilling) return null;

  return (
    <div
      className={`mb-4 rounded-2xl border px-4 py-3 sm:px-5 ${
        urgent
          ? "border-red-500/30 bg-red-500/10"
          : "border-gold/25 bg-gold/10"
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className={`text-sm ${urgent ? "text-red-200" : "text-gold"}`}>
          {access.message}
        </p>
        <Link href="/dashboard/subscription" className="menu-btn-secondary text-xs">
          {access.effectiveStatus === "suspended" ||
          access.effectiveStatus === "expired" ||
          access.effectiveStatus === "cancelled"
            ? "Choose a plan"
            : "Billing"}
        </Link>
      </div>
    </div>
  );
}
