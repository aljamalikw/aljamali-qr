"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardShellSkeleton } from "@/components/ui/Skeleton";
import { fetchIsPlatformAdmin } from "@/lib/auth/get-user-role";
import { supabase } from "@/lib/supabase";

/**
 * Legacy restaurant-dashboard CRM route.
 * Admins are redirected to /admin/demo-requests.
 * Restaurant owners receive unauthorized.
 */
export default function LegacyDemoRequestsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    async function redirect() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session?.user) {
        router.replace("/login");
        return;
      }

      if (await fetchIsPlatformAdmin(session.user)) {
        router.replace("/admin/demo-requests");
        return;
      }

      router.replace("/unauthorized");
    }

    redirect();

    return () => {
      mounted = false;
    };
  }, [router]);

  return <DashboardShellSkeleton />;
}
