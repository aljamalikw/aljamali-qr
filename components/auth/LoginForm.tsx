"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthCard } from "./AuthCard";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter, AuthFooterLink } from "./AuthFooter";
import { AuthInput } from "./AuthInput";
import { PasswordInput } from "./PasswordInput";
import { AuthButton } from "./AuthButton";
import { AuthDivider } from "./AuthDivider";
import { SocialLogin } from "./SocialLogin";
import { AuthRememberMe } from "./AuthRememberMe";
import { isValidEmail } from "@/lib/auth/utils";
import {
  getAuthErrorMessage,
  isEmailVerified,
  REMEMBER_EMAIL_KEY,
} from "@/lib/auth/errors";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/ToastProvider";
import { AuthCardSkeleton } from "@/components/ui/Skeleton";

export function LoginForm() {
  const router = useRouter();
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [formError, setFormError] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && isEmailVerified(session.user)) {
        router.replace("/dashboard");
        return;
      }

      setAuthChecking(false);
    });
  }, [router]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Please enter your email address.";
    else if (!isValidEmail(email)) next.email = "That email doesn't look right — check and try again.";
    if (!password) next.password = "Please enter your password.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      if (remember) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      router.push("/dashboard");
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
        title="Welcome back"
        subtitle="Sign in to manage your restaurant's digital menu"
      />

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <AuthInput
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@restaurant.com"
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
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
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
            Forgot password?
          </Link>
        </div>

        {formError && (
          <p className="text-sm text-red-400" role="alert">
            {formError}
          </p>
        )}

        <AuthButton type="submit" loading={loading}>
          Sign In
        </AuthButton>
      </form>

      <AuthDivider />
      <SocialLogin />

      <AuthFooter>
        Don&apos;t have an account?{" "}
        <AuthFooterLink href="/register">Create one</AuthFooterLink>
      </AuthFooter>
    </AuthCard>
  );
}
