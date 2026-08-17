import { heroChecklist } from "@/lib/landing-data";
import { Button } from "./Button";
import { HeroDashboardPreview } from "./HeroDashboardPreview";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-24 sm:pt-28"
      aria-labelledby="hero-heading"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80')",
        }}
        role="img"
        aria-label="Elegant restaurant dining room with warm ambient lighting"
      />
      <div className="hero-overlay absolute inset-0" />
      <div className="absolute inset-0 bg-black/70" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-background" />
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gold/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-10 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:pb-20 lg:pt-14">
        <div className="max-w-xl lg:max-w-none">
          <p className="animate-fade-in-up opacity-0 text-xs font-semibold uppercase tracking-[0.28em] text-gold">
            Aljamali QR
          </p>

          <h1
            id="hero-heading"
            className="animate-fade-in-up animation-delay-100 opacity-0 mt-5 font-serif text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.35rem] xl:text-6xl"
          >
            Transform Your Restaurant
            <br />
            with{" "}
            <span className="gold-gradient-text">Smart Digital QR Menus</span>
          </h1>

          <p className="animate-fade-in-up animation-delay-200 opacity-0 mt-6 max-w-lg text-base leading-relaxed text-white/70 sm:text-lg">
            Replace printed menus with a complete digital platform for QR menus,
            ordering, reservations, and analytics.
          </p>

          <ul className="animate-fade-in-up animation-delay-200 opacity-0 mt-7 space-y-3">
            {heroChecklist.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-white/85 sm:text-[15px]">
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gold/40 bg-gold/15 text-[11px] text-gold"
                  aria-hidden="true"
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <div className="animate-fade-in-up animation-delay-300 opacity-0 mt-9 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button href="/register" className="px-8 py-3.5 text-base">
              Start Free Trial →
            </Button>
            <Button href="/demo" variant="secondary" className="px-8 py-3.5 text-base">
              Watch Demo
            </Button>
          </div>
        </div>

        <div className="animate-fade-in-up animation-delay-300 opacity-0">
          <HeroDashboardPreview />
        </div>
      </div>
    </section>
  );
}
