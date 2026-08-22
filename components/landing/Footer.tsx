import Link from "next/link";
import { AljamaliLogo } from "@/components/branding/AljamaliLogo";
import { getWhatsAppUrl } from "@/lib/company/whatsapp";
import {
  PLATFORM_EMAIL,
  PLATFORM_PHONE,
  whatsappPrefillMessage,
} from "@/lib/landing-data";

const quickLinks = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
  { label: "Login", href: "/login" },
] as const;

const legalLinks = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms & Conditions", href: "#" },
  { label: "Support", href: "#contact" },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappHref = getWhatsAppUrl(whatsappPrefillMessage);

  return (
    <footer className="border-t border-gold/10 bg-black py-16" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <AljamaliLogo variant="full" className="!h-24 !max-w-[440px]" />
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/50">
              Premium digital QR menus and restaurant growth tools — bilingual,
              instant, and built for modern hospitality.
            </p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-sm text-white/50 transition-colors hover:text-gold"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Support
            </h3>
            <ul className="space-y-3 text-sm text-white/50">
              <li>
                <a href={`mailto:${PLATFORM_EMAIL}`} className="hover:text-gold">
                  {PLATFORM_EMAIL}
                </a>
              </li>
              <li>
                {whatsappHref ? (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gold"
                  >
                    WhatsApp · {PLATFORM_PHONE}
                  </a>
                ) : (
                  <span>WhatsApp contact not configured</span>
                )}
              </li>
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.href} className="hover:text-gold">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/40">
            &copy; {currentYear} Al Jamali QR. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-gold">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gold">
              Terms & Conditions
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
