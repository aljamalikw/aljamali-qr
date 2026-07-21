import { Button } from "./Button";

const heroBenefits = [
  "No credit card required",
  "Setup in under 5 minutes",
  "Cancel anytime",
];

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden"
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
      <div className="hero-overlay absolute inset-0" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-32 text-center lg:px-8">
        <div className="animate-fade-in-up opacity-0">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-xs font-medium uppercase tracking-widest text-gold">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-gold" />
            Digital Menus for Modern Restaurants
          </span>
        </div>

        <h1
          id="hero-heading"
          className="animate-fade-in-up animation-delay-100 opacity-0 font-serif text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl"
        >
          Replace Printed Menus with{" "}
          <span className="gold-gradient-text">Beautiful QR Menus</span>
        </h1>

        <p className="animate-fade-in-up animation-delay-200 opacity-0 mx-auto mt-6 max-w-2xl text-lg text-white/70 sm:text-xl">
          Aljamali QR helps restaurants deliver a premium dining experience
          with instant digital menus in English and Arabic — elegant, fast, and
          always up to date.
        </p>

        <div className="animate-fade-in-up animation-delay-300 opacity-0 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/register" className="min-w-[200px] px-8 py-3.5 text-base">
            Start Free Trial
          </Button>
          <Button
            href="/demo"
            variant="secondary"
            className="min-w-[180px] px-8 py-3.5 text-base"
          >
            View Live Demo
          </Button>
        </div>

        <ul className="animate-fade-in-up animation-delay-350 opacity-0 mt-6 flex flex-col items-center gap-2 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-x-6 sm:gap-y-2">
          {heroBenefits.map((benefit) => (
            <li key={benefit} className="flex items-center gap-2 text-sm text-white/50">
              <span className="text-gold" aria-hidden="true">
                ✓
              </span>
              {benefit}
            </li>
          ))}
        </ul>

        <div className="animate-fade-in-up animation-delay-400 opacity-0 mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-white/40">
          <span>Trusted by 500+ restaurants</span>
          <span className="hidden h-4 w-px bg-white/20 sm:block" />
          <span>Bilingual EN / AR</span>
          <span className="hidden h-4 w-px bg-white/20 sm:block" />
          <span>Setup in under 10 minutes</span>
        </div>
      </div>

      <a
        href="#features"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float cursor-pointer text-gold/60 transition-colors duration-200 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        aria-label="Scroll to features"
      >
        <svg
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </a>
    </section>
  );
}
