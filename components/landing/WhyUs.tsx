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
          description="Built for premium hospitality — fast to run, elegant for guests, and ready for growth."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {whyUsReasons.map((reason, index) => (
            <article
              key={reason.title}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/35"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold">
                <Icon
                  name={reason.icon as Parameters<typeof Icon>[0]["name"]}
                  className="h-5 w-5"
                />
              </div>
              <h3
                id={index === 0 ? "why-us-heading" : undefined}
                className="mb-2 font-serif text-lg font-semibold text-white group-hover:text-gold"
              >
                {reason.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/55">
                {reason.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
