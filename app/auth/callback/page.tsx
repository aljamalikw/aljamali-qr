import { Suspense } from "react";
import { AuthCallbackHandler } from "@/components/auth/AuthCallbackHandler";

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  );
}
