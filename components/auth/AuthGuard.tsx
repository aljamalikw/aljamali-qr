"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DashboardShellSkeleton } from "@/components/ui/Skeleton";
import { isEmailVerified } from "@/lib/auth/errors";
import { fetchIsPlatformAdmin } from "@/lib/auth/get-user-role";
import {
  DELETED_OWNER_ACCOUNT_TOAST,
  resolveOwnerRestaurantAccess,
} from "@/lib/auth/owner-restaurant-access";
import { fetchImpersonationState } from "@/lib/admin/impersonation-client";
import { useToast } from "@/components/ui/ToastProvider";
import { supabase } from "@/lib/supabase";

interface AuthGuardProps {
  children: React.ReactNode;
}

/** Protects restaurant-owner dashboard routes. Admins are redirected to /admin. */
export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (error || !user) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      if (!isEmailVerified(user)) {
        await supabase.auth.signOut();
        router.replace("/verify-email");
        return;
      }

      if (await fetchIsPlatformAdmin(user)) {
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

      const access = await resolveOwnerRestaurantAccess(user);
      if (access === "no_restaurant") {
        await supabase.auth.signOut();
        showToast(DELETED_OWNER_ACCOUNT_TOAST, "error", { durationMs: 6000 });
        router.replace("/login");
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
  }, [router, pathname, showToast]);

  if (!ready) {
    return <DashboardShellSkeleton />;
  }

  return <>{children}</>;
}
