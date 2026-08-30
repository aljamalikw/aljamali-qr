"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isEmailVerified } from "@/lib/auth/errors";
import { fetchIsPlatformAdmin } from "@/lib/auth/get-user-role";
import {
  DELETED_OWNER_ACCOUNT_TOAST,
  resolveOwnerRestaurantAccess,
} from "@/lib/auth/owner-restaurant-access";
import { fetchUserRestaurant } from "@/lib/restaurants/setup";
import { useToast } from "@/components/ui/ToastProvider";
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
  const { showToast } = useToast();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function verifyAccess() {
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

      await fetchUserRestaurant();

      setReady(true);
    }

    verifyAccess();

    return () => {
      mounted = false;
    };
  }, [router, showToast]);

  if (!ready) {
    return <AuthCardSkeleton />;
  }

  return <>{children}</>;
}
