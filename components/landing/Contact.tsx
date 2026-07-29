"use client";

import { motion } from "framer-motion";
import {
  PLATFORM_WHATSAPP,
  whatsappPrefillMessage,
} from "@/lib/landing-data";
import { Button } from "./Button";

const easeOut = [0.22, 1, 0.36, 1] as const;

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: easeOut },
  },
};

const trustItems = [
  "No setup fees",
  "Free trial available",
  "English & Arabic",
  "Built for restaurants in Kuwait",
] as const;

function IconWhatsApp() {
  return (
    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function IconEmail() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function IconDemo() {
  return (
    <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

export function Contact() {
  const whatsappHref = `https://wa.me/${PLATFORM_WHATSAPP}?text=${encodeURIComponent(
    whatsappPrefillMessage,
  )}`;

  return (
    <section
      id="contact"
      className="relative overflow-x-hidden bg-surface py-28 lg:py-36"
      aria-labelledby="contact-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/2 top-24 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-3xl" />
        <div className="absolute -right-20 bottom-32 h-80 w-80 rounded-full bg-gold/[0.05] blur-3xl" />
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
            Contact
          </p>
          <h2
            id="contact-heading"
            className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
          >
            Let&apos;s Talk
          </h2>
          <p className="mx-auto mt-5 max-w-[700px] text-base leading-relaxed text-white/60 sm:text-lg">
            Whether you&apos;re opening your first restaurant or managing multiple
            branches, we&apos;re here to help you modernize your restaurant with
            beautiful digital QR menus.
          </p>
        </motion.div>

        {/* Contact cards */}
        <motion.div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
        >
          {/* WhatsApp — primary */}
          <motion.article
            variants={cardVariants}
            className="group relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-3xl border border-gold/45 bg-black/45 p-8 shadow-[0_12px_48px_rgba(0,0,0,0.4),0_0_36px_rgba(212,175,55,0.1)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-gold/70 hover:shadow-[0_24px_60px_rgba(212,175,55,0.2)]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(500px circle at 50% 0%, rgba(212,175,55,0.14), transparent 45%)",
              }}
            />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-black shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                <IconWhatsApp />
              </div>
              <h3 className="mt-6 font-serif text-2xl font-semibold text-white">
                WhatsApp Us
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60 sm:text-[15px]">
                Get instant answers about pricing, setup, and how Aljamali QR can
                help your restaurant.
              </p>
              <p className="mt-5 font-serif text-lg font-semibold text-gold">
                +965 6559 2134
              </p>
              <Button
                href={whatsappHref}
                className="mt-6 h-12 w-full px-6 py-3 text-base"
              >
                Chat on WhatsApp
              </Button>
            </div>
          </motion.article>

          {/* Email */}
          <motion.article
            variants={cardVariants}
            className="group relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-3xl border border-gold/20 bg-black/40 p-8 shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-gold/55 hover:shadow-[0_24px_60px_rgba(212,175,55,0.16)]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(500px circle at 50% 0%, rgba(212,175,55,0.12), transparent 45%)",
              }}
            />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-black shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                <IconEmail />
              </div>
              <h3 className="mt-6 font-serif text-2xl font-semibold text-white">
                Email Us
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60 sm:text-[15px]">
                Questions, partnerships, or business inquiries? We&apos;d love to
                hear from you.
              </p>
              <p className="mt-5 break-all font-serif text-lg font-semibold text-gold">
                aljamaliqr@gmail.com
              </p>
              <Button
                href="mailto:aljamaliqr@gmail.com"
                variant="secondary"
                className="mt-6 h-12 w-full px-6 py-3 text-base"
              >
                Send Email
              </Button>
            </div>
          </motion.article>

          {/* Demo */}
          <motion.article
            variants={cardVariants}
            className="group relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-3xl border border-gold/20 bg-black/40 p-8 shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-gold/55 hover:shadow-[0_24px_60px_rgba(212,175,55,0.16)]"
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
              style={{
                background:
                  "radial-gradient(500px circle at 50% 0%, rgba(212,175,55,0.12), transparent 45%)",
              }}
            />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-black shadow-[0_8px_24px_rgba(212,175,55,0.35)] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                <IconDemo />
              </div>
              <h3 className="mt-6 font-serif text-2xl font-semibold text-white">
                Book a Free Demo
              </h3>
              <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60 sm:text-[15px]">
                See Aljamali QR in action with a personalized walkthrough tailored
                for your restaurant.
              </p>
              <p className="mt-5 font-serif text-lg font-semibold text-gold/80">
                Free personalized walkthrough
              </p>
              <Button
                href="/schedule-demo"
                variant="secondary"
                className="mt-6 h-12 w-full px-6 py-3 text-base"
              >
                Schedule Demo
              </Button>
            </div>
          </motion.article>
        </motion.div>

        {/* Bottom CTA panel */}
        <motion.div
          className="mx-auto mt-20 max-w-4xl lg:mt-24"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.35 }}
          transition={{ duration: 0.6, ease: easeOut }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-gold/30 bg-black/50 px-8 py-14 text-center shadow-[0_16px_56px_rgba(0,0,0,0.45),0_0_40px_rgba(212,175,55,0.08)] backdrop-blur-xl sm:px-14 sm:py-16">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12)_0%,transparent_70%)]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent"
              aria-hidden="true"
            />
            <h3 className="relative font-serif text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
              Ready to Modernize Your Restaurant?
            </h3>
            <p className="relative mx-auto mt-4 max-w-xl text-sm leading-relaxed text-white/60 sm:text-base">
              Create your restaurant account today and launch your first digital
              QR menu in minutes.
            </p>
            <div className="relative mt-9 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
              <Button
                href="/register"
                className="h-12 min-w-[200px] px-9 py-3 text-base sm:min-w-[220px]"
              >
                Start Free Trial
              </Button>
              <Button
                href="/demo"
                variant="secondary"
                className="h-12 min-w-[200px] px-9 py-3 text-base sm:min-w-[220px]"
              >
                View Live Demo
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Trust message */}
        <motion.ul
          className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-5 gap-y-3 sm:mt-12 sm:gap-x-7"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.15, ease: easeOut }}
        >
          {trustItems.map((item) => (
            <li
              key={item}
              className="inline-flex items-center gap-1.5 text-xs text-white/45 sm:text-sm"
            >
              <span className="text-gold" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
