import Link from "next/link";
import { RESTAURANT } from "@/lib/saffron-garden/menu-data";
import { Button } from "./Button";

export function Demo() {
  return (
    <section
      id="demo"
      className="relative bg-surface py-24 lg:py-32"
      aria-labelledby="demo-heading"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="card-premium overflow-hidden rounded-3xl">
          <div className="grid lg:grid-cols-2">
            <div className="flex flex-col justify-center p-8 lg:p-12">
              <span className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
                Live Preview
              </span>
              <h2
                id="demo-heading"
                className="font-serif text-3xl font-bold text-white sm:text-4xl"
              >
                Experience{" "}
                <span className="gold-gradient-text">Saffron Garden</span>
              </h2>
              <p className="mt-4 leading-relaxed text-white/60">
                Browse our interactive demo menu — bilingual English &amp; Arabic,
                category filters, search, and a premium mobile-first experience
                your guests will love.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button href="/demo" className="px-8">
                  View Demo
                </Button>
                <Link
                  href="/demo"
                  className="inline-flex items-center justify-center text-sm text-gold transition-colors hover:text-gold-light"
                >
                  Saffron Garden Menu →
                </Link>
              </div>
            </div>

            <div className="relative flex min-h-[320px] items-center justify-center bg-gradient-to-br from-gold/10 to-transparent p-8 lg:min-h-[400px]">
              <Link href="/demo" className="group relative animate-float">
                <div className="rounded-2xl border border-gold/20 bg-background p-6 shadow-2xl shadow-black/40 transition-all duration-300 group-hover:border-gold/40 group-hover:shadow-gold/10">
                  <div
                    className="mb-4 h-32 w-48 overflow-hidden rounded-xl bg-cover bg-center"
                    style={{
                      backgroundImage: `url('${RESTAURANT.coverImage}')`,
                    }}
                  />
                  <p className="text-center font-serif text-sm font-semibold text-white">
                    Saffron Garden
                  </p>
                  <p className="mt-1 text-center text-xs text-white/50">
                    Tap to explore the demo menu
                  </p>
                </div>
                <div className="absolute -right-4 -top-4 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-black">
                  Demo
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
