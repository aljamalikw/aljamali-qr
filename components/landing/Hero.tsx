"use client";

import { motion } from "framer-motion";
import { Button } from "./Button";

const trustItems = [
  "Setup in Minutes",
  "English & Arabic",
  "Unlimited QR Scans",
  "MyFatoorah Payments",
] as const;

const floatingCards = [
  {
    id: "qr",
    icon: "📱",
    title: "QR Menu Ready",
    subtitle: null,
    className: "left-[-4%] top-[8%] sm:left-[-6%] sm:top-[6%]",
    delay: 0,
    duration: 5.2,
  },
  {
    id: "analytics",
    icon: "📊",
    title: "Analytics",
    subtitle: "+28%",
    className: "right-[-2%] top-[4%] sm:right-[-4%] sm:top-[2%]",
    delay: 0.6,
    duration: 4.8,
  },
  {
    id: "payment",
    icon: "💳",
    title: "Payment Connected",
    subtitle: "MyFatoorah",
    className: "left-[-6%] bottom-[28%] sm:left-[-8%] sm:bottom-[26%]",
    delay: 1.1,
    duration: 5.6,
  },
  {
    id: "lang",
    icon: "🌐",
    title: "English / العربية",
    subtitle: null,
    className: "right-[-4%] bottom-[34%] sm:right-[-6%] sm:bottom-[32%]",
    delay: 0.3,
    duration: 4.4,
  },
  {
    id: "rating",
    icon: "⭐",
    title: "4.9 Customer Rating",
    subtitle: null,
    className: "left-[18%] bottom-[-2%] sm:left-[22%] sm:bottom-[-4%]",
    delay: 0.9,
    duration: 5.0,
  },
] as const;

const chartBars = [42, 58, 48, 72, 64, 88, 76, 92, 70, 84, 96, 80];

const sidebarItems = [
  { label: "Overview", active: true },
  { label: "Menu", active: false },
  { label: "Orders", active: false },
  { label: "QR Codes", active: false },
  { label: "Analytics", active: false },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

const leftVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

const leftStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[540px] lg:max-w-none">
      {/* Laptop frame */}
      <div className="overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] shadow-[0_40px_100px_rgba(0,0,0,0.65),0_0_0_1px_rgba(212,175,55,0.08)] sm:rounded-3xl">
        {/* Title bar */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-black/50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold/50" />
          <span className="ml-3 truncate text-[11px] tracking-wide text-white/35">
            app.aljamaliqr.com / dashboard
          </span>
        </div>

        <div className="flex min-h-[280px] sm:min-h-[340px]">
          {/* Sidebar */}
          <aside className="hidden w-[118px] shrink-0 border-r border-white/[0.06] bg-black/40 p-3 sm:block">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] font-serif text-[10px] font-bold text-black">
                AQ
              </span>
              <span className="text-[10px] font-semibold tracking-wide text-white/80">
                Aljamali
              </span>
            </div>
            <nav className="space-y-1" aria-hidden="true">
              {sidebarItems.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg px-2.5 py-2 text-[11px] ${
                    item.active
                      ? "bg-gold/15 font-medium text-gold"
                      : "text-white/40"
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </nav>
            <div className="mt-6 rounded-xl border border-gold/15 bg-gold/5 p-2.5">
              <p className="text-[9px] uppercase tracking-wider text-gold/70">
                Plan
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-white/80">
                Professional
              </p>
            </div>
          </aside>

          {/* Main panel */}
          <div className="flex-1 p-3.5 sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] uppercase tracking-[0.16em] text-gold/70">
                  Restaurant Dashboard
                </p>
                <p className="mt-0.5 font-serif text-sm font-semibold text-white sm:text-base">
                  Saffron Garden
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Live
              </span>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
              {[
                { label: "QR Scans", value: "2,381" },
                { label: "Orders", value: "148" },
                { label: "Reservations", value: "42" },
                { label: "Revenue", value: "1,920" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-gold/15 bg-white/[0.03] px-2.5 py-2.5 backdrop-blur-sm"
                >
                  <p className="text-[9px] uppercase tracking-wider text-white/40">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-serif text-sm font-bold text-white sm:text-base">
                    {stat.value}
                    {stat.label === "Revenue" && (
                      <span className="ms-1 text-[9px] font-medium text-gold/80">
                        KWD
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart + side cards */}
            <div className="mt-3 grid grid-cols-5 gap-2.5">
              <div className="col-span-3 rounded-xl border border-gold/15 bg-white/[0.03] p-3">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-medium text-white/55">
                    Weekly Scans
                  </p>
                  <p className="text-[10px] font-semibold text-gold">+18%</p>
                </div>
                <div
                  className="flex h-16 items-end gap-1 sm:h-20 sm:gap-1.5"
                  aria-hidden="true"
                >
                  {chartBars.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm bg-gradient-to-t from-[#b8942e]/40 via-gold/70 to-[#e8c547]"
                      style={{ height: `${height}%`, opacity: 0.55 + (i % 3) * 0.15 }}
                    />
                  ))}
                </div>
              </div>

              <div className="col-span-2 flex flex-col gap-2">
                <div className="flex-1 rounded-xl border border-gold/15 bg-white/[0.03] p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-white/40">
                    Top Dish
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-white/85">
                    Grilled Lamb
                  </p>
                  <p className="mt-0.5 text-[10px] text-gold/80">312 views</p>
                </div>
                <div className="flex-1 rounded-xl border border-gold/15 bg-white/[0.03] p-2.5">
                  <p className="text-[9px] uppercase tracking-wider text-white/40">
                    Peak Hour
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-white/85">
                    7:00 – 9:00 PM
                  </p>
                  <p className="mt-0.5 text-[10px] text-emerald-400/90">Busy</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Soft base reflection */}
      <div
        className="mx-auto mt-1 h-3 w-[88%] rounded-[100%] bg-gold/10 blur-xl"
        aria-hidden="true"
      />
    </div>
  );
}

function FloatingCard({
  icon,
  title,
  subtitle,
  className,
  delay,
  duration,
  index,
}: {
  icon: string;
  title: string;
  subtitle: string | null;
  className: string;
  delay: number;
  duration: number;
  index: number;
}) {
  return (
    <motion.div
      className={`absolute z-20 ${className}`}
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.6,
        delay: 0.55 + index * 0.1,
        ease: easeOut,
      }}
    >
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
        className="rounded-2xl border border-gold/25 bg-black/70 px-3.5 py-2.5 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:px-4 sm:py-3"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8c547]/20 via-gold/10 to-transparent text-base"
            aria-hidden="true"
          >
            {icon}
          </span>
          <div className="min-w-0">
            <p className="whitespace-nowrap text-xs font-semibold text-white sm:text-[13px]">
              {title}
            </p>
            {subtitle && (
              <p
                className={`mt-0.5 text-[11px] font-medium ${
                  subtitle.startsWith("+") ? "text-emerald-400" : "text-gold/80"
                }`}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Base */}
      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#0a0a0a] to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/80" />

      {/* Soft gold radial glows */}
      <motion.div
        className="absolute left-[15%] top-[20%] h-[420px] w-[420px] rounded-full bg-gold/[0.09] blur-3xl"
        animate={{ opacity: [0.45, 0.75, 0.45], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[8%] top-[30%] h-[380px] w-[380px] rounded-full bg-gold/[0.07] blur-3xl"
        animate={{ opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <div className="absolute bottom-[-10%] left-1/2 h-[300px] w-[600px] -translate-x-1/2 rounded-full bg-gold/[0.04] blur-3xl" />

      {/* Thin grid */}
      <div
        className="absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.5) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          maskImage:
            "radial-gradient(ellipse at center, black 20%, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 20%, transparent 75%)",
        }}
      />

      {/* Tiny particles */}
      {[
        { top: "18%", left: "12%", size: 2 },
        { top: "28%", left: "72%", size: 1.5 },
        { top: "55%", left: "22%", size: 2 },
        { top: "42%", left: "88%", size: 1.5 },
        { top: "70%", left: "65%", size: 2 },
        { top: "15%", left: "48%", size: 1.5 },
        { top: "78%", left: "35%", size: 1.5 },
        { top: "35%", left: "58%", size: 2 },
      ].map((p, i) => (
        <motion.span
          key={i}
          className="absolute rounded-full bg-gold/60"
          style={{
            top: p.top,
            left: p.left,
            width: p.size,
            height: p.size,
            boxShadow: "0 0 8px rgba(212,175,55,0.55)",
          }}
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{
            duration: 3 + (i % 4),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.4,
          }}
        />
      ))}
    </div>
  );
}

function ScrollIndicator() {
  return (
    <motion.div
      className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.2, duration: 0.6 }}
      aria-hidden="true"
    >
      <div className="flex h-9 w-5 items-start justify-center rounded-full border border-gold/35 p-1.5">
        <motion.span
          className="h-1.5 w-1 rounded-full bg-gold"
          animate={{ y: [0, 10, 0], opacity: [1, 0.35, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.span
        className="h-6 w-px bg-gradient-to-b from-gold/50 to-transparent"
        animate={{ scaleY: [0.7, 1, 0.7], opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[85vh] items-center overflow-hidden pt-24 pb-16 sm:pt-28 lg:pb-20"
      aria-labelledby="hero-heading"
    >
      <HeroBackground />

      <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-10 lg:px-8 xl:gap-16">
        {/* Left copy */}
        <motion.div
          className="mx-auto max-w-[620px] text-center lg:mx-0 lg:text-left"
          variants={leftStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.p
            variants={leftVariants}
            className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-black/50 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold backdrop-blur-md"
          >
            <span aria-hidden="true">✨</span>
            Aljamali QR
          </motion.p>

          <motion.h1
            id="hero-heading"
            variants={leftVariants}
            className="mt-7 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl md:text-6xl xl:text-7xl"
          >
            Transform Your Restaurant
            <br className="hidden sm:block" /> with{" "}
            <span className="gold-gradient-text">Smart Digital QR Menus</span>
          </motion.h1>

          <motion.p
            variants={leftVariants}
            className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-white/70 sm:text-[20px] lg:mx-0"
          >
            Replace printed menus with a complete digital platform for QR menus,
            ordering, reservations, payments and analytics.
          </motion.p>

          <motion.div
            variants={leftVariants}
            className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:justify-center sm:gap-4 lg:justify-start"
          >
            <Button
              href="/register"
              className="w-full min-w-[200px] px-9 py-4 text-base shadow-xl shadow-gold/30 sm:w-auto sm:text-lg"
            >
              Start Free Trial
            </Button>
            <Button
              href="/demo"
              variant="secondary"
              className="w-full min-w-[200px] border-gold/40 bg-black/40 px-9 py-4 text-base backdrop-blur-md sm:w-auto sm:text-lg"
            >
              View Live Demo
            </Button>
          </motion.div>

          <motion.ul
            variants={leftVariants}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 lg:justify-start"
          >
            {trustItems.map((item) => (
              <li
                key={item}
                className="flex items-center gap-1.5 text-xs text-white/55 sm:text-sm"
              >
                <span className="text-gold" aria-hidden="true">
                  ✓
                </span>
                <span>{item}</span>
              </li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Right product mockup */}
        <motion.div
          className="relative mx-auto w-full max-w-[560px] lg:max-w-none"
          initial={{ opacity: 0, x: 48 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.85, delay: 0.25, ease: easeOut }}
          aria-hidden="true"
        >
          <DashboardMockup />

          {floatingCards.map((card, index) => (
            <FloatingCard
              key={card.id}
              icon={card.icon}
              title={card.title}
              subtitle={card.subtitle}
              className={card.className}
              delay={card.delay}
              duration={card.duration}
              index={index}
            />
          ))}
        </motion.div>
      </div>

      <ScrollIndicator />
    </section>
  );
}
