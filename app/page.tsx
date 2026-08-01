import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { FreeTrial } from "@/components/landing/FreeTrial";
import { Features } from "@/components/landing/Features";
import { WhyUs } from "@/components/landing/WhyUs";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Demo } from "@/components/landing/Demo";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { Contact } from "@/components/landing/Contact";
import { Footer } from "@/components/landing/Footer";
import { WhatsAppFloat } from "@/components/landing/WhatsAppFloat";
import { Button } from "@/components/landing/Button";
import {
  PRICING_CURRENCY,
  PRICING_HIGH_PRICE,
  PRICING_LOW_PRICE,
} from "@/lib/landing-data";

export const metadata: Metadata = {
  title: "Aljamali QR — Premium Digital QR Menus for Restaurants",
  description:
    `Replace printed menus with beautiful bilingual QR menus. Plans from ${PRICING_LOW_PRICE} to ${PRICING_HIGH_PRICE} KWD/month, plus Enterprise. English & Arabic, instant updates, and analytics.`,
  alternates: {
    canonical: "/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Aljamali QR",
  applicationCategory: "BusinessApplication",
  description:
    "Digital QR menu platform for restaurants with English and Arabic support.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: PRICING_LOW_PRICE,
    highPrice: PRICING_HIGH_PRICE,
    priceCurrency: PRICING_CURRENCY,
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main id="main-content" className="overflow-x-hidden bg-background">
        <Hero />
        <FreeTrial />
        <Features />
        <WhyUs />
        <HowItWorks />
        <Demo />
        <Pricing />
        <Testimonials />
        <FAQ />
        <Contact />

        <section
          className="relative border-t border-gold/10 bg-background py-24 lg:py-28"
          aria-labelledby="cta-heading"
        >
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          <div className="mx-auto max-w-4xl px-6 text-center lg:px-8">
            <h2
              id="cta-heading"
              className="font-serif text-3xl font-bold text-white sm:text-4xl lg:text-5xl"
            >
              Ready to Elevate Your{" "}
              <span className="gold-gradient-text">Restaurant Experience</span>?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-white/60">
              Join restaurants modernizing service with Aljamali QR. Schedule a
              free demo or explore the live menu experience.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button
                href="/schedule-demo"
                className="min-w-[180px] px-8 py-3.5 text-base"
              >
                Schedule Free Demo
              </Button>
              <Button
                href="/demo"
                variant="secondary"
                className="min-w-[160px] px-8 py-3.5 text-base"
              >
                View Demo Menu
              </Button>
            </div>
            <p className="mt-6 text-sm text-white/40">
              Questions?{" "}
              <Link href="#contact" className="text-gold hover:underline">
                Contact our team
              </Link>
            </p>
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppFloat />
    </>
  );
}
