import { Button } from "./Button";

const heroPoints = [
  "Remove printed menus forever.",
  "Update your menu instantly.",
  "Track customer scans.",
  "Increase restaurant efficiency.",
];

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
      <div className="hero-overlay absolute inset-0" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-background/90" />

      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
        <div className="absolute -right-32 bottom-1/4 h-96 w-96 rounded-full bg-gold/5 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-6 py-28 text-center lg:px-8 lg:py-32">
        <p className="animate-fade-in-up opacity-0 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          Aljamali <span className="text-gold">QR</span>
        </p>

        <h1
          id="hero-heading"
          className="animate-fade-in-up animation-delay-100 opacity-0 mx-auto mt-5 max-w-4xl font-serif text-4xl font-bold leading-[1.15] tracking-tight text-white sm:text-5xl lg:text-6xl"
        >
          Premium Digital Menu Solution for{" "}
          <span className="gold-gradient-text">Modern Restaurants</span>
        </h1>

        <ul className="animate-fade-in-up animation-delay-200 opacity-0 mx-auto mt-8 flex max-w-2xl flex-col gap-2 text-base text-white/70 sm:text-lg">
          {heroPoints.map((point) => (
            <li key={point} className="flex items-center justify-center gap-2">
              <span className="text-gold" aria-hidden="true">
                ✓
              </span>
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <div className="animate-fade-in-up animation-delay-300 opacity-0 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap">
          <Button
            href="/schedule-demo"
            className="min-w-[220px] px-8 py-3.5 text-base"
          >
            Schedule Free Demo
          </Button>
          <Button
            href="/demo"
            variant="secondary"
            className="min-w-[200px] px-8 py-3.5 text-base"
          >
            View Demo Menu
          </Button>
          <Button
            href="/register"
            variant="outline"
            className="min-w-[200px] border-gold/35 px-8 py-3.5 text-base hover:border-gold hover:bg-gold/10"
          >
            Start Free Trial
          </Button>
        </div>
      </div>
    </section>
  );
}
