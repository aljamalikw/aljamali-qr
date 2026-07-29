"use client";

import { motion } from "framer-motion";
import { AuthButton } from "@/components/auth/AuthButton";

interface WelcomeStepProps {
  onBegin: () => void;
}

export function WelcomeStep({ onBegin }: WelcomeStepProps) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center px-2 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mb-10"
        aria-hidden="true"
      >
        <div className="absolute inset-0 rounded-full bg-gold/20 blur-3xl" />
        <div className="relative flex h-36 w-36 items-center justify-center rounded-[2rem] border border-gold/30 bg-gradient-to-br from-black via-[#121212] to-black shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
          <div className="absolute -right-3 -top-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/30 bg-black/80 text-lg shadow-lg backdrop-blur-md">
            ✨
          </div>
          <div className="absolute -bottom-2 -left-4 flex h-11 w-11 items-center justify-center rounded-xl border border-gold/25 bg-black/80 text-sm shadow-lg">
            QR
          </div>
          <span className="font-serif text-4xl font-bold text-gold">AQ</span>
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="mb-4 text-xs font-semibold uppercase tracking-[0.22em] text-gold"
      >
        Restaurant Setup
      </motion.p>

      <motion.h1
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.55 }}
        className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
      >
        Welcome to Aljamali QR
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.22, duration: 0.55 }}
        className="mt-4 max-w-md text-base leading-relaxed text-white/60 sm:text-lg"
      >
        Let&apos;s set up your restaurant in just a few minutes.
      </motion.p>

      <motion.ul
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.55 }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        {["~2 minutes", "No coding", "Live preview"].map((item) => (
          <li
            key={item}
            className="rounded-full border border-gold/20 bg-black/40 px-3.5 py-1.5 text-xs text-white/55 backdrop-blur-md"
          >
            {item}
          </li>
        ))}
      </motion.ul>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.55 }}
        className="mt-10 w-full max-w-xs"
      >
        <AuthButton type="button" onClick={onBegin} className="w-full py-3.5 text-base">
          Let&apos;s Begin
        </AuthButton>
      </motion.div>
    </div>
  );
}
