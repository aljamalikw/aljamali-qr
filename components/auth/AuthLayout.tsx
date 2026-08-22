"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { AljamaliLogo } from "@/components/branding/AljamaliLogo";

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
        <AljamaliLogo
          variant="full"
          priority
          className="!h-14 !max-w-[280px] sm:!h-16 sm:!max-w-[320px]"
        />
      </motion.div>

      <div className={`relative w-full ${widthClass}`}>
        {children}
      </div>

      <p className="relative mt-10 text-center text-xs text-white/30">
        © {new Date().getFullYear()} Al Jamali QR. Premium digital menus.
      </p>
    </div>
  );
}
