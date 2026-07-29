"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { Button } from "./Button";

interface Feature {
  title: string;
  description: string;
  icon: ReactNode;
  comingSoon?: boolean;
  highlight?: boolean;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

function IconQr() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 2h2v2h-2v-2zm4-2h2v6h-6v-2h4v-4zM8 8h.01M18 8h.01" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 5h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V6a1 1 0 011-1z" />
    </svg>
  );
}

function IconCart() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l3-8H6.4M7 13L5.4 5M7 13l-2 6h14M10 19a1 1 0 100 2 1 1 0 000-2zm8 0a1 1 0 100 2 1 1 0 000-2z" />
    </svg>
  );
}

function IconCard() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M5 6h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2zm0 8h.01M9 14h6" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V9m5 10V5m5 14v-7m5 7V8" />
    </svg>
  );
}

function IconGlobe() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5 0 4.5-4 4.5-9S14.5 3 12 3 7.5 7 7.5 12 9.5 21 12 21zM3 12h18" />
    </svg>
  );
}

function IconStar() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18.4l.9-5.4-3.9-3.8 5.4-.8L12 3.5z" />
    </svg>
  );
}

function IconUsers() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 11a4 4 0 10-8 0 4 4 0 008 0zM4 20a6 6 0 0112 0M18 8a3 3 0 110 6m2 6a5 5 0 00-4-4.9" />
    </svg>
  );
}

function IconCloud() {
  return (
    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 18a4.5 4.5 0 01.4-9 6 6 0 0111.3 1.8A3.5 3.5 0 0118.5 18H7z" />
    </svg>
  );
}

const features: Feature[] = [
  {
    title: "QR Menus",
    description:
      "Beautiful scannable menus that open instantly on any phone — no app download required.",
    icon: <IconQr />,
    highlight: true,
  },
  {
    title: "Reservations",
    description:
      "Let guests book tables online with real-time availability and instant confirmations.",
    icon: <IconCalendar />,
  },
  {
    title: "Online Ordering",
    description:
      "Accept dine-in and takeaway orders directly from the QR menu on every table.",
    icon: <IconCart />,
    highlight: true,
  },
  {
    title: "Payments (MyFatoorah)",
    description:
      "Collect payments securely with MyFatoorah — built for Kuwait and the Gulf.",
    icon: <IconCard />,
  },
  {
    title: "Analytics",
    description:
      "Track scans, bestsellers, and peak hours so you can optimize every service.",
    icon: <IconChart />,
    highlight: true,
  },
  {
    title: "Multi-language",
    description:
      "Switch between English and Arabic with full RTL layouts for every guest.",
    icon: <IconGlobe />,
  },
  {
    title: "Customer Reviews",
    description:
      "Capture guest feedback after visits and turn praise into social proof.",
    icon: <IconStar />,
  },
  {
    title: "Staff Management",
    description:
      "Assign roles, manage permissions, and keep your team aligned from one place.",
    icon: <IconUsers />,
    comingSoon: true,
  },
  {
    title: "Cloud Dashboard",
    description:
      "Manage menus, orders, and branches from a secure cloud dashboard anywhere.",
    icon: <IconCloud />,
  },
];

function FeatureCard({ feature }: { feature: Feature }) {
  return (
    <motion.article
      variants={cardVariants}
      className={`group relative flex h-[320px] flex-col overflow-hidden rounded-2xl bg-black/40 p-8 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-gold/55 hover:shadow-[0_24px_60px_rgba(212,175,55,0.16)] ${
        feature.highlight
          ? "border border-gold/40 shadow-[0_10px_40px_rgba(0,0,0,0.45),0_0_32px_rgba(212,175,55,0.12)]"
          : "border border-gold/20"
      }`}
    >
      {/* Hover gold glow */}
      <div
        className="pointer-events-none absolute -inset-px rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(600px circle at var(--x, 50%) var(--y, 0%), rgba(212,175,55,0.12), transparent 40%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden="true"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(212,175,55,0.25), 0 0 40px rgba(212,175,55,0.1)",
        }}
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        <div className="mb-6 flex shrink-0 items-start justify-between gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-black shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition-transform duration-500 ease-out group-hover:rotate-6 group-hover:scale-105">
            {feature.icon}
          </div>
          {feature.comingSoon && (
            <span className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
              Coming Soon
            </span>
          )}
        </div>

        <h3 className="shrink-0 font-serif text-xl font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-gold sm:text-[1.35rem]">
          {feature.title}
        </h3>

        <p className="mt-3 min-h-0 flex-1 overflow-hidden text-sm leading-relaxed text-white/60 sm:text-[15px]">
          {feature.description}
        </p>

        <a
          href="/demo"
          className="mt-6 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-gold/75 transition-colors duration-300 hover:text-gold group-hover:text-gold"
        >
          Learn More
          <span
            className="inline-block transition-transform duration-300 ease-out group-hover:translate-x-1.5"
            aria-hidden="true"
          >
            →
          </span>
        </a>
      </div>
    </motion.article>
  );
}

export function Features() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-background py-28 lg:py-36"
      aria-labelledby="features-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      {/* Background atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/30" />
        <div className="absolute left-1/2 top-20 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="absolute -left-28 top-1/3 h-80 w-80 rounded-full bg-gold/[0.04] blur-3xl" />
        <div className="absolute -right-20 bottom-40 h-96 w-96 rounded-full bg-gold/[0.05] blur-3xl" />
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
            Features
          </p>
          <h2
            id="features-heading"
            className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl xl:text-6xl"
          >
            Everything Your Restaurant Needs
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-base leading-relaxed text-white/60 sm:text-lg">
            One platform for menus, QR ordering, reservations, analytics and
            payments.
          </p>
        </motion.div>

        {/* Uniform SaaS feature grid */}
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
        >
          {features.map((feature) => (
            <FeatureCard key={feature.title} feature={feature} />
          ))}
        </motion.div>

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
              Ready to modernize your restaurant?
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
