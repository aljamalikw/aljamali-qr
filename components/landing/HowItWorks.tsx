"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Button } from "./Button";

const easeOut = [0.22, 1, 0.36, 1] as const;

const checklist = ["No coding", "Instant setup", "Mobile friendly"] as const;

const steps = [
  {
    number: "01",
    title: "Create Your Account",
    description:
      "Create your restaurant account and complete a simple setup in minutes.",
    illustration: "account" as const,
  },
  {
    number: "02",
    title: "Build Your Menu",
    description:
      "Organize your categories, upload images and publish your digital menu instantly.",
    illustration: "menu" as const,
  },
  {
    number: "03",
    title: "Print & Start Serving",
    description:
      "Print your QR code, place it on your tables and begin receiving customer interactions immediately.",
    illustration: "serve" as const,
  },
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.18, delayChildren: 0.15 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

function AccountIllustration() {
  return (
    <div className="relative mx-auto h-36 w-full max-w-[220px]" aria-hidden="true">
      <div className="absolute inset-x-4 bottom-0 top-4 rounded-xl border border-gold/25 bg-gradient-to-b from-[#1a1a1a] to-black shadow-[0_16px_40px_rgba(0,0,0,0.45)]">
        <div className="flex items-center gap-1.5 border-b border-white/[0.06] px-3 py-2">
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
          <span className="h-1.5 w-1.5 rounded-full bg-gold/50" />
        </div>
        <div className="space-y-2 p-3">
          <div className="h-2 w-16 rounded-full bg-gold/30" />
          <div className="h-2 w-full rounded-full bg-white/10" />
          <div className="h-2 w-[80%] rounded-full bg-white/10" />
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-gold/20 bg-gold/5 px-2 py-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-[8px] font-bold text-black">
              QR
            </span>
            <span className="text-[9px] font-medium text-white/70">
              Restaurant setup
            </span>
          </div>
        </div>
      </div>
      <div className="absolute -right-1 top-2 flex h-10 w-10 items-center justify-center rounded-xl border border-gold/30 bg-black/80 shadow-lg backdrop-blur-md">
        <svg className="h-5 w-5 text-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 2h2v2h-2v-2zm4-2h2v6h-6v-2h4v-4z" />
        </svg>
      </div>
    </div>
  );
}

function MenuIllustration() {
  return (
    <div className="relative mx-auto h-36 w-full max-w-[220px]" aria-hidden="true">
      <div className="absolute left-2 top-3 w-[42%] rounded-xl border border-gold/20 bg-black/70 p-2 shadow-lg backdrop-blur-md">
        <div className="mb-2 h-10 rounded-lg bg-gradient-to-br from-gold/25 to-gold/5" />
        <div className="h-1.5 w-12 rounded-full bg-white/25" />
        <div className="mt-1 h-1.5 w-8 rounded-full bg-white/10" />
      </div>
      <div className="absolute right-2 top-6 w-[42%] rounded-xl border border-gold/20 bg-black/70 p-2 shadow-lg backdrop-blur-md">
        <div className="mb-2 h-10 rounded-lg bg-gradient-to-br from-gold/15 to-transparent" />
        <div className="h-1.5 w-10 rounded-full bg-white/25" />
        <div className="mt-1 h-1.5 w-7 rounded-full bg-white/10" />
      </div>
      <div className="absolute bottom-2 left-1/2 w-[70%] -translate-x-1/2 rounded-xl border border-gold/30 bg-black/80 px-3 py-2 shadow-[0_12px_30px_rgba(0,0,0,0.45)] backdrop-blur-md">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-1">
            <span className="rounded-full bg-gold/20 px-2 py-0.5 text-[8px] text-gold">
              Categories
            </span>
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[8px] text-white/50">
              Images
            </span>
          </div>
          <span className="text-[8px] font-medium text-gold/80">Drag & Drop</span>
        </div>
      </div>
    </div>
  );
}

function ServeIllustration() {
  return (
    <div className="relative mx-auto h-36 w-full max-w-[220px]" aria-hidden="true">
      <div className="absolute left-3 top-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-black/80 shadow-lg">
        <div className="grid grid-cols-3 gap-0.5">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={`h-2.5 w-2.5 rounded-[1px] ${
                [0, 2, 4, 6, 8].includes(i) ? "bg-gold" : "bg-gold/30"
              }`}
            />
          ))}
        </div>
      </div>
      <div className="absolute right-2 top-2 h-24 w-12 rounded-xl border border-gold/25 bg-gradient-to-b from-[#1a1a1a] to-black p-1 shadow-xl">
        <div className="flex h-full flex-col rounded-lg border border-white/[0.06] bg-black/60 p-1">
          <div className="mx-auto mb-1 h-1 w-4 rounded-full bg-white/15" />
          <div className="flex-1 rounded-md bg-gold/10" />
          <div className="mt-1 h-1 w-full rounded-full bg-white/10" />
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full border border-gold/25 bg-black/80 px-3 py-1.5 shadow-lg backdrop-blur-md">
        <span className="text-[9px] font-medium text-white/70">Orders</span>
        <span className="h-1 w-1 rounded-full bg-gold/50" />
        <span className="text-[9px] font-medium text-gold">Analytics</span>
      </div>
    </div>
  );
}

const illustrations: Record<(typeof steps)[number]["illustration"], ReactNode> = {
  account: <AccountIllustration />,
  menu: <MenuIllustration />,
  serve: <ServeIllustration />,
};

function StepCard({
  number,
  title,
  description,
  illustration,
  index,
}: {
  number: string;
  title: string;
  description: string;
  illustration: (typeof steps)[number]["illustration"];
  index: number;
}) {
  return (
    <motion.article
      variants={cardVariants}
      className="group relative flex h-full flex-col"
    >
      {/* Mobile vertical connector */}
      {index < steps.length - 1 ? (
        <div
          className="absolute left-8 top-[4.5rem] h-[calc(100%-1rem)] w-px bg-gradient-to-b from-gold/40 via-gold/20 to-transparent lg:hidden"
          aria-hidden="true"
        />
      ) : null}

      <div className="relative z-10 mb-6 flex items-center gap-4 lg:mb-8 lg:justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] font-serif text-xl font-bold text-black shadow-[0_10px_30px_rgba(212,175,55,0.4)] transition-transform duration-500 ease-out group-hover:scale-110">
          {number}
        </div>
      </div>

      <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-gold/20 bg-black/45 p-6 shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 ease-out group-hover:-translate-y-2 group-hover:border-gold/50 group-hover:shadow-[0_24px_60px_rgba(212,175,55,0.16)] sm:p-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(420px circle at 50% 0%, rgba(212,175,55,0.12), transparent 45%)",
          }}
        />

        <div className="relative z-10 mb-5">{illustrations[illustration]}</div>

        <h3 className="relative z-10 font-serif text-xl font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-gold sm:text-2xl">
          {title}
        </h3>
        <p className="relative z-10 mt-3 flex-1 text-sm leading-relaxed text-white/60 sm:text-[15px]">
          {description}
        </p>

        <ul className="relative z-10 mt-6 space-y-2 border-t border-white/[0.06] pt-5">
          {checklist.map((item) => (
            <li
              key={`${number}-${item}`}
              className="flex items-center gap-2 text-xs text-white/55 sm:text-sm"
            >
              <span className="text-gold" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.article>
  );
}

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative overflow-hidden bg-background py-28 lg:py-36"
      aria-labelledby="how-it-works-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="absolute -left-24 top-1/2 h-72 w-72 rounded-full bg-gold/[0.04] blur-3xl" />
        <div className="absolute -right-20 bottom-32 h-80 w-80 rounded-full bg-gold/[0.05] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.028]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,175,55,0.55) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.55) 1px, transparent 1px)",
            backgroundSize: "68px 68px",
            maskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 75%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <motion.div
          className="mx-auto mb-16 max-w-[700px] text-center lg:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            How It Works
          </p>
          <h2
            id="how-it-works-heading"
            className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Launch Your Digital Menu
            <br className="hidden sm:block" /> in Three Simple Steps
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-base leading-relaxed text-white/60 sm:text-lg">
            Go from printed menus to a fully digital restaurant experience in
            just a few minutes.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Desktop connector line */}
          <div
            className="pointer-events-none absolute left-[8%] right-[8%] top-8 hidden h-px lg:block"
            aria-hidden="true"
          >
            <div className="absolute inset-0 bg-gold/10" />
            <motion.div
              className="absolute inset-y-0 left-0 origin-left bg-gradient-to-r from-gold/20 via-gold/70 to-gold/20 shadow-[0_0_12px_rgba(212,175,55,0.45)]"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.1, ease: easeOut, delay: 0.2 }}
              style={{ height: 1, width: "100%" }}
            />
          </div>

          <motion.div
            className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:gap-8 xl:gap-10"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
          >
            {steps.map((step, index) => (
              <StepCard
                key={step.number}
                number={step.number}
                title={step.title}
                description={step.description}
                illustration={step.illustration}
                index={index}
              />
            ))}
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          className="mx-auto mt-24 max-w-3xl text-center lg:mt-32"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-black/45 px-8 py-14 shadow-[0_16px_56px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-14 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.1)_0%,transparent_70%)]"
              aria-hidden="true"
            />
            <h3 className="relative font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Ready to Replace Printed Menus?
            </h3>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <Button
                href="/register"
                className="min-w-[200px] px-9 py-3.5 text-base sm:min-w-[220px]"
              >
                Start Free Trial
              </Button>
              <Button
                href="/demo"
                variant="secondary"
                className="min-w-[200px] px-9 py-3.5 text-base sm:min-w-[220px]"
              >
                View Live Demo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
