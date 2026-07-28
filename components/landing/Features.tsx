import { features } from "@/lib/landing-data";
import { Icon } from "./Icons";
import { SectionHeader } from "./SectionHeader";

export function Features() {
  return (
    <section
      id="features"
      className="relative bg-background py-24 lg:py-32"
      aria-labelledby="features-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="Features"
          title="Everything Your Restaurant Needs"
          description="Powerful tools designed for hospitality — from single cafés to multi-branch restaurant groups."
        />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="card-premium group rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold/35 hover:shadow-2xl hover:shadow-gold/10"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/15 bg-gold/10 text-gold transition-all duration-300 group-hover:scale-105 group-hover:border-gold/30 group-hover:bg-gold/20">
                <Icon
                  name={feature.icon as Parameters<typeof Icon>[0]["name"]}
                  className="h-6 w-6"
                />
              </div>
              <h3
                id={index === 0 ? "features-heading" : undefined}
                className="mb-3 font-serif text-xl font-semibold text-white transition-colors group-hover:text-gold"
              >
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/60">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
