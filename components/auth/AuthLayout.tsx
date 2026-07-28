"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
  wide?: boolean;
  /** Overrides the default max-width class for the content column. */
  contentClassName?: string;
}

export function AuthLayout({
  children,
  wide = false,
  contentClassName,
}: AuthLayoutProps) {
  const widthClass =
    contentClassName ?? (wide ? "max-w-lg" : "max-w-md");

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

      <div className={`relative w-full ${widthClass}`}>
        {children}
      </div>

      <p className="relative mt-10 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Aljamali QR. Premium digital menus.
      </p>
    </div>
  );
}
