import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { supabase } from "@/lib/supabase";

export async function signOut(
  router: AppRouterInstance,
  redirectTo = "/login",
): Promise<void> {
  await supabase.auth.signOut();
  router.replace(redirectTo);
}
