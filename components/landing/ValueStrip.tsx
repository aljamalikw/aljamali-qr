import { trustStripItems } from "@/lib/landing-data";

export function ValueStrip() {
  return (
    <section
      aria-label="Trust and reliability"
      className="relative border-y border-gold/15 bg-surface/90 py-8 backdrop-blur-sm sm:py-10"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <p className="mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35">
          Built for restaurant teams across the GCC
        </p>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {trustStripItems.map((item) => (
            <li
              key={item}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-black/25 px-4 py-3 text-center text-sm font-medium text-white/75"
            >
              <span className="text-gold" aria-hidden="true">
                ◆
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
