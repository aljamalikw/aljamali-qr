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
import { resolveAuthenticatedRedirect } from "@/lib/restaurants/setup";
import {
  DELETED_OWNER_ACCOUNT_DETAIL,
  DELETED_OWNER_ACCOUNT_TITLE,
  DELETED_OWNER_ACCOUNT_TOAST,
  resolveOwnerRestaurantAccess,
} from "@/lib/auth/owner-restaurant-access";
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

  const reportError = useCallback(
    (message: string) => {
      setFormError(message);
      showToast(message, "error");
    },
    [showToast],
  );

  const rejectDeletedOwner = useCallback(async () => {
    await supabase.auth.signOut();
    setFormError(DELETED_OWNER_ACCOUNT_TITLE);
    showToast(DELETED_OWNER_ACCOUNT_TOAST, "error", { durationMs: 6000 });
  }, [showToast]);

  useEffect(() => {
    const savedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY);
    if (savedEmail) {
      setEmail(savedEmail);
      setRemember(true);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user && isEmailVerified(user)) {
        const access = await resolveOwnerRestaurantAccess(user);
        if (access === "no_restaurant") {
          await rejectDeletedOwner();
          setAuthChecking(false);
          return;
        }
        router.replace(await resolveAuthenticatedRedirect());
        return;
      }

      setAuthChecking(false);
    });
  }, [rejectDeletedOwner, router]);

  const validate = () => {
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Please enter your email address.";
    else if (!isValidEmail(email)) next.email = "That email doesn't look right — check and try again.";
    if (!password) next.password = "Please enter your password.";
    else if (password.length < 6) next.password = "Password must be at least 6 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

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

      const access = await resolveOwnerRestaurantAccess(data.user);
      if (access === "no_restaurant") {
        await rejectDeletedOwner();
        return;
      }

      if (remember) {
        localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
      } else {
        localStorage.removeItem(REMEMBER_EMAIL_KEY);
      }

      router.push(await resolveAuthenticatedRedirect());
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
          <div className="space-y-1" role="alert">
            <p className="text-sm text-red-400">{formError}</p>
            {formError === DELETED_OWNER_ACCOUNT_TITLE ? (
              <p className="text-sm text-red-400/80">
                {DELETED_OWNER_ACCOUNT_DETAIL}
              </p>
            ) : null}
          </div>
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
