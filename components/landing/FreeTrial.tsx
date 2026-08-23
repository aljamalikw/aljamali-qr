import { Button } from "./Button";

const trialIncludes = [
  "Professional features included",
  "Create QR codes & digital menus",
  "English & Arabic menu support",
  "No credit card required to start",
];

export function FreeTrial() {
  return (
    <section
      id="free-trial"
      className="relative border-y border-gold/10 bg-surface py-16 lg:py-20"
      aria-labelledby="free-trial-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

      <div className="mx-auto max-w-5xl px-6 text-center lg:px-8">
        <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-[0.2em] text-gold">
          Free Trial
        </span>
        <h2
          id="free-trial-heading"
          className="font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl"
        >
          Start Your Free Trial Today
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base text-white/60 sm:text-lg">
          Explore Aljamali QR with a 7-day Professional trial built for real
          restaurant workflows. Build your menu, generate QR codes, and try
          Professional features before you choose a paid plan.
        </p>

        <ul className="mx-auto mt-8 grid max-w-3xl gap-3 sm:grid-cols-2">
          {trialIncludes.map((item) => (
            <li
              key={item}
              className="flex items-center justify-center gap-2 rounded-xl border border-gold/15 bg-black/25 px-4 py-3 text-sm text-white/75"
            >
              <span className="text-gold" aria-hidden="true">
                ✓
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            href="/register"
            className="min-w-[200px] px-8 py-3.5 text-base"
          >
            Start Free Trial
          </Button>
          <Button
            href="/schedule-demo"
            variant="secondary"
            className="min-w-[200px] px-8 py-3.5 text-base"
          >
            Schedule Free Demo
          </Button>
        </div>
      </div>
    </section>
  );
}
