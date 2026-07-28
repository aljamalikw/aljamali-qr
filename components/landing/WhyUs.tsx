"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useInView,
  useSpring,
  useTransform,
} from "framer-motion";
import { Button } from "./Button";

const benefits = [
  {
    icon: "✨",
    title: "Premium Customer Experience",
    description: "Beautiful menus customers love to browse.",
  },
  {
    icon: "📄",
    title: "No Printing Costs",
    description: "Update menus anytime without reprinting.",
  },
  {
    icon: "⚡",
    title: "Faster Restaurant Operations",
    description: "Reduce staff workload through digital automation.",
  },
  {
    icon: "📈",
    title: "Increase Customer Engagement",
    description: "QR ordering, reservations and promotions.",
  },
  {
    icon: "📊",
    title: "Powerful Analytics",
    description: "Understand customer behaviour and menu performance.",
  },
  {
    icon: "🚀",
    title: "Built for Growth",
    description:
      "Perfect for cafés, restaurants and multi-branch businesses.",
  },
] as const;

const floatingCards = [
  { label: "QR Menu", x: "8%", y: "12%", delay: 0 },
  { label: "Analytics", x: "58%", y: "8%", delay: 0.4 },
  { label: "Reservations", x: "18%", y: "42%", delay: 0.8 },
  { label: "Online Orders", x: "62%", y: "38%", delay: 1.2 },
  { label: "Payments", x: "12%", y: "72%", delay: 0.6 },
  { label: "Multi-language", x: "55%", y: "68%", delay: 1.0 },
] as const;

const comparisonRows = [
  { feature: "Printing Cost", traditional: false, aljamali: true },
  { feature: "Updating Menu", traditional: false, aljamali: true },
  { feature: "Multiple Languages", traditional: false, aljamali: true },
  { feature: "QR Ordering", traditional: false, aljamali: true },
  { feature: "Reservations", traditional: false, aljamali: true },
  { feature: "Analytics", traditional: false, aljamali: true },
  { feature: "Customer Experience", traditional: false, aljamali: true },
  { feature: "Mobile Friendly", traditional: false, aljamali: true },
] as const;

const metrics = [
  { value: 500, suffix: "+", label: "Restaurants Ready", decimals: 0 },
  { value: 50, suffix: "K+", label: "Monthly QR Scans", decimals: 0 },
  { value: 99.9, suffix: "%", label: "Platform Uptime", decimals: 1 },
  { value: 24, suffix: "/7", label: "Support", decimals: 0 },
] as const;

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

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function CrossIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6 18L18 6M6 6l12 12"
      />
    </svg>
  );
}

function MetricCounter({
  value,
  suffix,
  decimals,
}: {
  value: number;
  suffix: string;
  decimals: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.6 });
  const spring = useSpring(0, { stiffness: 70, damping: 22 });
  const display = useTransform(spring, (v) =>
    decimals > 0
      ? v.toFixed(decimals)
      : Math.round(v).toLocaleString()
  );
  const [text, setText] = useState(decimals > 0 ? "0.0" : "0");

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, spring, value]);

  useEffect(() => {
    return display.on("change", (v) => setText(v));
  }, [display]);

  return (
    <span ref={ref} className="tabular-nums">
      {text}
      {suffix}
    </span>
  );
}

function FloatingIllustration() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-lg lg:max-w-none">
      {/* Layered glass panels */}
      <div
        className="absolute inset-[8%] rounded-[2rem] border border-gold/15 bg-gradient-to-br from-gold/[0.08] via-black/50 to-black/80 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        aria-hidden="true"
      />
      <div
        className="absolute inset-[16%] rounded-[1.75rem] border border-gold/20 bg-black/40 shadow-inner backdrop-blur-md"
        aria-hidden="true"
      />
      <div
        className="absolute inset-[26%] rounded-[1.5rem] border border-gold/25 bg-gradient-to-br from-gold/10 via-transparent to-black/60 backdrop-blur-sm"
        aria-hidden="true"
      />

      {/* Center accent */}
      <div
        className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-gold/30 bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] shadow-[0_12px_40px_rgba(212,175,55,0.4)] sm:h-24 sm:w-24"
        aria-hidden="true"
      >
        <span className="font-serif text-2xl font-bold text-black sm:text-3xl">
          QR
        </span>
      </div>

      {/* Floating feature chips */}
      {floatingCards.map((card, index) => (
        <motion.div
          key={card.label}
          className="absolute z-10"
          style={{ left: card.x, top: card.y }}
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 4.5 + index * 0.35,
            repeat: Infinity,
            ease: "easeInOut",
            delay: card.delay,
          }}
        >
          <div className="flex items-center gap-2 rounded-full border border-gold/30 bg-black/70 px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:px-3.5 sm:py-2.5">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-[10px] font-bold text-black"
              aria-hidden="true"
            >
              ✓
            </span>
            <span className="whitespace-nowrap text-xs font-medium text-white/90 sm:text-sm">
              {card.label}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <motion.article
      variants={cardVariants}
      className="group relative flex gap-4 rounded-3xl border border-gold/20 bg-black/40 p-5 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-gold/50 hover:bg-black/55 hover:shadow-[0_16px_40px_rgba(212,175,55,0.12)] sm:p-6"
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-xl shadow-[0_6px_20px_rgba(212,175,55,0.35)] transition-transform duration-500 ease-out group-hover:rotate-6 group-hover:scale-105"
        aria-hidden="true"
      >
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-serif text-base font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-gold sm:text-lg">
            {title}
          </h3>
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-gold transition-all duration-300 group-hover:scale-110 group-hover:border-gold/60 group-hover:bg-gold/20"
            aria-hidden="true"
          >
            <CheckIcon className="h-3.5 w-3.5" />
          </span>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-white/65">
          {description}
        </p>
      </div>
    </motion.article>
  );
}

export function WhyUs() {
  return (
    <section
      id="why-us"
      className="relative overflow-hidden bg-background py-28 lg:py-36"
      aria-labelledby="why-us-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      {/* Subtle radial gold glows */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/4 top-32 h-[380px] w-[380px] rounded-full bg-gold/[0.05] blur-3xl" />
        <div className="absolute right-1/4 bottom-40 h-80 w-80 rounded-full bg-gold/[0.04] blur-3xl" />
        <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-gold/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="mx-auto mb-16 max-w-[700px] text-center lg:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Why Us
          </p>
          <h2
            id="why-us-heading"
            className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Why Restaurants Choose Aljamali QR
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-base leading-relaxed text-white/65 sm:text-lg">
            More than a digital menu. A complete platform designed to modernize
            your restaurant and improve customer experience.
          </p>
        </motion.div>

        {/* Main two-column content */}
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left: floating illustration */}
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: easeOut }}
            className="order-2 lg:order-1"
            aria-hidden="true"
          >
            <FloatingIllustration />
          </motion.div>

          {/* Right: benefit cards */}
          <motion.div
            className="order-1 grid grid-cols-1 gap-4 sm:gap-5 lg:order-2"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {benefits.map((benefit) => (
              <BenefitCard
                key={benefit.title}
                icon={benefit.icon}
                title={benefit.title}
                description={benefit.description}
              />
            ))}
          </motion.div>
        </div>

        {/* Comparison table */}
        <motion.div
          className="mx-auto mt-24 max-w-4xl lg:mt-32"
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <h3 className="mb-10 text-center font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
            Why We&apos;re Different
          </h3>

          <div className="overflow-hidden rounded-3xl border border-gold/20 bg-black/40 shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] border-collapse text-left">
                <caption className="sr-only">
                  Comparison between Traditional Printed Menus and Aljamali QR
                </caption>
                <thead>
                  <tr className="border-b border-gold/15">
                    <th
                      scope="col"
                      className="px-5 py-5 text-xs font-semibold uppercase tracking-[0.15em] text-white/45 sm:px-8"
                    >
                      Capability
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-white/50 sm:px-6"
                    >
                      Traditional Printed Menus
                    </th>
                    <th
                      scope="col"
                      className="bg-gold/[0.06] px-4 py-5 text-center text-xs font-semibold uppercase tracking-[0.12em] text-gold sm:px-6"
                    >
                      Aljamali QR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, index) => (
                    <tr
                      key={row.feature}
                      className={
                        index < comparisonRows.length - 1
                          ? "border-b border-white/[0.06]"
                          : ""
                      }
                    >
                      <th
                        scope="row"
                        className="px-5 py-4 text-sm font-medium text-white/85 sm:px-8 sm:text-[15px]"
                      >
                        {row.feature}
                      </th>
                      <td className="px-4 py-4 text-center sm:px-6">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-red-500/25 bg-red-500/10 text-red-400"
                          aria-label="Not available"
                        >
                          <CrossIcon className="h-3.5 w-3.5" />
                        </span>
                      </td>
                      <td className="bg-gold/[0.04] px-4 py-4 text-center sm:px-6">
                        <span
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-gold/35 bg-gold/15 text-gold"
                          aria-label="Included"
                        >
                          <CheckIcon className="h-3.5 w-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Trust metrics strip */}
        <motion.div
          className="mx-auto mt-20 grid max-w-5xl grid-cols-2 gap-4 sm:gap-6 lg:mt-28 lg:grid-cols-4"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {metrics.map((metric) => (
            <motion.div
              key={metric.label}
              variants={cardVariants}
              className="rounded-3xl border border-gold/20 bg-black/40 px-4 py-7 text-center shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:px-6 sm:py-8"
            >
              <p className="font-serif text-3xl font-bold tracking-tight text-gold sm:text-4xl">
                <MetricCounter
                  value={metric.value}
                  suffix={metric.suffix}
                  decimals={metric.decimals}
                />
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.14em] text-white/50 sm:text-sm sm:normal-case sm:tracking-normal">
                {metric.label}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mx-auto mt-24 max-w-2xl text-center lg:mt-32"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-black/40 px-8 py-12 shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:px-12 sm:py-14">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]"
              aria-hidden="true"
            />
            <h3 className="relative font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Ready to modernize your restaurant?
            </h3>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <Button
                href="/register"
                className="min-w-[200px] px-9 py-3.5 text-base sm:min-w-[220px]"
              >
                Start Free Trial
              </Button>
              <Button
                href="/schedule-demo"
                variant="secondary"
                className="min-w-[200px] px-9 py-3.5 text-base sm:min-w-[220px]"
              >
                Schedule Demo
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
