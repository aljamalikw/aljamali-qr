"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

type ConnectionStatus = "loading" | "connected" | "failed";

export default function SupabaseTestPage() {
  const [status, setStatus] = useState<ConnectionStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkConnection() {
      try {
        const { error } = await supabase.auth.getSession();

        if (cancelled) return;

        if (error) {
          setStatus("failed");
          setErrorMessage(error.message);
          return;
        }

        setStatus("connected");
        setErrorMessage(null);
      } catch (err) {
        if (cancelled) return;
        setStatus("failed");
        setErrorMessage(
          err instanceof Error ? err.message : "An unexpected error occurred.",
        );
      }
    }

    checkConnection();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4 py-12 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,transparent_55%)]" />
      <div className="pointer-events-none absolute -start-32 top-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
      <div className="pointer-events-none absolute -end-32 bottom-1/4 h-80 w-80 rounded-full bg-gold/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-8 text-center"
      >
        <Link href="/" className="group inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold transition-colors group-hover:border-gold/40 group-hover:bg-gold/15">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3zM17 17h3v3h-3zM14 20h3" />
            </svg>
          </span>
          <span className="font-serif text-2xl font-bold text-white">
            Aljamali <span className="text-gold">QR</span>
          </span>
        </Link>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="auth-glass-card relative w-full max-w-md rounded-2xl p-6 sm:p-8"
      >
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Connection Test
        </p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-white">
          Supabase Status
        </h1>
        <p className="mt-2 text-sm text-white/45">
          Verifying client connection via{" "}
          <code className="rounded bg-black/40 px-1.5 py-0.5 text-xs text-gold/80">
            auth.getSession()
          </code>
        </p>

        <div className="mt-8 rounded-xl border border-white/5 bg-black/30 p-6 text-center">
          {status === "loading" && (
            <div className="flex flex-col items-center gap-4">
              <span className="h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
              <p className="text-sm text-white/50">Checking connection...</p>
            </div>
          )}

          {status === "connected" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-2"
            >
              <p className="text-lg font-semibold text-emerald-400">
                ✅ Connected to Supabase
              </p>
              <p className="text-sm text-white/45">
                Session check completed successfully.
              </p>
            </motion.div>
          )}

          {status === "failed" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              <p className="text-lg font-semibold text-red-400">
                ❌ Connection Failed
              </p>
              {errorMessage && (
                <p className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2 text-sm leading-relaxed text-red-300/90">
                  {errorMessage}
                </p>
              )}
            </motion.div>
          )}
        </div>

        <Link
          href="/"
          className="auth-btn-secondary mt-6 inline-flex w-full items-center justify-center"
        >
          Back to Home
        </Link>
      </motion.div>

      <p className="relative mt-10 text-center text-xs text-white/30">
        Internal test page — not linked from production navigation.
      </p>
    </div>
  );
}
