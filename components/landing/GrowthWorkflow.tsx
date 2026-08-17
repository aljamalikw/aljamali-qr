import { growthWorkflow } from "@/lib/landing-data";
import { Icon } from "./Icons";
import { SectionHeader } from "./SectionHeader";

export function GrowthWorkflow() {
  return (
    <section
      id="growth"
      className="relative overflow-hidden bg-surface py-24 lg:py-32"
      aria-labelledby="growth-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="Connected Growth"
          title="Turn Every Customer Into a Returning Customer"
          description="A connected workflow from digital menu to analytics — built for hospitality."
        />

        <div className="mx-auto max-w-4xl">
          <ol className="relative space-y-0">
            {growthWorkflow.map((step, index) => (
              <li key={step.label} className="relative flex gap-4 pb-6 last:pb-0 sm:gap-5">
                {index < growthWorkflow.length - 1 ? (
                  <span
                    className="absolute start-[1.35rem] top-12 h-[calc(100%-1.5rem)] w-px bg-gradient-to-b from-gold/50 to-gold/10 sm:start-6"
                    aria-hidden="true"
                  />
                ) : null}
                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-gold/35 bg-background text-gold shadow-[0_0_24px_rgba(212,175,55,0.12)] sm:h-12 sm:w-12">
                  <Icon name={step.icon} className="h-5 w-5" />
                </span>
                <div className="pt-2">
                  <p
                    id={index === 0 ? "growth-heading" : undefined}
                    className="font-serif text-xl font-semibold text-white"
                  >
                    {step.label}
                  </p>
                  {index < growthWorkflow.length - 1 ? (
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-gold/50">
                      flows into
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
