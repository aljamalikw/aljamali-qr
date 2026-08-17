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
          description="A complete platform for menus, guests, loyalty, and growth — built for hospitality."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-7 transition-all duration-300 hover:-translate-y-1 hover:border-gold/35 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)]"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold transition duration-300 group-hover:border-gold/40 group-hover:bg-gold/15">
                <Icon
                  name={feature.icon as Parameters<typeof Icon>[0]["name"]}
                  className="h-5 w-5"
                />
              </div>
              <h3
                id={index === 0 ? "features-heading" : undefined}
                className="mb-2 font-serif text-xl font-semibold text-white transition-colors group-hover:text-gold"
              >
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-white/55">
                {feature.description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
