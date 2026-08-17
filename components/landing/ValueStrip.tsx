import { heroValueProps } from "@/lib/landing-data";
import { Icon } from "./Icons";

export function ValueStrip() {
  return (
    <section
      aria-label="Key value propositions"
      className="relative border-y border-gold/10 bg-surface py-10 sm:py-12"
    >
      <div className="mx-auto grid max-w-7xl gap-4 px-6 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {heroValueProps.map((item) => (
          <div
            key={item.title}
            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/25 px-4 py-4 transition duration-300 hover:border-gold/30"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
              <Icon name={item.icon} className="h-5 w-5" />
            </span>
            <p className="text-sm font-medium leading-snug text-white/90">
              {item.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
