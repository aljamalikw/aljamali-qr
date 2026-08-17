import { trustStatements } from "@/lib/landing-data";
import { SectionHeader } from "./SectionHeader";

export function Testimonials() {
  return (
    <section
      id="trust"
      className="relative bg-surface py-24 lg:py-32"
      aria-labelledby="trust-heading"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="Trust"
          title="Built for Restaurant Teams"
          description="A platform shaped around hospitality — not generic software noise."
        />

        <div className="grid gap-6 md:grid-cols-3">
          {trustStatements.map((item, index) => (
            <article
              key={item.title}
              className="rounded-2xl border border-gold/15 bg-black/25 p-8 text-center"
            >
              <h3
                id={index === 0 ? "trust-heading" : undefined}
                className="font-serif text-xl font-semibold text-white"
              >
                {item.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-white/55">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
