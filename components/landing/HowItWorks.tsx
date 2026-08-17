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
          title="Start in Minutes"
          description="Go from signup to your first guest scan without slowing service."
        />

        <div className="relative grid gap-10 lg:grid-cols-3 lg:gap-8">
          <div
            className="absolute left-[8%] right-[8%] top-10 hidden h-px bg-gradient-to-r from-transparent via-gold/35 to-transparent lg:block"
            aria-hidden="true"
          />

          {steps.map((item, index) => (
            <article key={item.step} className="relative text-center lg:px-4">
              <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/35 bg-background font-serif text-2xl font-bold text-gold shadow-[0_0_30px_rgba(212,175,55,0.12)]">
                {item.step}
              </div>
              <h3
                id={index === 0 ? "how-it-works-heading" : undefined}
                className="mb-3 font-serif text-2xl font-semibold text-white"
              >
                {item.title}
              </h3>
              <p className="mx-auto max-w-sm text-white/55 leading-relaxed">
                {item.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
