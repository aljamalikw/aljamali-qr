import { testimonials } from "@/lib/landing-data";
import { Icon } from "./Icons";
import { SectionHeader } from "./SectionHeader";

export function Testimonials() {
  return (
    <section
      id="testimonials"
      className="relative bg-surface py-24 lg:py-32"
      aria-labelledby="testimonials-heading"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="Testimonials"
          title="Loved by Restaurant Owners"
          description="See why hospitality leaders choose Aljamali QR to elevate their guest experience."
        />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((item, index) => (
            <blockquote
              key={item.author}
              className="card-premium flex flex-col rounded-2xl p-8"
            >
              <div className="mb-4 flex gap-1">
                {Array.from({ length: item.rating }).map((_, i) => (
                  <Icon key={i} name="star" className="h-4 w-4 text-gold" />
                ))}
              </div>
              <p
                id={index === 0 ? "testimonials-heading" : undefined}
                className="flex-1 text-white/80 leading-relaxed"
              >
                &ldquo;{item.quote}&rdquo;
              </p>
              <footer className="mt-6 border-t border-white/10 pt-6">
                <cite className="not-italic">
                  <span className="block font-semibold text-white">
                    {item.author}
                  </span>
                  <span className="text-sm text-white/50">{item.role}</span>
                </cite>
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}
