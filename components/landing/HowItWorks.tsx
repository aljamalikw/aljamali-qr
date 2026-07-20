import { steps } from "@/lib/landing-data";
import { SectionHeader } from "./SectionHeader";

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative bg-surface py-24 lg:py-32"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="How It Works"
          title="Go Digital in Three Simple Steps"
          description="From setup to your first scan — we make the transition effortless."
        />

        <div className="relative grid gap-8 lg:grid-cols-3 lg:gap-12">
          <div
            className="absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent lg:block"
            aria-hidden="true"
          />

          {steps.map((item, index) => (
            <article
              key={item.step}
              className="relative text-center lg:text-left"
            >
              <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/30 bg-background font-serif text-2xl font-bold text-gold lg:mx-0">
                {item.step}
              </div>
              <h3
                id={index === 0 ? "how-it-works-heading" : undefined}
                className="mb-3 font-serif text-2xl font-semibold text-white"
              >
                {item.title}
              </h3>
              <p className="text-white/60 leading-relaxed">{item.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
