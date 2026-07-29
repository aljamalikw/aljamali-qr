"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { exitImpersonation } from "@/lib/admin/impersonation-client";

type ImpersonationBannerProps = {
  restaurantName: string;
};

export function ImpersonationBanner({ restaurantName }: ImpersonationBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleExit = async () => {
    setLoading(true);
    const result = await exitImpersonation();
    setLoading(false);
    if (result.ok) {
      router.replace("/admin/restaurants");
      router.refresh();
      return;
    }
    // Still leave the owner dashboard if exit API fails after cookie clear attempt.
    router.replace("/admin/restaurants");
  };

  return (
    <div className="mb-4 overflow-hidden rounded-2xl border border-gold/40 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent px-4 py-3 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
            You are currently impersonating
          </p>
          <p className="mt-1 font-serif text-lg font-bold text-white sm:text-xl">
            {restaurantName}
          </p>
        </div>
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleExit()}
          className="menu-btn-primary shrink-0 text-sm disabled:opacity-60"
        >
          {loading ? "Exiting…" : "Exit Impersonation"}
        </button>
      </div>
    </div>
  );
}
