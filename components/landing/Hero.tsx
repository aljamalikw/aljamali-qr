import { Button } from "./Button";

export function Hero() {
  return (
    <section
      id="hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden"
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
      <div className="absolute inset-0 bg-black/60" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-background" />
      <div
        className="absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
        <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-gold/8 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-24 pt-32 text-center sm:pb-28 sm:pt-36 lg:px-8 lg:pb-32 lg:pt-40">
        <p className="animate-fade-in-up opacity-0 text-xs font-semibold uppercase tracking-[0.28em] text-gold sm:text-sm">
          Aljamali QR
        </p>

        <h1
          id="hero-heading"
          className="animate-fade-in-up animation-delay-100 opacity-0 mx-auto mt-6 max-w-4xl font-serif text-4xl font-bold leading-[1.1] tracking-tight text-white sm:mt-8 sm:text-5xl md:text-6xl lg:text-7xl"
        >
          Transform Your Restaurant
          <br className="hidden sm:block" />{" "}
          with{" "}
          <span className="gold-gradient-text">Smart Digital QR Menus</span>
        </h1>

        <p className="animate-fade-in-up animation-delay-200 opacity-0 mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/75 sm:mt-8 sm:text-lg">
          Replace printed menus with a premium digital experience. Manage your
          menu, QR ordering, reservations and analytics from one powerful
          platform.
        </p>

        <div className="animate-fade-in-up animation-delay-300 opacity-0 mt-10 flex flex-col items-center justify-center gap-4 sm:mt-12 sm:flex-row sm:gap-5">
          <Button
            href="/register"
            className="min-w-[200px] px-10 py-4 text-base sm:text-lg"
          >
            Get Started
          </Button>
          <Button
            href="/demo"
            variant="secondary"
            className="min-w-[200px] px-10 py-4 text-base sm:text-lg"
          >
            View Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
