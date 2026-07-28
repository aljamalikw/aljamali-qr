import { Suspense } from "react";
import { AuthCallbackHandler } from "@/components/auth/AuthCallbackHandler";
import { AuthPageSkeleton } from "@/components/ui/Skeleton";

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<AuthPageSkeleton />}>
      <AuthCallbackHandler />
    </Suspense>
  );
}
