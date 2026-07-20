import type { Metadata } from "next";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Demo } from "@/components/landing/Demo";
import { Pricing } from "@/components/landing/Pricing";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/landing/Button";

export const metadata: Metadata = {
  title: "Aljamali QR — Premium Digital QR Menus for Restaurants",
  description:
    "Replace printed menus with beautiful bilingual QR menus. English & Arabic support, instant updates, analytics, and multi-branch management.",
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
    lowPrice: "29",
    highPrice: "79",
    priceCurrency: "USD",
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
        <Features />
        <HowItWorks />
        <Demo />
        <Pricing />
        <Testimonials />
        <FAQ />

        {/* Final CTA */}
        <section
          className="relative border-t border-gold/10 bg-surface py-24 lg:py-28"
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
              Join hundreds of restaurants already using Aljamali QR. Set up
              your digital menu in minutes — no credit card required.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button href="/demo" className="min-w-[160px] px-8 py-3.5 text-base">
                View Demo
              </Button>
              <Button
                href="#pricing"
                variant="secondary"
                className="min-w-[160px] px-8 py-3.5 text-base"
              >
                Get Started
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
    </>
  );
}
