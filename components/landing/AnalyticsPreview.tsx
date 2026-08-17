import {
  analyticsDemoExtra,
  analyticsDemoHours,
  analyticsDemoItems,
  analyticsDemoMetrics,
} from "@/lib/landing-data";
import { SectionHeader } from "./SectionHeader";

export function AnalyticsPreview() {
  return (
    <section
      id="analytics"
      className="relative bg-background py-24 lg:py-32"
      aria-labelledby="analytics-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="Analytics"
          title="Know Your Restaurant. Grow Your Business."
          description="Premium performance views — shown with DEMO DATA only, not live production figures."
        />

        <div className="overflow-hidden rounded-3xl border border-gold/20 bg-[#0c0b09] shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 sm:px-6">
            <div>
              <p
                id="analytics-heading"
                className="font-serif text-lg font-semibold text-white"
              >
                Restaurant Intelligence
              </p>
              <p className="text-xs text-white/40">Illustrative demo dashboard</p>
            </div>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-gold">
              Demo Data
            </span>
          </div>

          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-4">
            {analyticsDemoMetrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-2xl border border-white/8 bg-white/[0.03] p-4"
              >
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/40">
                  {metric.label}
                </p>
                <p className="mt-2 font-serif text-2xl font-bold text-white">
                  {metric.value}
                </p>
                <p className="mt-1 text-[11px] text-gold/70">{metric.hint}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-4 border-t border-white/8 p-5 sm:p-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-white/8 bg-black/30 p-5 lg:col-span-1">
              <p className="text-sm font-semibold text-white">Best Selling Items</p>
              <p className="mt-1 text-xs text-white/40">Demo sample</p>
              <ul className="mt-4 space-y-3">
                {analyticsDemoItems.map((item) => (
                  <li
                    key={item.name}
                    className="flex items-center justify-between gap-3 text-sm"
                  >
                    <span className="text-white/80">{item.name}</span>
                    <span className="text-gold/80">{item.value}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/30 p-5">
              <p className="text-sm font-semibold text-white">Peak Hours</p>
              <p className="mt-1 text-xs text-white/40">Demo sample</p>
              <ul className="mt-4 space-y-3">
                {analyticsDemoHours.map((hour) => (
                  <li key={hour.label}>
                    <div className="mb-1 flex justify-between text-xs text-white/55">
                      <span>{hour.label}</span>
                      <span>{hour.level}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[#b8942e] to-gold"
                        style={{ width: `${hour.level}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-white/8 bg-black/30 p-5">
              <p className="text-sm font-semibold text-white">Customer Growth</p>
              <p className="mt-1 text-xs text-white/40">Demo sample</p>
              {analyticsDemoExtra.map((item) => (
                <div key={item.label} className="mt-6">
                  <p className="font-serif text-4xl font-bold text-gold">{item.value}</p>
                  <p className="mt-2 text-sm text-white/55">{item.hint}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
