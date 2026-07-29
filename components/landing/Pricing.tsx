"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  pricingComparisonRows,
  pricingPlans,
  pricingTrustCards,
  type PricingComparisonValue,
  type PricingFeature,
} from "@/lib/landing-data";
import { Button } from "./Button";
import { Icon } from "./Icons";

type BillingCycle = "monthly" | "yearly";

const easeOut = [0.22, 1, 0.36, 1] as const;

const freePlan = pricingPlans.find((plan) => plan.id === "free");
const mainPlans = pricingPlans.filter((plan) => plan.id !== "free");

const assuranceItems = [
  "No setup fee",
  "Cancel anytime",
  "Secure payments",
  "Cloud hosted",
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

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}

function ComingSoonBadge() {
  return (
    <span className="inline-flex shrink-0 items-center rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-gold">
      Soon
    </span>
  );
}

function FeatureRow({ feature }: { feature: PricingFeature }) {
  return (
    <li className="flex items-start gap-2.5 text-sm text-white/70">
      <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
      <span className="flex min-w-0 flex-wrap items-center gap-2">
        <span>{feature.label}</span>
        {feature.comingSoon ? <ComingSoonBadge /> : null}
      </span>
    </li>
  );
}

function ComparisonCell({
  value,
  highlighted,
}: {
  value: PricingComparisonValue;
  highlighted?: boolean;
}) {
  if (value === true) {
    return (
      <span
        className={`inline-flex items-center justify-center ${
          highlighted ? "text-gold" : "text-gold/90"
        }`}
        aria-label="Included"
      >
        <CheckIcon className="h-5 w-5" />
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="text-white/25" aria-label="Not included">
        —
      </span>
    );
  }

  if (value === "Soon") {
    return (
      <span className="inline-flex justify-center">
        <ComingSoonBadge />
      </span>
    );
  }

  return (
    <span
      className={`text-sm ${
        highlighted ? "font-medium text-white" : "text-white/70"
      }`}
    >
      {value}
    </span>
  );
}

export function Pricing() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <>
      <section
        id="pricing"
        className="relative overflow-x-hidden bg-background py-28 lg:py-36"
        aria-labelledby="pricing-heading"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

        {/* Atmosphere */}
        <div
          className="pointer-events-none absolute inset-0 overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute left-1/2 top-24 h-[460px] w-[460px] -translate-x-1/2 rounded-full bg-gold/[0.06] blur-3xl" />
          <div className="absolute -left-24 top-1/3 h-80 w-80 rounded-full bg-gold/[0.04] blur-3xl" />
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
            className="mx-auto mb-14 max-w-[700px] text-center lg:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.6, ease: easeOut }}
          >
            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.22em] text-gold">
              Pricing
            </p>
            <h2
              id="pricing-heading"
              className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
            >
              Simple Pricing for Every Restaurant
            </h2>
            <p className="mx-auto mt-5 max-w-[700px] text-base leading-relaxed text-white/60 sm:text-lg">
              Choose the perfect plan for your restaurant. Upgrade anytime as
              your business grows.
            </p>
          </motion.div>

          {/* Yearly promo */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: easeOut }}
            className="mx-auto mb-10 w-full max-w-[700px]"
          >
            <div className="pricing-promo-banner relative overflow-hidden rounded-3xl border border-gold/45 bg-black/70 px-6 py-8 text-center shadow-[0_0_40px_rgba(212,175,55,0.28)] backdrop-blur-xl sm:px-10 sm:py-10">
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gold/20 via-transparent to-gold/10"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent"
                aria-hidden="true"
              />

              <p className="relative text-xs font-semibold uppercase tracking-[0.22em] text-gold sm:text-sm">
                ⭐ SAVE 2 MONTHS EVERY YEAR ⭐
              </p>
              <p className="relative mt-3 text-sm text-white/65 sm:text-base">
                Pay annually and get
              </p>
              <p className="gold-gradient-text relative mt-2 font-serif text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">
                2 MONTHS FREE
              </p>
              <p className="relative mt-4 text-sm text-white/50 sm:text-base">
                Choose Monthly or Yearly below.
              </p>
            </div>
          </motion.div>

          {/* Billing toggle */}
          <div className="mb-12 flex flex-col items-center gap-4 lg:mb-16">
            <div
              className="relative inline-flex rounded-full border border-gold/25 bg-black/50 p-1 backdrop-blur-md"
              role="group"
              aria-label="Billing cycle"
            >
              <span
                className={`pointer-events-none absolute inset-y-1 w-[calc(50%-4px)] rounded-full bg-gold transition-transform duration-300 ease-out ${
                  billing === "yearly"
                    ? "translate-x-[calc(100%+4px)]"
                    : "translate-x-1"
                }`}
                aria-hidden="true"
              />
              {(["monthly", "yearly"] as const).map((cycle) => {
                const active = billing === cycle;
                return (
                  <button
                    key={cycle}
                    type="button"
                    onClick={() => setBilling(cycle)}
                    aria-pressed={active}
                    className={`relative z-10 min-w-[110px] rounded-full px-5 py-2.5 text-sm font-semibold capitalize transition-colors duration-300 ${
                      active ? "text-black" : "text-white/65 hover:text-white"
                    }`}
                  >
                    {cycle}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Free plan teaser — preserves Free plan CTA */}
          {freePlan ? (
            <motion.div
              className="mx-auto mb-16 max-w-3xl lg:mb-20"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.5, ease: easeOut }}
            >
              <div className="flex flex-col items-center justify-between gap-4 rounded-3xl border border-gold/20 bg-black/40 px-6 py-5 text-center shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-xl sm:flex-row sm:text-left">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold">
                    {freePlan.badge}
                  </p>
                  <p className="mt-1 font-serif text-lg font-semibold text-white">
                    {freePlan.name} — {freePlan.subtitle}
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    {freePlan.description}
                  </p>
                </div>
                <Button
                  href={freePlan.ctaHref}
                  variant="outline"
                  className="shrink-0 border-gold/35 px-6 hover:border-gold hover:bg-gold/10"
                >
                  {freePlan.cta}
                </Button>
              </div>
            </motion.div>
          ) : null}

          {/* Main pricing cards */}
          <motion.div
            className="mx-auto grid max-w-6xl grid-cols-1 items-stretch gap-6 pt-8 lg:grid-cols-3 lg:gap-7"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            {mainPlans.map((plan) => {
              const isYearly = billing === "yearly";
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const suffix = isYearly ? plan.yearlySuffix : plan.monthlySuffix;
              const isNumeric = /^\d+$/.test(price);
              const highlighted = plan.highlighted;

              return (
                <motion.article
                  key={plan.id}
                  variants={cardVariants}
                  className={`group relative flex h-full flex-col overflow-visible rounded-3xl border backdrop-blur-xl transition-all duration-500 ease-out hover:-translate-y-2 ${
                    highlighted
                      ? "z-10 border-gold/50 bg-gradient-to-b from-gold/[0.12] via-black/70 to-black/80 p-8 shadow-[0_28px_80px_rgba(212,175,55,0.18)] ring-1 ring-gold/30 hover:border-gold/70 hover:shadow-[0_36px_90px_rgba(212,175,55,0.28)] sm:p-9 lg:p-10"
                      : "border-gold/20 bg-black/45 p-7 shadow-[0_12px_48px_rgba(0,0,0,0.4)] hover:border-gold/45 hover:bg-black/55 hover:shadow-[0_24px_60px_rgba(212,175,55,0.12)] sm:p-8"
                  }`}
                >
                  {plan.badge ? (
                    <span
                      className={`absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${
                        highlighted
                          ? "bg-gold text-black shadow-lg shadow-gold/30"
                          : "border border-gold/40 bg-black/90 text-gold backdrop-blur-md"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  ) : null}

                  {plan.showYearlySavings && isYearly && !highlighted ? (
                    <span className="absolute right-4 top-4 rounded-full border border-gold/40 bg-black/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold shadow-lg shadow-gold/10">
                      2 Months Free
                    </span>
                  ) : null}

                  <div
                    className={`pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                      highlighted ? "opacity-100" : ""
                    }`}
                    aria-hidden="true"
                    style={{
                      background:
                        "radial-gradient(500px circle at 50% 0%, rgba(212,175,55,0.12), transparent 45%)",
                    }}
                  />

                  <div className="relative z-10 flex h-full flex-col">
                    <h3 className="font-serif text-2xl font-bold text-white sm:text-[1.7rem]">
                      {plan.name}
                    </h3>
                    <p className="mt-2 text-sm font-semibold text-gold/90">
                      {plan.subtitle}
                    </p>
                    <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-white/55">
                      {plan.description}
                    </p>

                    <div className={`mt-7 min-h-[80px] ${highlighted ? "mt-8" : ""}`}>
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={`${plan.id}-${billing}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -8 }}
                          transition={{ duration: 0.22 }}
                          className="flex flex-wrap items-baseline gap-2"
                        >
                          <span
                            className={`font-serif font-bold text-gold ${
                              isNumeric
                                ? highlighted
                                  ? "text-6xl"
                                  : "text-5xl"
                                : "text-3xl sm:text-4xl"
                            }`}
                          >
                            {price}
                          </span>
                          {suffix ? (
                            <span className="text-sm text-white/50">
                              {suffix}
                            </span>
                          ) : null}
                          {plan.showYearlySavings &&
                          isYearly &&
                          highlighted ? (
                            <span className="ml-1 rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                              2 Months Free
                            </span>
                          ) : null}
                        </motion.div>
                      </AnimatePresence>
                      <p className="mt-2 text-xs text-white/40">
                        {isNumeric
                          ? isYearly
                            ? "Billed annually · cancel anytime"
                            : "Billed monthly · upgrade anytime"
                          : "Custom pricing tailored to your brand"}
                      </p>
                    </div>

                    {plan.featuresIntro ? (
                      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-gold/85">
                        {plan.featuresIntro}
                      </p>
                    ) : (
                      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
                        Includes
                      </p>
                    )}

                    <ul className="mt-3 space-y-2.5">
                      {plan.features.map((feature) => (
                        <FeatureRow
                          key={`${plan.id}-${feature.label}`}
                          feature={feature}
                        />
                      ))}
                    </ul>

                    {plan.premiumFeaturesTitle && plan.premiumFeatures ? (
                      <div className="mt-5 rounded-2xl border border-gold/25 bg-gradient-to-b from-gold/10 to-transparent p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">
                          {plan.premiumFeaturesTitle}
                        </p>
                        <ul className="mt-3 space-y-2.5">
                          {plan.premiumFeatures.map((feature) => (
                            <FeatureRow
                              key={`${plan.id}-premium-${feature.label}`}
                              feature={feature}
                            />
                          ))}
                        </ul>
                      </div>
                    ) : null}

                    <div className="mt-auto pt-8">
                      <Button
                        href={plan.ctaHref}
                        variant={highlighted ? "primary" : "secondary"}
                        className={`w-full ${
                          highlighted ? "py-3.5 text-base shadow-lg shadow-gold/30" : "py-3.5"
                        }`}
                      >
                        {plan.cta}
                      </Button>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>

          {/* Assurance strip */}
          <motion.ul
            className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-3 sm:gap-4 lg:mt-14"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, ease: easeOut }}
          >
            {assuranceItems.map((item) => (
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

          {/* Custom / Contact Sales panel */}
          <motion.div
            className="mx-auto mt-14 max-w-3xl lg:mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.55, ease: easeOut }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-gold/20 bg-black/45 px-8 py-10 text-center shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:px-12 sm:py-12">
              <div
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]"
                aria-hidden="true"
              />
              <p className="relative text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Need something custom?
              </p>
              <h3 className="relative mt-3 font-serif text-2xl font-bold text-white sm:text-3xl">
                Multiple branches? Custom integrations? White-label solutions?
              </h3>
              <p className="relative mx-auto mt-3 max-w-lg text-sm text-white/55 sm:text-base">
                Contact our team.
              </p>
              <div className="relative mt-7">
                <Button href="#contact" className="min-w-[180px] px-8 py-3.5">
                  Contact Sales
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Compare plans table — existing functionality */}
          <div className="mt-20 lg:mt-24">
            <div className="mb-10 text-center">
              <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl">
                Compare Plans
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-white/55 sm:text-base">
                Starter covers single-location essentials. Professional unlocks
                multi-branch scale, unlimited menus &amp; QR codes, and upcoming
                ordering tools.
              </p>
            </div>

            <div className="overflow-hidden rounded-3xl border border-gold/20 bg-black/40 shadow-[0_12px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gold/15 bg-black/50">
                      <th
                        scope="col"
                        className="px-5 py-4 text-xs font-semibold uppercase tracking-[0.16em] text-white/45"
                      >
                        Feature
                      </th>
                      {pricingPlans.map((plan) => (
                        <th
                          key={plan.id}
                          scope="col"
                          className={`px-4 py-4 text-center text-sm font-semibold ${
                            plan.highlighted
                              ? "bg-gold/10 text-gold"
                              : "text-white/80"
                          }`}
                        >
                          <span className="block font-serif text-base">
                            {plan.name}
                          </span>
                          {plan.highlighted ? (
                            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-wider text-gold/80">
                              Most Popular
                            </span>
                          ) : null}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pricingComparisonRows.map((row, rowIndex) => (
                      <tr
                        key={row.feature}
                        className={`border-b border-white/5 last:border-0 ${
                          rowIndex % 2 === 0
                            ? "bg-transparent"
                            : "bg-white/[0.02]"
                        }`}
                      >
                        <th
                          scope="row"
                          className="px-5 py-3.5 text-sm font-medium text-white/80"
                        >
                          {row.feature}
                        </th>
                        <td className="px-4 py-3.5 text-center">
                          <ComparisonCell value={row.free} />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <ComparisonCell value={row.starter} />
                        </td>
                        <td className="bg-gold/[0.06] px-4 py-3.5 text-center">
                          <ComparisonCell
                            value={row.professional}
                            highlighted
                          />
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <ComparisonCell value={row.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="pricing-trust"
        className="relative overflow-hidden border-t border-gold/10 bg-surface py-20 lg:py-28"
        aria-labelledby="pricing-trust-heading"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <div className="absolute left-1/3 top-10 h-64 w-64 rounded-full bg-gold/[0.04] blur-3xl" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            className="mb-14 text-center"
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: easeOut }}
          >
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Trust
            </span>
            <h2
              id="pricing-trust-heading"
              className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Why Restaurants Choose Aljamali QR
            </h2>
          </motion.div>

          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
          >
            {pricingTrustCards.map((card) => (
              <motion.article
                key={card.title}
                variants={cardVariants}
                className="group rounded-3xl border border-gold/20 bg-black/40 p-7 shadow-[0_10px_40px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-gold/45 hover:shadow-[0_20px_50px_rgba(212,175,55,0.12)]"
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#e8c547] via-gold to-[#b8942e] text-black shadow-[0_6px_20px_rgba(212,175,55,0.3)] transition-transform duration-500 group-hover:rotate-6 group-hover:scale-105">
                  <Icon
                    name={card.icon as Parameters<typeof Icon>[0]["name"]}
                    className="h-5 w-5"
                  />
                </div>
                <h3 className="mb-2 font-serif text-lg font-semibold text-white transition-colors group-hover:text-gold">
                  {card.title}
                </h3>
                <p className="text-sm leading-relaxed text-white/60">
                  {card.description}
                </p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>
    </>
  );
}
