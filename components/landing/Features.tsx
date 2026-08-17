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
          label="Why Choose Aljamali QR"
          title="Everything You Need to Grow"
          description="A complete restaurant platform — from the first scan to returning guests."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {features.map((feature, index) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-gold/35 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_rgba(0,0,0,0.35)] xl:col-span-1"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold transition duration-300 group-hover:border-gold/40 group-hover:bg-gold/15">
                <Icon
                  name={feature.icon as Parameters<typeof Icon>[0]["name"]}
                  className="h-5 w-5"
                />
              </div>
              <h3
                id={index === 0 ? "features-heading" : undefined}
                className="mb-2 font-serif text-lg font-semibold text-white transition-colors group-hover:text-gold"
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
