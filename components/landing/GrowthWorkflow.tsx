import { growthWorkflow } from "@/lib/landing-data";
import { Icon } from "./Icons";
import { SectionHeader } from "./SectionHeader";

export function GrowthWorkflow() {
  return (
    <section
      id="growth"
      className="relative overflow-hidden bg-background py-24 lg:py-32"
      aria-labelledby="growth-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.06),transparent_60%)]"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="Growth"
          title="Turn Every Customer Into a Returning Customer"
          description="Aljamali QR connects the full guest journey — from the first order to loyalty, outreach, and insight."
        />

        <div className="mx-auto flex max-w-5xl flex-col items-stretch gap-3 md:flex-row md:flex-wrap md:items-center md:justify-center md:gap-2">
          {growthWorkflow.map((step, index) => (
            <div key={step.label} className="flex items-center gap-2 md:contents">
              <div className="flex flex-1 items-center gap-3 rounded-2xl border border-gold/20 bg-black/30 px-4 py-4 md:flex-none md:min-w-[9.5rem] md:flex-col md:gap-2 md:px-5 md:py-5 md:text-center">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-gold">
                  <Icon name={step.icon} className="h-5 w-5" />
                </span>
                <p className="text-sm font-semibold text-white">{step.label}</p>
              </div>
              {index < growthWorkflow.length - 1 ? (
                <span
                  className="hidden text-gold/50 md:inline"
                  aria-hidden="true"
                >
                  →
                </span>
              ) : null}
              {index < growthWorkflow.length - 1 ? (
                <div
                  className="mx-auto h-6 w-px bg-gradient-to-b from-gold/40 to-transparent md:hidden"
                  aria-hidden="true"
                />
              ) : null}
            </div>
          ))}
        </div>

        <p
          id="growth-heading"
          className="mx-auto mt-10 max-w-2xl text-center text-sm text-white/45"
        >
          Orders feed your CRM. Loyalty rewards return visits. WhatsApp and
          marketing reconnect opted-in guests. Analytics shows what is working.
        </p>
      </div>
    </section>
  );
}
