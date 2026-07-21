"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShellSkeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabase";
import { isEmailVerified } from "@/lib/auth/errors";

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
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
  }, [router]);

  if (!ready) {
    return <DashboardShellSkeleton />;
  }

  return <>{children}</>;
}
