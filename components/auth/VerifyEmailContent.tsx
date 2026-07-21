"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AuthCard } from "./AuthCard";
import { AuthButton } from "./AuthButton";
import {
  getAuthErrorMessage,
  isEmailVerified,
  PENDING_VERIFICATION_EMAIL_KEY,
} from "@/lib/auth/errors";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/ToastProvider";

const RESEND_COOLDOWN = 60;

export function VerifyEmailContent() {
  const router = useRouter();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [pendingEmail, setPendingEmail] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
    if (stored) setPendingEmail(stored);
  }, []);

  useEffect(() => {
    async function checkVerified() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user && isEmailVerified(session.user)) {
        await supabase.auth.signOut();
        sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
        router.replace("/login");
      }
    }

    checkVerified();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user &&
        isEmailVerified(session.user)
      ) {
        await supabase.auth.signOut();
        sessionStorage.removeItem(PENDING_VERIFICATION_EMAIL_KEY);
        router.replace("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const handleResend = async () => {
    if (loading || countdown > 0) return;

    const email =
      pendingEmail || sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);

    if (!email) {
      showToast("Please register again to receive a verification email.", "error");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
    });

    setLoading(false);

    if (error) {
      showToast(getAuthErrorMessage(error), "error");
      return;
    }

    setCountdown(RESEND_COOLDOWN);
    showToast("Verification email sent — check your inbox", "success");
  };

  return (
    <AuthCard>
      <div className="py-4 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto flex h-24 w-24 items-center justify-center"
        >
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 rounded-3xl bg-gold/10 blur-xl"
          />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-gold/20 bg-gold/10 text-gold">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-12 w-12"
            >
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <path d="M22 6l-10 7L2 6" />
            </svg>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <h1 className="mt-8 font-serif text-2xl font-bold text-white sm:text-3xl">
            Verify your email
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-base">
            We&apos;ve sent a verification link to your email address. Please
            check your inbox and click the link to activate your Aljamali QR
            account.
          </p>
          <p className="mt-2 text-xs text-white/35">
            Didn&apos;t receive it? Check your spam folder or resend below.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="mt-8 space-y-3"
        >
          <AuthButton
            type="button"
            variant="secondary"
            loading={loading}
            disabled={loading || countdown > 0}
            onClick={handleResend}
          >
            {countdown > 0
              ? `Resend available in ${countdown}s`
              : "Resend Email"}
          </AuthButton>

          <Link
            href="/login"
            className="auth-btn-primary inline-flex w-full items-center justify-center"
          >
            Continue to Login
          </Link>
        </motion.div>
      </div>
    </AuthCard>
  );
}
