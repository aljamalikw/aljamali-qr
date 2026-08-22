import Link from "next/link";
import { AljamaliLogo } from "@/components/branding/AljamaliLogo";

export function RestaurantNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06)_0%,transparent_65%)]" />

      <div className="relative max-w-md animate-fade-in-up opacity-0">
        <div className="mb-8 flex justify-center">
          <AljamaliLogo variant="compact" href={null} className="!h-[4.25rem] !w-[4.25rem] sm:!h-20 sm:!w-20" />
        </div>

        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          Al Jamali QR
        </p>
        <h1 className="mt-4 font-serif text-3xl font-bold text-white sm:text-4xl">
          Restaurant not found
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-white/50 sm:text-base">
          We couldn&apos;t find a menu for this link. The restaurant may have moved or the URL
          may be incorrect.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-black transition-all hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20"
          >
            Back to home
          </Link>
          <Link
            href="/demo"
            className="inline-flex items-center justify-center rounded-full border border-gold/25 px-6 py-2.5 text-sm font-medium text-white/70 transition-colors hover:border-gold/40 hover:text-gold"
          >
            View demo menu
          </Link>
        </div>
      </div>
    </div>
  );
}
