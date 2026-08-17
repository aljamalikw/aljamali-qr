import { multiRestaurantPoints } from "@/lib/landing-data";
import { SectionHeader } from "./SectionHeader";

const demoSwitcher = [
  { name: "Main Location", active: true },
  { name: "Second Branch", active: false },
  { name: "Third Branch", active: false },
] as const;

export function MultiRestaurant() {
  return (
    <section
      id="multi-restaurant"
      className="relative bg-surface py-24 lg:py-32"
      aria-labelledby="multi-heading"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <SectionHeader
              label="Multi-Restaurant"
              title="One Account. Multiple Restaurants."
              description="Manage every location from one owner account — with clear separation where it matters."
              centered={false}
            />

            <ul className="mt-2 space-y-3">
              {multiRestaurantPoints.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm text-white/70"
                >
                  <span
                    className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-[10px] text-gold"
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-3xl border border-gold/20 bg-[#0c0b09] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.4)] sm:p-8"
            aria-labelledby="multi-heading"
          >
            <p id="multi-heading" className="text-xs uppercase tracking-[0.16em] text-gold/80">
              Restaurant switcher
            </p>
            <p className="mt-2 font-serif text-2xl font-semibold text-white">
              Switch locations instantly
            </p>
            <p className="mt-2 text-sm text-white/45">
              Illustrative concept — each restaurant keeps its own menu,
              customers, and analytics.
            </p>

            <ul className="mt-6 space-y-3">
              {demoSwitcher.map((restaurant) => (
                <li
                  key={restaurant.name}
                  className={`rounded-2xl border px-4 py-3 transition ${
                    restaurant.active
                      ? "border-gold/40 bg-gold/10"
                      : "border-white/10 bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span
                      className={`text-sm font-medium ${
                        restaurant.active ? "text-white" : "text-white/65"
                      }`}
                    >
                      {restaurant.name}
                    </span>
                    {restaurant.active ? (
                      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gold">
                        Active
                      </span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
