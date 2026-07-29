"use client";

import { motion } from "framer-motion";
import { Button } from "./Button";

const easeOut = [0.22, 1, 0.36, 1] as const;

const testimonials = [
  {
    quote:
      "Aljamali QR transformed how we serve guests. Menu updates go live instantly, and our bilingual experience has been a hit with tourists and locals alike.",
    restaurant: "Maison Levant",
    owner: "Omar Al-Rashid",
    location: "Kuwait City",
    initials: "ML",
  },
  {
    quote:
      "We replaced printed menus across four branches in one afternoon. The gold-themed digital experience matches our brand perfectly.",
    restaurant: "Ember & Oak",
    owner: "Sarah Mitchell",
    location: "Salmiya",
    initials: "EO",
  },
  {
    quote:
      "The analytics alone paid for the subscription. We discovered which dishes drive repeat visits and optimized our menu accordingly.",
    restaurant: "Noor Bistro",
    owner: "Khalid Al-Farsi",
    location: "Sharq",
    initials: "NB",
  },
] as const;

const trustItems = [
  "Secure Cloud Platform",
  "English & Arabic",
  "QR Ordering",
  "MyFatoorah Payments",
] as const;

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

function StarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 3.5l2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.9 7.2 18.4l.9-5.4-3.9-3.8 5.4-.8L12 3.5z" />
    </svg>
  );
}

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative overflow-hidden bg-background py-28 lg:py-36"
      aria-labelledby="testimonials-heading"
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
            Success Stories
          </p>
          <h2
            id="testimonials-heading"
            className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Restaurant Owners Love Aljamali QR
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-base leading-relaxed text-white/60 sm:text-lg">
            See how digital menus help restaurants modernize service and improve
            customer experience.
          </p>
          <p className="mx-auto mt-4 max-w-md text-xs leading-relaxed text-white/40 sm:text-sm">
            The stories below are sample testimonials for demonstration until
            verified customer reviews are published.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          className="grid grid-cols-1 gap-5 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-7"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.12 }}
        >
          {testimonials.map((item) => (
            <motion.blockquote
              key={item.restaurant}
              variants={cardVariants}
              className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gold/20 bg-black/45 p-7 shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 hover:border-gold/50 hover:shadow-[0_24px_60px_rgba(212,175,55,0.14)] sm:p-8"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                aria-hidden="true"
                style={{
                  background:
                    "radial-gradient(420px circle at 50% 0%, rgba(212,175,55,0.12), transparent 45%)",
                }}
              />

              <div className="relative z-10 flex h-full flex-col">
                <div className="mb-5 flex items-start justify-between gap-3">
                  <span
                    className="font-serif text-5xl leading-none text-gold/35"
                    aria-hidden="true"
                  >
                    &ldquo;
                  </span>
                  <span className="rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                    Sample Testimonial
                  </span>
                </div>

                <div
                  className="mb-5 flex gap-1 text-gold"
                  role="img"
                  aria-label="5 out of 5 stars"
                >
                  {Array.from({ length: 5 }).map((_, i) => (
                    <StarIcon key={i} className="h-4 w-4" />
                  ))}
                </div>

                <p className="flex-1 text-[15px] leading-relaxed text-white/75 sm:text-base">
                  {item.quote}
                </p>

                <footer className="mt-8 border-t border-white/[0.08] pt-6">
                  <div className="flex items-center gap-3.5">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gradient-to-br from-[#e8c547]/20 via-gold/10 to-transparent font-serif text-sm font-bold text-gold"
                      aria-hidden="true"
                    >
                      {item.initials}
                    </div>
                    <cite className="min-w-0 not-italic">
                      <span className="block font-serif text-base font-semibold text-white">
                        {item.restaurant}
                      </span>
                      <span className="mt-0.5 block text-sm text-white/55">
                        {item.owner}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/40">
                        {item.location}
                      </span>
                    </cite>
                  </div>
                </footer>
              </div>
            </motion.blockquote>
          ))}
        </motion.div>

        {/* Trust strip */}
        <motion.ul
          className="mx-auto mt-14 flex max-w-4xl flex-wrap items-center justify-center gap-3 sm:gap-4 lg:mt-16"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, ease: easeOut }}
        >
          {trustItems.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-2 rounded-full border border-gold/20 bg-black/45 px-4 py-2 text-sm text-white/60 shadow-[0_8px_24px_rgba(0,0,0,0.3)] backdrop-blur-md"
            >
              <span className="text-gold" aria-hidden="true">
                ✔
              </span>
              <span>{item}</span>
            </li>
          ))}
        </motion.ul>

        {/* CTA */}
        <motion.div
          className="mx-auto mt-20 max-w-3xl text-center lg:mt-24"
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
