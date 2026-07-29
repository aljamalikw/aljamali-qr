"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardShellSkeleton } from "@/components/ui/Skeleton";
import { isEmailVerified } from "@/lib/auth/errors";
import { fetchIsPlatformAdmin } from "@/lib/auth/get-user-role";
import { fetchImpersonationState } from "@/lib/admin/impersonation-client";
import {
  fetchUserRestaurant,
  isRestaurantSetupComplete,
} from "@/lib/restaurants/setup";
import { supabase } from "@/lib/supabase";

interface AuthGuardProps {
  children: React.ReactNode;
}

/** Protects restaurant-owner dashboard routes. Admins are redirected to /admin. */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !session?.user) {
        router.replace("/login");
        return;
      }

      if (!isEmailVerified(session.user)) {
        await supabase.auth.signOut();
        router.replace("/verify-email");
        return;
      }

      if (await fetchIsPlatformAdmin(session.user)) {
        const impersonation = await fetchImpersonationState();
        if (impersonation.ok && impersonation.data.active) {
          if (!mounted) return;
          setReady(true);
          return;
        }

        if (pathname.startsWith("/dashboard/demo-requests")) {
          router.replace("/admin/demo-requests");
          return;
        }
        router.replace("/admin/dashboard");
        return;
      }

      const restaurant = await fetchUserRestaurant();

      if (!isRestaurantSetupComplete(restaurant)) {
        router.replace("/restaurant/setup");
        return;
      }

      setReady(true);
    }

    verifySession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/login");
        return;
      }
      if (!isEmailVerified(session.user)) {
        supabase.auth.signOut().then(() => router.replace("/verify-email"));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (!ready) {
    return <DashboardShellSkeleton />;
  }

  return <>{children}</>;
}
