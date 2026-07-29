"use client";

import { motion } from "framer-motion";
import { Button } from "./Button";

const floatingCards = [
  {
    id: "qr",
    title: "QR Menu Ready",
    subtitle: null,
    className: "-left-2 top-4 sm:-left-3 sm:top-5 lg:-left-4 lg:top-6",
    delay: 0,
    duration: 6.5,
  },
  {
    id: "payment",
    title: "Payment Connected",
    subtitle: "MyFatoorah",
    className: "-right-2 top-4 sm:-right-3 sm:top-5 lg:-right-4 lg:top-6",
    delay: 0.8,
    duration: 7.2,
  },
  {
    id: "analytics",
    title: "Analytics",
    subtitle: "+28%",
    className: "-left-2 top-[42%] sm:-left-3 lg:-left-4",
    delay: 1.4,
    duration: 6.8,
  },
  {
    id: "lang",
    title: "English / العربية",
    subtitle: null,
    className: "-right-2 top-[48%] sm:-right-3 lg:-right-4",
    delay: 0.4,
    duration: 7.5,
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
      {/* Ambient gold glow behind the floating window */}
      <div
        className="pointer-events-none absolute -inset-6 rounded-[2rem] bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.22)_0%,transparent_68%)] blur-2xl"
        aria-hidden="true"
      />

      <div className="relative overflow-hidden rounded-3xl border border-gold/40 bg-gradient-to-b from-[#1c1c1c] via-[#141414] to-[#0e0e0e] shadow-[0_28px_60px_rgba(0,0,0,0.85),0_60px_140px_rgba(0,0,0,0.75),0_0_0_1px_rgba(212,175,55,0.22),0_0_100px_rgba(212,175,55,0.18),0_0_40px_rgba(212,175,55,0.12)] ring-1 ring-white/10">
        {/* Window chrome */}
        <div className="flex items-center gap-2.5 border-b border-white/10 bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] px-5 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57] shadow-[0_0_6px_rgba(255,95,87,0.55)]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e] shadow-[0_0_6px_rgba(254,188,46,0.45)]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840] shadow-[0_0_6px_rgba(40,200,64,0.45)]" />
          <span className="ml-3 truncate rounded-md border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-medium tracking-wide text-white/70">
            app.aljamaliqr.com / dashboard
          </span>
          <span className="ms-auto hidden rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-300 sm:inline-flex sm:items-center sm:gap-1.5">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Live
          </span>
        </div>

        <div className="flex min-h-[420px] sm:min-h-[480px] lg:min-h-[520px]">
          {/* Sidebar */}
          <aside className="hidden w-[132px] shrink-0 flex-col border-r border-white/10 bg-[#121212] p-3 md:flex">
            <div className="mb-4 flex items-center gap-2 px-1">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] font-serif text-[11px] font-bold text-black shadow-md shadow-gold/35">
                AQ
              </span>
              <div>
                <p className="text-[10px] font-semibold tracking-wide text-white">
                  Aljamali
                </p>
                <p className="text-[9px] text-white/45">Admin</p>
              </div>
            </div>
            <nav className="flex-1 space-y-0.5" aria-hidden="true">
              {sidebarItems.map((item) => (
                <div
                  key={item.label}
                  className={`rounded-lg px-2.5 py-2 text-[11px] transition-colors ${
                    item.active
                      ? "bg-gold/20 font-semibold text-gold shadow-[inset_0_0_0_1px_rgba(212,175,55,0.25)]"
                      : "text-white/50"
                  }`}
                >
                  {item.label}
                </div>
              ))}
            </nav>
            <div className="mt-3">
              <div className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/15 to-gold/5 p-2.5">
                <p className="text-[9px] uppercase tracking-wider text-gold/80">
                  Plan
                </p>
                <p className="mt-0.5 text-[11px] font-semibold text-white">
                  Professional
                </p>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1 space-y-2.5 bg-[#161616] p-3 sm:space-y-3 sm:p-3.5 lg:p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.18em] text-gold">
                  Restaurant Dashboard
                </p>
                <h3 className="mt-0.5 font-serif text-lg font-semibold text-white sm:text-xl">
                  Saffron Garden
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-lg border border-white/15 bg-[#1f1f1f] px-2.5 py-1.5 text-[10px] font-medium text-white/65 sm:inline">
                  Today
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 md:hidden">
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
                  className="rounded-xl border border-gold/25 bg-gradient-to-b from-[#242424] to-[#1a1a1a] px-3 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05),0_8px_20px_rgba(0,0,0,0.25)]"
                >
                  <p className="text-[9px] uppercase tracking-wider text-white/50">
                    {stat.label}
                  </p>
                  <p className="mt-1 font-serif text-base font-bold text-white sm:text-lg">
                    {stat.value}
                    {stat.unit && (
                      <span className="ms-1 text-[9px] font-medium text-gold">
                        {stat.unit}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold text-emerald-400">
                    {stat.delta}
                  </p>
                </div>
              ))}
            </div>

            {/* Chart + popular / peak */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-5">
              <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-[#242424] to-[#1a1a1a] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:col-span-3 sm:p-3.5">
                <div className="mb-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-white/85">
                      Weekly Analytics
                    </p>
                    <p className="mt-0.5 text-[10px] text-white/45">
                      QR scans & engagement
                    </p>
                  </div>
                  <p className="rounded-full border border-gold/30 bg-gold/15 px-2 py-0.5 text-[10px] font-bold text-gold">
                    +18%
                  </p>
                </div>
                <div
                  className="relative flex h-28 items-end gap-1 overflow-hidden rounded-lg bg-black/25 px-1.5 pb-1 pt-2 sm:h-32 sm:gap-1.5"
                  aria-hidden="true"
                >
                  <div className="pointer-events-none absolute inset-x-0 top-1/3 border-t border-dashed border-white/5" />
                  <div className="pointer-events-none absolute inset-x-0 top-2/3 border-t border-dashed border-white/5" />
                  {chartBars.map((height, i) => (
                    <div
                      key={i}
                      className="relative flex-1 rounded-t-md bg-gradient-to-t from-[#8a6d1f] via-gold to-[#f0d56a] shadow-[0_0_12px_rgba(212,175,55,0.25)]"
                      style={{
                        height: `${height}%`,
                        opacity: 0.7 + (i % 4) * 0.08,
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:col-span-2 sm:grid-cols-1">
                <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-[#242424] to-[#1a1a1a] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Popular Items
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {popularItems.map((item, index) => (
                      <li
                        key={item.name}
                        className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2 py-1.5"
                      >
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gold/20 text-[8px] font-bold text-gold">
                            {index + 1}
                          </span>
                          <span className="truncate text-[11px] text-white/85">
                            {item.name}
                          </span>
                        </div>
                        <span className="shrink-0 text-[10px] font-semibold text-gold">
                          {item.views}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-[#242424] to-[#1a1a1a] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                    Peak Hours
                  </p>
                  <div className="mt-2 flex h-[52px] items-end gap-1.5" aria-hidden="true">
                    {peakHours.map((h) => (
                      <div key={h.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                        <div
                          className="w-full rounded-t-sm bg-gradient-to-t from-[#8a6d1f] to-[#e8c547] shadow-[0_0_8px_rgba(212,175,55,0.2)]"
                          style={{ height: `${h.level}%` }}
                        />
                        <span className="text-[8px] text-white/45">{h.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Orders, reservations, actions */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-[#242424] to-[#1a1a1a] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Recent Orders
                </p>
                <ul className="mt-2 space-y-1.5">
                  {recentOrders.map((order) => (
                    <li
                      key={`${order.name}-${order.item}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-white">
                          {order.name}
                        </p>
                        <p className="truncate text-[10px] text-white/45">
                          {order.item}
                        </p>
                      </div>
                      <div className="shrink-0 text-end">
                        <p className="text-[11px] font-semibold text-gold">
                          {order.amount}
                        </p>
                        <p
                          className={`text-[9px] font-medium ${
                            order.status === "Done"
                              ? "text-emerald-400"
                              : order.status === "Prep"
                                ? "text-amber-300"
                                : "text-sky-300"
                          }`}
                        >
                          {order.status}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-[#242424] to-[#1a1a1a] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Today&apos;s Reservations
                </p>
                <ul className="mt-2 space-y-1.5">
                  {reservations.map((r) => (
                    <li
                      key={`${r.time}-${r.name}`}
                      className="flex items-center justify-between gap-2 rounded-lg bg-black/25 px-2 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[11px] font-medium text-white">
                          {r.name}
                        </p>
                        <p className="text-[10px] text-white/45">{r.party}</p>
                      </div>
                      <span className="shrink-0 rounded-md border border-gold/20 bg-gold/10 px-1.5 py-0.5 text-[10px] font-medium text-gold">
                        {r.time}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-gold/25 bg-gradient-to-b from-[#242424] to-[#1a1a1a] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
                  Quick Actions
                </p>
                <div className="mt-2 grid grid-cols-2 gap-1.5">
                  {["Edit Menu", "New QR", "Orders", "Reports"].map((action) => (
                    <div
                      key={action}
                      className="rounded-lg border border-gold/30 bg-gold/10 px-2 py-2.5 text-center text-[10px] font-semibold text-gold shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
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
        className="mx-auto mt-1 h-5 w-[92%] rounded-[100%] bg-gold/25 blur-2xl"
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
      initial={{ opacity: 0, y: 18, scale: 0.82 }}
      animate={{ opacity: 1, y: 0, scale: 0.85 }}
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
        className="rounded-xl border border-gold/35 bg-[#121212]/92 px-2.5 py-2 shadow-[0_12px_32px_rgba(0,0,0,0.6),0_0_0_1px_rgba(212,175,55,0.12)] backdrop-blur-xl sm:px-3 sm:py-2"
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-[9px] font-bold text-black"
            aria-hidden="true"
          >
            ✓
          </span>
          <div className="min-w-0">
            <p className="whitespace-nowrap text-[11px] font-semibold text-white sm:text-xs">
              {title}
            </p>
            {subtitle && (
              <p
                className={`mt-0.5 text-[10px] font-medium ${
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
      className="relative flex min-h-[88svh] flex-col justify-center overflow-x-hidden pt-20 pb-10 sm:pt-24 sm:pb-12 lg:pt-28 lg:pb-14"
      aria-labelledby="hero-heading"
    >
      <HeroBackground />

      <div className="relative z-10 mx-auto flex w-full max-w-[1400px] flex-1 flex-col justify-center px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[0.42fr_0.58fr] lg:gap-24 xl:gap-36">
          {/* Left copy — 42% */}
          <motion.div
            className="mx-auto flex w-full max-w-[640px] flex-col justify-center text-center lg:mx-0 lg:max-w-[680px] lg:text-left"
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
              className="mt-5 max-w-[680px] font-serif text-[1.52rem] font-bold leading-[0.98] tracking-tight text-white sm:mt-6 sm:text-[2.05rem] md:text-[2.55rem] lg:text-[3.1rem] xl:text-[4.1rem] xl:leading-[0.95]"
            >
              Transform Your
              <br />
              Restaurant with
              <br className="hidden sm:block" />
              <span className="mt-1 inline-block gold-gradient-text sm:mt-2">
                Smart Digital
                <br />
                QR Menus
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mx-auto mt-12 max-w-[540px] text-[15px] leading-relaxed text-white/55 sm:mt-14 sm:text-base lg:mx-0 lg:text-lg"
            >
              Replace printed menus with a complete digital platform for QR
              menus, ordering, reservations, payments and analytics.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-14 flex flex-col items-center gap-3.5 sm:mt-16 sm:flex-row sm:justify-center sm:gap-4 lg:justify-start"
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

          {/* Right product — primary visual focus */}
          <div className="relative mx-auto w-[98%] max-w-[680px] -mb-16 translate-y-20 scale-[1.14] lg:me-6 lg:ms-0 lg:mb-[-6.5rem] lg:max-w-none lg:w-full lg:-translate-x-7 lg:translate-y-[92px] lg:scale-[1.24] xl:me-8 xl:scale-[1.27]">
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 56 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.35, ease: easeOut }}
              aria-hidden="true"
            >
              <div className="relative [mask-image:linear-gradient(to_bottom,black_0%,black_86%,rgba(0,0,0,0.35)_94%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_0%,black_86%,rgba(0,0,0,0.35)_94%,transparent_100%)]">
                <DashboardMockup />
              </div>

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
        </div>
      </div>
    </section>
  );
}

const trustItems = [
  { icon: "⚡", label: "Setup in 5 Minutes" },
  { icon: "🌐", label: "English & Arabic" },
  { icon: "📱", label: "Mobile Friendly" },
  { icon: "📊", label: "Analytics Included" },
  { icon: "💳", label: "Online Payments" },
] as const;

export function TrustBar() {
  return (
    <section
      aria-label="Platform benefits"
      className="relative z-30 mx-auto mt-0 max-w-7xl -translate-y-8 px-6"
    >
      <ul className="mx-auto flex w-full flex-wrap items-center justify-center gap-x-5 gap-y-3 rounded-2xl border border-gold/25 bg-black/55 px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:gap-x-8 sm:px-8 sm:py-5">
        {trustItems.map((item) => (
          <li
            key={item.label}
            className="inline-flex items-center gap-2 text-xs text-white/65 sm:text-sm"
          >
            <span aria-hidden="true">{item.icon}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
