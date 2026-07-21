"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { AuthCard } from "./AuthCard";
import { AuthHeader } from "./AuthHeader";
import { AuthFooter, AuthFooterLink } from "./AuthFooter";
import { PasswordInput } from "./PasswordInput";
import { AuthButton } from "./AuthButton";
import { PasswordStrength } from "./PasswordStrength";
import { PasswordRequirements, meetsPasswordRequirements } from "./PasswordRequirements";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { supabase } from "@/lib/supabase";

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    async function initRecoverySession() {
      await supabase.auth.getSession();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setFormError("Invalid or expired reset link. Please request a new one.");
      }

      setSessionReady(true);
    }

    initRecoverySession();
  }, []);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/login");
    }, 2200);
    return () => clearTimeout(t);
  }, [success, router]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!password) next.password = "Please enter a new password.";
    else if (!meetsPasswordRequirements(password))
      next.password = "Your password doesn't meet all requirements yet.";
    if (!confirmPassword) next.confirmPassword = "Please confirm your password.";
    else if (password !== confirmPassword)
      next.confirmPassword = "Passwords don't match — please try again.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setFormError("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setLoading(false);
      setFormError(getAuthErrorMessage(error));
      return;
    }

    setLoading(false);
    setSuccess(true);
  };

  return (
    <AuthCard>
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <AuthHeader
              title="Reset password"
              subtitle="Create a new secure password for your account"
            />

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <PasswordInput
                  label="New Password"
                  autoComplete="new-password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors((p) => ({ ...p, password: "" }));
                    setFormError("");
                  }}
                  error={errors.password}
                />
                <PasswordStrength password={password} />
                <PasswordRequirements password={password} />
              </div>

              <PasswordInput
                label="Confirm Password"
                autoComplete="new-password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword)
                    setErrors((p) => ({ ...p, confirmPassword: "" }));
                  setFormError("");
                }}
                error={errors.confirmPassword}
              />

              {formError && (
                <p className="text-sm text-red-400" role="alert">
                  {formError}
                </p>
              )}

              <AuthButton
                type="submit"
                loading={loading}
                disabled={!sessionReady}
                className="mt-2"
              >
                Reset Password
              </AuthButton>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="py-4 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 14 }}
              className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/25 bg-gold/10 text-3xl text-gold"
            >
              ✦
            </motion.div>
            <h2 className="mt-6 font-serif text-xl font-bold text-white">
              Password updated
            </h2>
            <p className="mt-3 text-sm text-white/50">
              Redirecting you to sign in...
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!success && (
        <AuthFooter>
          <AuthFooterLink href="/login">← Back to Login</AuthFooterLink>
        </AuthFooter>
      )}
    </AuthCard>
  );
}
