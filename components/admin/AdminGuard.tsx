"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShellSkeleton } from "@/components/ui/Skeleton";
import { isEmailVerified } from "@/lib/auth/errors";
import { fetchIsPlatformAdmin } from "@/lib/auth/get-user-role";
import { supabase } from "@/lib/supabase";

interface AdminGuardProps {
  children: React.ReactNode;
}

/** Protects /admin/* routes. Non-admins are sent away. */
export function AdminGuard({ children }: AdminGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifyAdmin() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error || !session?.user) {
        router.replace("/admin/login");
        return;
      }

      if (!isEmailVerified(session.user)) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      const isAdmin = await fetchIsPlatformAdmin(session.user);
      if (!isAdmin) {
        router.replace("/unauthorized");
        return;
      }

      setReady(true);
    }

    verifyAdmin();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        router.replace("/admin/login");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (!ready) {
    return <DashboardShellSkeleton />;
  }

  return <>{children}</>;
}
