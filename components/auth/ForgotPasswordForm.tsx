"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AuthCard } from "./AuthCard";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter, AuthFooterLink } from "./AuthFooter";
import { AuthInput } from "./AuthInput";
import { AuthButton } from "./AuthButton";
import { isValidEmail } from "@/lib/auth/utils";
import { getAuthErrorMessage, getSiteUrl } from "@/lib/auth/errors";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/ToastProvider";

export function ForgotPasswordForm() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!isValidEmail(email)) {
      setError("That email doesn't look right — check and try again.");
      return;
    }

    setError("");
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${getSiteUrl()}/reset-password`,
      },
    );

    setLoading(false);

    if (resetError) {
      setError(getAuthErrorMessage(resetError));
      return;
    }

    setSent(true);
    showToast("Reset link sent — check your inbox", "success");
  };

  return (
    <AuthCard>
      <AnimatePresence mode="wait">
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuthHeader
              title="Forgot password?"
              subtitle="Enter your email and we'll send you a reset link"
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
                  setError("");
                }}
                error={error}
              />

              <AuthButton type="submit" loading={loading} disabled={loading}>
                Send Reset Link
              </AuthButton>
            </form>

            <AuthFooter>
              <AuthFooterLink href="/login">← Back to Login</AuthFooterLink>
            </AuthFooter>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-4 text-center"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-2xl text-emerald-400">
              ✓
            </div>
            <h2 className="mt-6 font-serif text-xl font-bold text-white">
              Check your inbox
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/50">
              We&apos;ve sent a password reset link to{" "}
              <span className="font-medium text-white">{email}</span>
            </p>
            <Link
              href="/reset-password"
              className="auth-btn-primary mt-8 inline-flex w-full items-center justify-center"
            >
              Continue to Reset Password
            </Link>
            <AuthFooter>
              <AuthFooterLink href="/login">← Back to Login</AuthFooterLink>
            </AuthFooter>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthCard>
  );
}
