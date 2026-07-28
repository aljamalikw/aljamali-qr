"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { AuthButton } from "./AuthButton";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/ToastProvider";

type RegisterSuccessScreenProps = {
  email: string;
};

const RESEND_COOLDOWN = 60;

export function RegisterSuccessScreen({ email }: RegisterSuccessScreenProps) {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const resendDisabled = loading || countdown > 0 || !email;

  const handleResend = async () => {
    if (resendDisabled) return;

    setLoading(true);
    setError("");

    const { error: resendError } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setLoading(false);

    if (resendError) {
      const friendly = getAuthErrorMessage(resendError);
      setError(
        friendly.includes("try again")
          ? friendly
          : "Unable to resend verification email. Please try again in a few minutes.",
      );
      showToast("Unable to resend verification email. Please try again in a few minutes.", "error");
      return;
    }

    setCountdown(RESEND_COOLDOWN);
    showToast("Verification email sent — please check your inbox.", "success");
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="py-6 text-center"
    >
      <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
        <div className="absolute inset-0 rounded-3xl bg-gold/10 blur-xl" aria-hidden="true" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-gold/20 bg-gold/10 text-gold">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-10 w-10"
            aria-hidden="true"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <path d="M22 6l-10 7L2 6" />
          </svg>
        </div>
      </div>

      <h2 className="mt-8 font-serif text-2xl font-bold text-white sm:text-3xl">
        Check your email
      </h2>

      <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-base">
        We&apos;ve sent a verification link to:
      </p>

      <p
        className="mx-auto mt-3 max-w-full select-all rounded-xl border border-gold/25 bg-black/40 px-4 py-3 text-base font-medium text-white backdrop-blur-sm sm:text-lg"
        aria-label={`Verification email sent to ${email}`}
      >
        {email}
      </p>

      <p className="mt-4 text-sm leading-relaxed text-white/45">
        Please click the verification link before logging in.
      </p>
      <p className="mt-2 text-sm leading-relaxed text-white/40">
        If you don&apos;t see the email, please check your Spam or Junk folder.
      </p>

      <Link
        href="/login"
        className="auth-btn-primary mt-8 inline-flex w-full items-center justify-center"
      >
        Back to Login
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.35 }}
        className="mt-8"
      >
        <p className="text-sm font-medium text-white/60">
          Didn&apos;t receive the email?
        </p>

        <motion.div whileHover={!resendDisabled ? { scale: 1.01 } : undefined} className="mt-3">
          <AuthButton
            type="button"
            variant="secondary"
            loading={loading}
            disabled={resendDisabled}
            onClick={handleResend}
            className="rounded-xl border border-gold/30 bg-black/40 shadow-none transition-shadow hover:border-gold/50 hover:bg-black/55 hover:shadow-[0_0_24px_rgba(212,175,55,0.12)]"
          >
            {loading
              ? "Sending..."
              : countdown > 0
                ? `Resend available in ${countdown}s`
                : "Resend Verification Email"}
          </AuthButton>
        </motion.div>

        <div aria-live="polite" aria-atomic="true" className="sr-only">
          {loading && "Sending verification email."}
          {countdown > 0 && !loading && `Resend available in ${countdown} seconds.`}
        </div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="resend-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="mt-3 text-sm text-red-400"
              role="alert"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25, duration: 0.35 }}
        className="mt-6 rounded-xl border border-white/5 bg-black/25 px-4 py-4 text-start backdrop-blur-sm"
      >
        <div className="flex items-start gap-3">
          <span className="text-base text-gold/80" aria-hidden="true">
            ℹ️
          </span>
          <div>
            <p className="text-sm font-medium text-white/70">
              Didn&apos;t receive the email?
            </p>
            <ul className="mt-3 space-y-2 text-sm text-white/45">
              <li className="flex items-start gap-2">
                <span className="text-gold" aria-hidden="true">
                  •
                </span>
                Check your Spam or Junk folder
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold" aria-hidden="true">
                  •
                </span>
                Make sure the email address is correct
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gold" aria-hidden="true">
                  •
                </span>
                Wait a few minutes for delivery
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
