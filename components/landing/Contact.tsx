import Link from "next/link";
import { getWhatsAppUrl } from "@/lib/company/whatsapp";
import {
  PLATFORM_EMAIL,
  PLATFORM_PHONE,
  whatsappPrefillMessage,
} from "@/lib/landing-data";
import { Button } from "./Button";
import { SectionHeader } from "./SectionHeader";

export function Contact() {
  const whatsappHref = getWhatsAppUrl(whatsappPrefillMessage);

  return (
    <section
      id="contact"
      className="relative bg-surface py-24 lg:py-32"
      aria-labelledby="contact-heading"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <SectionHeader
          label="Contact"
          title="Talk to Our Team"
          description="Book a free demo or reach out directly — we respond quickly on WhatsApp and email."
        />

        <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
          {whatsappHref ? (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="card-premium group rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/30"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-gold">
                WhatsApp
              </p>
              <p className="mt-3 font-serif text-xl text-white">
                {PLATFORM_PHONE}
              </p>
            </a>
          ) : (
            <div className="card-premium rounded-2xl p-6 text-center opacity-60">
              <p className="text-xs uppercase tracking-[0.2em] text-gold">
                WhatsApp
              </p>
              <p className="mt-3 font-serif text-xl text-white">
                WhatsApp contact not configured
              </p>
            </div>
          )}
          <a
            href={`mailto:${PLATFORM_EMAIL}`}
            className="card-premium group rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/30"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Email</p>
            <p className="mt-3 font-serif text-xl text-white">{PLATFORM_EMAIL}</p>
          </a>
          <div className="card-premium rounded-2xl p-6 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-gold">Demo</p>
            <p className="mt-3 font-serif text-xl text-white">Free on-site visit</p>
            <Button href="/schedule-demo" className="mt-4 w-full">
              Schedule Demo
            </Button>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-white/40">
          Prefer self-serve?{" "}
          <Link href="/register" className="text-gold hover:underline">
            Create a restaurant account
          </Link>
        </p>
      </div>
    </section>
  );
}
