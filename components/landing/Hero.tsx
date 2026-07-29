"use client";

import { motion } from "framer-motion";
import { Button } from "./Button";

const trustItems = [
  { icon: "⚡", label: "Setup in 5 Minutes" },
  { icon: "🌐", label: "English & Arabic" },
  { icon: "📱", label: "Mobile Friendly" },
  { icon: "📊", label: "Analytics Included" },
  { icon: "💳", label: "Online Payments" },
] as const;

const floatingCards = [
  {
    id: "qr",
    title: "QR Menu Ready",
    subtitle: null,
    className: "-left-2 top-[6%] sm:-left-6 lg:-left-10 xl:-left-14",
    delay: 0,
    duration: 6.5,
  },
  {
    id: "payment",
    title: "Payment Connected",
    subtitle: "MyFatoorah",
    className: "-right-1 top-[4%] sm:-right-4 lg:-right-8 xl:-right-12",
    delay: 0.8,
    duration: 7.2,
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "+28%",
    className: "-left-3 top-[38%] sm:-left-8 lg:-left-12",
    delay: 1.4,
    duration: 6.8,
  },
  {
    id: "lang",
    title: "English / العربية",
    subtitle: null,
    className: "-right-2 top-[42%] sm:-right-6 lg:-right-10",
    delay: 0.4,
    duration: 7.5,
  },
  {
    id: "rating",
    title: "Customer Rating",
    subtitle: "4.9",
    className: "left-[8%] -bottom-2 sm:left-[10%] sm:-bottom-4",
    delay: 1.1,
    duration: 6.2,
  },
  {
    id: "menu",
    title: "Menu Updated",
    subtitle: "2 minutes ago",
    className: "right-[6%] -bottom-1 sm:right-[8%] sm:-bottom-3",
    delay: 1.7,
    duration: 7.0,
  },
] as const;

const chartBars = [38, 52, 46, 68, 58, 82, 74, 90, 66, 78, 94, 72, 86, 80];

const recentOrders = [
  { name: "Table 12", item: "Grilled Lamb", amount: "18.5", status: "New" },
  { name: "Table 4", item: "Mixed Grill", amount: "24.0", status: "Prep" },
  { name: "Takeaway", item: "Hummus Bowl", amount: "6.5", status: "Done" },
] as const;

const popularItems = [
  { name: "Grilled Lamb", views: "312" },
  { name: "Saffron Rice", views: "268" },
  { name: "Kunafa", views: "194" },
] as const;

const peakHours = [
  { label: "12–2", level: 55 },
  { label: "2–5", level: 30 },
  { label: "5–7", level: 70 },
  { label: "7–9", level: 95 },
  { label: "9–11", level: 60 },
] as const;

const reservations = [
  { time: "7:30 PM", party: "4 guests", name: "Al-Rashid" },
  { time: "8:15 PM", party: "2 guests", name: "Noor" },
  { time: "9:00 PM", party: "6 guests", name: "Hassan" },
] as const;

const sidebarItems = [
  { label: "Overview", active: true },
  { label: "Menu", active: false },
  { label: "Orders", active: false },
  { label: "Reservations", active: false },
  { label: "Analytics", active: false },
  { label: "Payments", active: false },
] as const;

const easeOut = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: easeOut },
  },
};

const leftStagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

function DashboardMockup() {
  return (
    <motion.div
      className="relative w-full origin-center"
      whileHover={{ rotate: 1.25, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
    >
      <div className="overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-b from-[#161616]/95 via-[#0c0c0c]/95 to-[#080808]/98 shadow-[0_50px_120px_rgba(0,0,0,0.7),0_0_0_1px_rgba(212,175,55,0.1),0_0_80px_rgba(212,175,55,0.08)] backdrop-blur-2xl">
        {/* Window chrome */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] bg-black/55 px-5 py-3.5">
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-gold/55" />
          <span className="ml-3 truncate text-[11px] tracking-wide text-white/35">
            app.aljamaliqr.com / dashboard
          </span>
          <span className="ms-auto hidden rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400 sm:inline-flex sm:items-center sm:gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <div className="flex min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]">
          {/* Sidebar */}
          <aside className="hidden w-[132px] shrink-0 border-r border-white/[0.06] bg-black/45 p-3.5 md:block">
            <div className="mb-5 flex items-center gap-2 px-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] font-serif text-[11px] font-bold text-black shadow-md shadow-gold/25">
                AQ
              </span>
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-white/85">
                  Aljamali
                </p>
                <p className="text-[9px] text-white/35">Admin</p>
              </div>
            </div>
            <nav className="space-y-1" aria-hidden="true">
              {sidebarItems.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg px-2.5 py-2 text-[11px] transition-colors ${
                    item.active
                      ? "bg-gold/15 font-medium text-gold"
                      : "text-white/40"
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </nav>
            <div className="mt-auto pt-8">
              <div className="rounded-xl border border-gold/20 bg-gold/5 p-2.5">
                <p className="text-[9px] uppercase tracking-wider text-gold/70">
                  Plan
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-white/85">
                  Professional
                </p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 space-y-3 p-3.5 sm:space-y-3.5 sm:p-4 lg:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gold/75">
                  Restaurant Dashboard
                </p>
                <h3 className="mt-1 font-serif text-lg font-semibold text-white sm:text-xl">
                  Saffron Garden
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-white/45 sm:inline">
                  Today
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-400 md:hidden">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Live
                </span>
              </div>
            </div>

            {/* Top stats */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5">
              {[
                { label: "QR Scans", value: "2,381", delta: "+12%" },
                { label: "Orders", value: "148", delta: "+8%" },
                { label: "Reservations", value: "42", delta: "+5%" },
                { label: "Revenue", value: "1,920", delta: "+18%", unit: "KWD" },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-gold/15 bg-white/[0.035] px-3 py-3 backdrop-blur-sm"
                >
                  <p className="text-[9px] uppercase tracking-wider text-white/40">
                    {stat.label}
                  </p>
                  <p className="mt-1.5 font-serif text-base font-bold text-white sm:text-lg">
                    {stat.value}
                    {stat.unit && (
                      <span className="ms-1 text-[9px] font-medium text-gold/80">
                        {stat.unit}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-[10px] font-medium text-emerald-400/90">
                    {stat.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart + popular / peak */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-5">
              <div className="rounded-2xl border border-gold/15 bg-white/[0.03] p-3.5 sm:col-span-3">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-medium text-white/70">
                      Weekly Analytics
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/35">
                      QR scans & engagement
                    </p>
                  </div>
                  <p className="rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold text-gold">
                    +18%
                  </p>
                </div>
                <div
                  className="flex h-24 items-end gap-1 sm:h-28 sm:gap-1.5"
                  aria-hidden="true"
                >
                  {chartBars.map((height, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-md bg-gradient-to-t from-[#b8942e]/35 via-gold/65 to-[#e8c547]"
                      style={{
                        height: `${height}%`,
                        opacity: 0.5 + (i % 4) * 0.12,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:col-span-2 sm:grid-cols-1">
                <div className="rounded-2xl border border-gold/15 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                    Popular Items
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {popularItems.map((item) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="truncate text-[11px] text-white/80">
                          {item.name}
                        </span>
                        <span className="shrink-0 text-[10px] text-gold/80">
                          {item.views}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-2xl border border-gold/15 bg-white/[0.03] p-3">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                    Peak Hours
                  </p>
                  <div className="mt-2.5 flex items-end gap-1.5" aria-hidden="true">
                    {peakHours.map((h) => (
                      <div key={h.label} className="flex flex-1 flex-col items-center gap-1">
                        <div
                          className="w-full rounded-sm bg-gradient-to-t from-gold/30 to-gold/80"
                          style={{ height: `${h.level * 0.36}px` }}
                        />
                        <span className="text-[8px] text-white/35">{h.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Orders, reservations, actions */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-2xl border border-gold/15 bg-white/[0.03] p-3 sm:col-span-1">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                  Recent Orders
                </p>
                <ul className="mt-2 space-y-2">
                  {recentOrders.map((order) => (
                    <li
                      key={`${order.name}-${order.item}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-white/85">
                          {order.name}
                        </p>
                        <p className="truncate text-[10px] text-white/40">
                          {order.item}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <p className="text-[11px] font-semibold text-gold/90">
                          {order.amount}
                        </p>
                        <p className="text-[9px] text-white/35">{order.status}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gold/15 bg-white/[0.03] p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                  Today&apos;s Reservations
                </p>
                <ul className="mt-2 space-y-2">
                  {reservations.map((r) => (
                    <li
                      key={`${r.time}-${r.name}`}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-white/85">
                          {r.name}
                        </p>
                        <p className="text-[10px] text-white/40">{r.party}</p>
                      </div>
                      <span className="shrink-0 text-[10px] text-gold/80">
                        {r.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-gold/15 bg-white/[0.03] p-3">
                <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                  Quick Actions
                </p>
                <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                  {["Edit Menu", "New QR", "Orders", "Reports"].map((action) => (
                    <div
                      key={action}
                      className="rounded-xl border border-gold/20 bg-gold/5 px-2 py-2.5 text-center text-[10px] font-medium text-gold/90"
                    >
                      {action}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="mx-auto mt-2 h-4 w-[90%] rounded-[100%] bg-gold/15 blur-2xl"
        aria-hidden="true"
      />
    </motion.div>
  );
}

function FloatingCard({
  title,
  subtitle,
  className,
  delay,
  duration,
  index,
}: {
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
      initial={{ opacity: 0, y: 18, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.65,
        delay: 0.7 + index * 0.1,
        ease: easeOut,
      }}
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{
          duration,
          repeat: Infinity,
          ease: "easeInOut",
          delay,
        }}
        className="rounded-2xl border border-gold/30 bg-black/75 px-3.5 py-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl sm:px-4 sm:py-3"
      >
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-[10px] font-bold text-black"
            aria-hidden="true"
          >
            ✓
          </span>
          <div className="min-w-0">
            <p className="whitespace-nowrap text-xs font-semibold text-white sm:text-[13px]">
              {title}
            </p>
            {subtitle && (
              <p
                className={`mt-0.5 text-[11px] font-medium ${
                  subtitle.startsWith("+") || subtitle === "4.9"
                    ? "text-emerald-400"
                    : "text-gold/80"
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
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Restaurant photo at very low opacity */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-[0.12]"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80')",
        }}
      />

      <div className="absolute inset-0 bg-background" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#080808]/92 to-background" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-transparent to-black/85" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.75)_100%)]" />

      <motion.div
        className="absolute left-[12%] top-[18%] h-[460px] w-[460px] rounded-full bg-gold/[0.08] blur-3xl"
        animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.05, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute right-[5%] top-[25%] h-[420px] w-[420px] rounded-full bg-gold/[0.07] blur-3xl"
        animate={{ opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(212,175,55,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.6) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage:
            "radial-gradient(ellipse at center, black 15%, transparent 70%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 15%, transparent 70%)",
        }}
      />
    </div>
  );
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] flex-col justify-center overflow-hidden pt-24 pb-10 sm:pt-28 lg:pb-12"
      aria-labelledby="hero-heading"
    >
      <HeroBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.45fr_0.55fr] lg:gap-20 xl:gap-28">
          {/* Left copy — 45% */}
          <motion.div
            className="mx-auto max-w-[560px] text-center lg:mx-0 lg:max-w-none lg:text-left"
            variants={leftStagger}
            initial="hidden"
            animate="visible"
          >
            <motion.p
              variants={fadeUp}
              className="inline-flex items-center gap-2 rounded-full border border-gold/30 bg-black/55 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-gold backdrop-blur-md"
            >
              <span aria-hidden="true">✨</span>
              Aljamali QR
            </motion.p>

            <motion.h1
              id="hero-heading"
              variants={fadeUp}
              className="mt-8 font-serif text-4xl font-bold leading-[0.98] tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl xl:leading-[0.95]"
            >
              Transform Your Restaurant
              <br />
              with{" "}
              <span className="gold-gradient-text">
                Smart Digital
                <br className="hidden sm:block" />
                QR Menus
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-8 max-w-[560px] text-base leading-relaxed text-white/55 sm:text-lg lg:mx-0 lg:text-[19px]"
            >
              Replace printed menus with a complete digital platform for QR
              menus, ordering, reservations, payments and analytics.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-10 flex flex-col items-center gap-3.5 sm:flex-row sm:justify-center sm:gap-4 lg:justify-start"
            >
              <Button
                href="/register"
                className="w-full min-w-[210px] px-10 py-4 text-base shadow-xl shadow-gold/35 sm:w-auto sm:text-lg"
              >
                Start Free Trial
              </Button>
              <Button
                href="/demo"
                variant="secondary"
                className="w-full min-w-[210px] border-gold/40 bg-black/45 px-10 py-4 text-base backdrop-blur-md sm:w-auto sm:text-lg"
              >
                View Live Demo
              </Button>
            </motion.div>
          </motion.div>

          {/* Right product — 55% */}
          <motion.div
            className="relative mx-auto w-full max-w-[640px] scale-100 lg:max-w-none lg:scale-[1.08] xl:scale-[1.12]"
            initial={{ opacity: 0, x: 56 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease: easeOut }}
            aria-hidden="true"
          >
            <DashboardMockup />

            {floatingCards.map((card, index) => (
              <FloatingCard
                key={card.id}
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

        {/* Trust bar */}
        <motion.div
          className="mx-auto mt-14 w-full max-w-5xl lg:mt-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, delay: 1.05, ease: easeOut }}
        >
          <ul className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
            {trustItems.map((item) => (
              <li
                key={item.label}
                className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-black/50 px-3.5 py-2 text-xs text-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md sm:px-4 sm:py-2.5 sm:text-sm"
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>
    </section>
  );
}
