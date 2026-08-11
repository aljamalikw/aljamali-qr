"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isEmailVerified } from "@/lib/auth/errors";
import { fetchIsPlatformAdmin } from "@/lib/auth/get-user-role";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { supabase } from "@/lib/supabase";
import { AuthCardSkeleton } from "@/components/ui/Skeleton";

interface RestaurantSetupGuardProps {
  children: React.ReactNode;
}

/**
 * Auth gate for /restaurant/setup.
 * Allows incomplete AND completed restaurants (continue / restart wizard).
 */
export function RestaurantSetupGuard({ children }: RestaurantSetupGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifyAccess() {
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
        router.replace("/admin/dashboard");
        return;
      }

      // Ensure a restaurant context exists (created at signup).
      await fetchUserRestaurant();

      setReady(true);
    }

    verifyAccess();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (!ready) {
    return <AuthCardSkeleton />;
  }

  return <>{children}</>;
}
