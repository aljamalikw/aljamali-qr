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
import { SectionHeader } from "./SectionHeader";

type BillingCycle = "monthly" | "yearly";

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
        className="relative bg-background py-24 lg:py-32"
        aria-labelledby="pricing-heading"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <SectionHeader
            label="Pricing"
            title="Plans That Scale With You"
            description="Start free or go enterprise — every plan includes bilingual menus and instant updates."
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mb-10 w-full max-w-[700px]"
          >
            <div className="pricing-promo-banner relative overflow-hidden rounded-2xl border border-gold/45 bg-black px-6 py-8 text-center shadow-[0_0_40px_rgba(212,175,55,0.28)] sm:px-10 sm:py-10">
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

          <div className="mb-12 flex flex-col items-center gap-4">
            <div
              className="relative inline-flex rounded-full border border-gold/25 bg-black/40 p-1"
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

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4 xl:items-stretch">
            {pricingPlans.map((plan, index) => {
              const isYearly = billing === "yearly";
              const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
              const suffix = isYearly ? plan.yearlySuffix : plan.monthlySuffix;
              const isNumeric = /^\d+$/.test(price);

              return (
                <article
                  key={plan.id}
                  className={`card-premium relative flex h-full flex-col rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 ${
                    plan.highlighted
                      ? "border-gold/45 shadow-xl shadow-gold/15 ring-1 ring-gold/25 xl:scale-[1.03]"
                      : ""
                  }`}
                >
                  {plan.badge ? (
                    <span
                      className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-[10px] font-semibold uppercase tracking-wider sm:text-xs ${
                        plan.highlighted
                          ? "bg-gold text-black shadow-lg shadow-gold/25"
                          : "border border-gold/40 bg-black text-gold"
                      }`}
                    >
                      {plan.badge}
                    </span>
                  ) : null}

                  {plan.showYearlySavings && isYearly && !plan.highlighted ? (
                    <span className="absolute -top-3 right-3 rounded-full border border-gold/40 bg-black px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-gold shadow-lg shadow-gold/10">
                      2 Months Free
                    </span>
                  ) : null}

                  <h3
                    id={index === 0 ? "pricing-heading" : undefined}
                    className="font-serif text-2xl font-bold text-white"
                  >
                    {plan.name}
                  </h3>
                  <p className="mt-2 text-sm font-semibold text-gold/90">
                    {plan.subtitle}
                  </p>
                  <p className="mt-1.5 min-h-[40px] text-sm leading-relaxed text-white/55">
                    {plan.description}
                  </p>

                  <div className="mt-6 min-h-[72px]">
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
                            isNumeric ? "text-5xl" : "text-3xl sm:text-4xl"
                          }`}
                        >
                          {price}
                        </span>
                        {suffix ? (
                          <span className="text-sm text-white/50">{suffix}</span>
                        ) : null}
                        {plan.showYearlySavings &&
                        isYearly &&
                        plan.highlighted ? (
                          <span className="ml-1 rounded-full border border-gold/35 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold">
                            2 Months Free
                          </span>
                        ) : null}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {plan.featuresIntro ? (
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-gold/85">
                      {plan.featuresIntro}
                    </p>
                  ) : (
                    <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-white/35">
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
                    <div className="mt-5 rounded-xl border border-gold/25 bg-gradient-to-b from-gold/10 to-transparent p-4">
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
                      variant={plan.highlighted ? "primary" : "secondary"}
                      className="w-full"
                    >
                      {plan.cta}
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="mt-16">
            <div className="mb-8 text-center">
              <h3 className="font-serif text-2xl font-bold text-white sm:text-3xl">
                Compare Plans
              </h3>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-white/55 sm:text-base">
                Starter covers single-location essentials. Professional unlocks
                multi-branch scale, unlimited menus &amp; QR codes, and upcoming
                ordering tools.
              </p>
            </div>

            <div className="card-premium overflow-hidden rounded-2xl border border-gold/15">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gold/15 bg-black/40">
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
        className="relative border-t border-gold/10 bg-surface py-20 lg:py-24"
        aria-labelledby="pricing-trust-heading"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mb-12 text-center">
            <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              Trust
            </span>
            <h2
              id="pricing-trust-heading"
              className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl"
            >
              Why Restaurants Choose Aljamali QR
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {pricingTrustCards.map((card, index) => (
              <article
                key={card.title}
                className="card-premium group rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/35 hover:shadow-2xl hover:shadow-gold/10"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/15 bg-gold/10 text-gold transition-all duration-300 group-hover:scale-105 group-hover:border-gold/30 group-hover:bg-gold/20">
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
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
