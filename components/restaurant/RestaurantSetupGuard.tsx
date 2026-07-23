"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isEmailVerified } from "@/lib/auth/errors";
import {
  fetchUserRestaurant,
  isRestaurantSetupComplete,
} from "@/lib/restaurants/setup";
import { supabase } from "@/lib/supabase";
import { AuthCardSkeleton } from "@/components/ui/Skeleton";

interface RestaurantSetupGuardProps {
  children: React.ReactNode;
}

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

      const restaurant = await fetchUserRestaurant();

      if (isRestaurantSetupComplete(restaurant)) {
        router.replace("/dashboard");
        return;
      }

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
