import { loyaltyMarketingItems } from "@/lib/landing-data";
import { Icon } from "./Icons";
import { SectionHeader } from "./SectionHeader";

export function LoyaltyMarketing() {
  return (
    <section
      id="loyalty-marketing"
      className="relative bg-background py-24 lg:py-32"
      aria-labelledby="loyalty-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="Loyalty & Marketing"
          title="Bring Customers Back"
          description="Reward guests and reconnect with permission-based messaging — campaigns only reach customers who opted in."
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {loyaltyMarketingItems.map((item, index) => (
            <article
              key={item.title}
              className="group rounded-2xl border border-white/8 bg-white/[0.03] p-6 transition duration-300 hover:-translate-y-1 hover:border-gold/35"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold">
                <Icon name={item.icon} className="h-5 w-5" />
              </div>
              <h3
                id={index === 0 ? "loyalty-heading" : undefined}
                className="font-serif text-lg font-semibold text-white group-hover:text-gold"
              >
                {item.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-white/40">
          Marketing outreach is consent-gated. Only opted-in customers are
          eligible for WhatsApp campaigns and chat prompts.
        </p>
      </div>
    </section>
  );
}
