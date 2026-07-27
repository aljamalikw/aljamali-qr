import { whyUsReasons } from "@/lib/landing-data";
import { Icon } from "./Icons";
import { SectionHeader } from "./SectionHeader";

export function WhyUs() {
  return (
    <section
      id="why-us"
      className="relative bg-background py-24 lg:py-32"
      aria-labelledby="why-us-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="Why Us"
          title="Why Restaurants Choose Aljamali QR"
          description="Built for premium hospitality — elegant presentation, operational speed, and guest-ready digital menus."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyUsReasons.map((reason, index) => (
            <article
              key={reason.title}
              className="card-premium group rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/35 hover:shadow-2xl hover:shadow-gold/10"
              style={{ animationDelay: `${index * 60}ms` }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/15 bg-gold/10 text-gold transition-all duration-300 group-hover:scale-105 group-hover:border-gold/30 group-hover:bg-gold/20">
                <Icon
                  name={reason.icon as Parameters<typeof Icon>[0]["name"]}
                  className="h-5 w-5"
                />
              </div>
              <h3
                id={index === 0 ? "why-us-heading" : undefined}
                className="mb-2 font-serif text-lg font-semibold text-white transition-colors group-hover:text-gold"
              >
                {reason.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/60">
                {reason.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
