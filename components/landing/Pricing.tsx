import { pricingPlans } from "@/lib/landing-data";
import { Button } from "./Button";
import { SectionHeader } from "./SectionHeader";

export function Pricing() {
  return (
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
          description="Start small or go enterprise — every plan includes bilingual menus and instant updates."
        />

        <div className="grid gap-8 lg:grid-cols-3 lg:items-center">
          {pricingPlans.map((plan, index) => (
            <article
              key={plan.name}
              className={`card-premium relative rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 ${
                plan.highlighted
                  ? "border-gold/40 shadow-xl shadow-gold/10 lg:scale-105"
                  : ""
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gold px-4 py-1 text-xs font-semibold uppercase tracking-wider text-black">
                  Most Popular
                </span>
              )}

              <h3
                id={index === 0 ? "pricing-heading" : undefined}
                className="font-serif text-2xl font-bold text-white"
              >
                {plan.name}
              </h3>
              <p className="mt-2 text-sm text-white/60">{plan.description}</p>

              <div className="mt-6 flex items-baseline gap-1">
                {plan.price !== "Custom" && (
                  <span className="text-sm text-white/50">$</span>
                )}
                <span className="font-serif text-5xl font-bold text-gold">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-white/50">/{plan.period}</span>
                )}
              </div>

              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm text-white/70"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 shrink-0 text-gold"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                href={plan.name === "Enterprise" ? "#contact" : "#contact"}
                variant={plan.highlighted ? "primary" : "secondary"}
                className="mt-8 w-full"
              >
                {plan.cta}
              </Button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
