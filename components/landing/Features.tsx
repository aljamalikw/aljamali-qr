"use client";

import { motion } from "framer-motion";
import { Button } from "./Button";

const features = [
  {
    icon: "🌐",
    title: "Bilingual Support",
    description:
      "Switch instantly between English and Arabic with full RTL support.",
  },
  {
    icon: "⚡",
    title: "Instant Menu Updates",
    description:
      "Update menu items in seconds without printing new menus.",
  },
  {
    icon: "📱",
    title: "QR Code Menus",
    description:
      "Customers simply scan and browse beautifully designed digital menus.",
  },
  {
    icon: "📊",
    title: "Analytics Dashboard",
    description:
      "Track scans, customer engagement and menu performance.",
  },
  {
    icon: "🛒",
    title: "QR Ordering",
    description: "Accept customer orders directly from their phones.",
  },
  {
    icon: "📅",
    title: "Reservations",
    description: "Allow customers to reserve tables online.",
  },
  {
    icon: "💳",
    title: "Secure Online Payments",
    description:
      "Accept payments safely with MyFatoorah integration.",
  },
  {
    icon: "🔔",
    title: "Real-Time Notifications",
    description: "Receive instant alerts for orders and reservations.",
  },
  {
    icon: "🏢",
    title: "Multi-Branch Management",
    description:
      "Manage multiple restaurant locations from one dashboard.",
  },
] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as const,
    },
  },
};

function FeatureCard({
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
      className="group relative flex h-full flex-col rounded-3xl border border-gold/20 bg-black/40 p-7 shadow-[0_8px_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-gold/50 hover:bg-black/55 hover:shadow-[0_20px_50px_rgba(212,175,55,0.14)] sm:p-8"
    >
      <div
        className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-2xl shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition-transform duration-500 ease-out group-hover:rotate-6 group-hover:scale-105"
        aria-hidden="true"
      >
        {icon}
      </div>

      <h3 className="font-serif text-xl font-semibold tracking-tight text-white transition-colors duration-300 group-hover:text-gold sm:text-[1.35rem]">
        {title}
      </h3>

      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/65 sm:text-[15px]">
        {description}
      </p>

      <div
        className="mt-6 flex items-center text-gold/70 transition-all duration-300 group-hover:text-gold"
        aria-hidden="true"
      >
        <svg
          className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-1.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 12h14M13 5l7 7-7 7"
          />
        </svg>
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

      {/* Subtle radial gold glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="absolute -left-24 top-1/2 h-80 w-80 rounded-full bg-gold/[0.04] blur-3xl" />
        <div className="absolute -right-24 bottom-32 h-72 w-72 rounded-full bg-gold/[0.05] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          className="mx-auto mb-16 max-w-[700px] text-center lg:mb-20"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
            Features
          </p>
          <h2
            id="features-heading"
            className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Powerful Features for Modern Restaurants
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-base leading-relaxed text-white/65 sm:text-lg">
            Everything you need to digitize your restaurant, improve customer
            experience, and manage your menu effortlessly.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 lg:gap-7"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {features.map((feature) => (
            <FeatureCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          className="mx-auto mt-24 max-w-2xl text-center lg:mt-32"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-black/40 px-8 py-12 shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:px-12 sm:py-14">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]"
              aria-hidden="true"
            />
            <h3 className="relative font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Everything your restaurant needs in one platform.
            </h3>
            <div className="relative mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
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
