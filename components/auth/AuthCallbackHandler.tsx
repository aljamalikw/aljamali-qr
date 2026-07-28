"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthPageSkeleton } from "@/components/ui/Skeleton";
import { supabase } from "@/lib/supabase";

export function AuthCallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let mounted = true;

    async function handleCallback() {
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!mounted) return;
        if (error) {
          router.replace("/login");
          return;
        }
      } else {
        await supabase.auth.getSession();
      }

      if (!mounted) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      const type = searchParams.get("type");

      if (type === "recovery" || window.location.hash.includes("type=recovery")) {
        router.replace("/reset-password");
        return;
      }

      if (session?.user?.email_confirmed_at) {
        await supabase.auth.signOut();
        router.replace("/login");
        return;
      }

      router.replace("/verify-email");
    }

    handleCallback();

    return () => {
      mounted = false;
    };
  }, [router, searchParams]);

  return <AuthPageSkeleton />;
}
