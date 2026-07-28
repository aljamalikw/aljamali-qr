import { Button } from "./Button";

const features = [
  "Bilingual English & Arabic",
  "Instant Menu Updates",
  "QR Ordering & Reservations",
  "Built-in Analytics Dashboard",
] as const;

const trustItems = [
  { icon: "⚡", label: "Setup in under 10 minutes" },
  { icon: "🌍", label: "English & Arabic" },
  { icon: "📱", label: "Mobile Optimized" },
  { icon: "📊", label: "Built-in Analytics" },
] as const;

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80')",
        }}
        role="img"
        aria-label="Elegant restaurant interior with warm ambient lighting"
      />

      {/* Strong dark + luxury black overlays for readability */}
      <div className="hero-overlay absolute inset-0" />
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/50 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.06)_0%,transparent_55%)]" />

      {/* Gold glow accents */}
      <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 py-32 text-center sm:py-36 lg:px-8 lg:py-40">
        {/* Brand label */}
        <p className="animate-fade-in-up opacity-0 inline-flex items-center gap-2 rounded-full border border-gold/25 bg-black/40 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.22em] text-gold/90 backdrop-blur-md sm:text-sm">
          Aljamali <span className="text-gold">QR</span>
        </p>

        {/* Headline */}
        <h1
          id="hero-heading"
          className="animate-fade-in-up animation-delay-100 opacity-0 mx-auto mt-8 max-w-4xl font-serif text-4xl font-bold leading-[1.12] tracking-tight text-white sm:mt-10 sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Transform Your Restaurant with{" "}
          <span className="gold-gradient-text">Smart Digital QR Menus</span>
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up animation-delay-200 opacity-0 mx-auto mt-6 max-w-[700px] text-base leading-relaxed text-white/75 sm:mt-8 sm:text-lg">
          Replace printed menus with a premium digital experience. Manage your
          menu, QR ordering, reservations and analytics from one powerful
          platform.
        </p>

        {/* Feature cards */}
        <ul className="animate-fade-in-up animation-delay-300 opacity-0 mx-auto mt-12 grid max-w-3xl grid-cols-1 gap-3 sm:mt-14 sm:grid-cols-2 sm:gap-4">
          {features.map((feature) => (
            <li
              key={feature}
              className="group flex items-center gap-3 rounded-2xl border border-gold/25 bg-white/[0.04] px-5 py-4 text-left shadow-[0_8px_32px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-gold/50 hover:bg-white/[0.07] hover:shadow-[0_12px_40px_rgba(212,175,55,0.12)]"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/30 bg-gold/10 text-sm text-gold transition-colors duration-300 group-hover:border-gold/50 group-hover:bg-gold/20"
                aria-hidden="true"
              >
                ✓
              </span>
              <span className="text-sm font-medium text-white/90 sm:text-[15px]">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* CTAs */}
        <div className="animate-fade-in-up animation-delay-350 opacity-0 mt-12 flex flex-col items-center justify-center gap-4 sm:mt-14 sm:flex-row sm:gap-5">
          <Button
            href="/register"
            className="min-w-[220px] px-10 py-4 text-base sm:min-w-[240px] sm:text-lg"
          >
            Start Free Trial
          </Button>
          <Button
            href="/demo"
            variant="secondary"
            className="min-w-[220px] px-10 py-4 text-base sm:min-w-[240px] sm:text-lg"
          >
            View Live Demo
          </Button>
        </div>

        {/* Trust bar */}
        <div className="animate-fade-in-up animation-delay-400 opacity-0 mx-auto mt-12 flex max-w-3xl flex-wrap items-center justify-center gap-x-6 gap-y-3 sm:mt-14 sm:gap-x-8">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-2 text-xs text-white/55 sm:text-sm"
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
