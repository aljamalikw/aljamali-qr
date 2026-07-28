"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthInput } from "@/components/auth/AuthInput";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { AuthButton } from "@/components/auth/AuthButton";
import { AuthRememberMe } from "@/components/auth/AuthRememberMe";
import { AuthCardSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  getAuthErrorMessage,
  isEmailVerified,
  REMEMBER_EMAIL_KEY,
} from "@/lib/auth/errors";
import { fetchIsPlatformAdmin } from "@/lib/auth/get-user-role";
import { isValidEmail } from "@/lib/auth/utils";
import { supabase } from "@/lib/supabase";

const ADMIN_REMEMBER_KEY = "aljamali_admin_remember_email";

export function AdminLoginForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {},
  );

  useEffect(() => {
    const savedEmail = localStorage.getItem(ADMIN_REMEMBER_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && isEmailVerified(session.user)) {
        if (await fetchIsPlatformAdmin(session.user)) {
          router.replace("/admin/dashboard");
          return;
        }
      }
      setAuthChecking(false);
    });
  }, [router]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Please enter your email address.";
    else if (!isValidEmail(email))
      next.email = "That email doesn't look right — check and try again.";
    if (!password) next.password = "Please enter your password.";
    else if (password.length < 6)
      next.password = "Password must be at least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const reportError = useCallback(
    (message: string) => {
      setFormError(message);
      showToast(message, "error");
    },
    [showToast],
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        reportError(getAuthErrorMessage(error));
        return;
      }

      if (data.user && !isEmailVerified(data.user)) {
        await supabase.auth.signOut();
        reportError("Please verify your email before signing in.");
        return;
      }

      const isAdmin = await fetchIsPlatformAdmin(data.user);
      if (!isAdmin) {
        await supabase.auth.signOut();
        reportError("This account does not have admin access.");
        return;
      }

      if (remember) {
        localStorage.setItem(ADMIN_REMEMBER_KEY, email.trim());
      } else {
        localStorage.removeItem(ADMIN_REMEMBER_KEY);
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      router.push("/admin/dashboard");
      router.refresh();
    } catch {
      reportError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (authChecking) {
    return <AuthCardSkeleton />;
  }

  return (
    <AuthCard>
      <AuthHeader
        title="Admin Sign In"
        subtitle="Access the Aljamali QR platform control center"
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="admin@aljamaliqr.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
            setFormError("");
          }}
          error={errors.email}
        />

        <PasswordInput
          label="Password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password)
              setErrors((p) => ({ ...p, password: undefined }));
            setFormError("");
          }}
          error={errors.password}
        />

        <div className="flex items-center justify-between gap-4">
          <AuthRememberMe checked={remember} onChange={setRemember} />
          <Link
            href="/forgot-password"
            className="text-sm text-gold transition-colors hover:text-gold-light"
          >
            Forgot Password
          </Link>
        </div>

        {formError ? (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        ) : null}

        <AuthButton type="submit" loading={loading}>
          Sign In
        </AuthButton>
      </form>
    </AuthCard>
  );
}
