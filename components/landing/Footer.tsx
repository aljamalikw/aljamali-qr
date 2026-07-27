import Link from "next/link";
import {
  PLATFORM_EMAIL,
  PLATFORM_PHONE,
  PLATFORM_WHATSAPP,
  navLinks,
  socialLinks,
  whatsappPrefillMessage,
} from "@/lib/landing-data";
import { Icon } from "./Icons";

const companyLinks = [
  { label: "Company", href: "#hero" },
  { label: "Support", href: "#contact" },
  { label: "Schedule Demo", href: "/schedule-demo" },
  { label: "Privacy Policy", href: "#" },
  { label: "Terms", href: "#" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();
  const whatsappHref = `https://wa.me/${PLATFORM_WHATSAPP}?text=${encodeURIComponent(
    whatsappPrefillMessage,
  )}`;

  return (
    <footer className="border-t border-gold/10 bg-black py-16" aria-label="Site footer">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
                <Icon name="qr" className="h-5 w-5" />
              </span>
              <span className="font-serif text-xl font-bold text-white">
                Aljamali <span className="text-gold">QR</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              Premium digital QR menus for modern restaurants — bilingual,
              instant, and built for hospitality.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold"
                  aria-label={link.label}
                >
                  <Icon
                    name={link.icon as Parameters<typeof Icon>[0]["name"]}
                    className="h-4 w-4"
                  />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Explore
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
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
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
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
              Contact
            </h3>
            <ul className="space-y-3 text-sm text-white/50">
              <li>
                <a href={`mailto:${PLATFORM_EMAIL}`} className="hover:text-gold">
                  {PLATFORM_EMAIL}
                </a>
              </li>
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold"
                >
                  WhatsApp · {PLATFORM_PHONE}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/40">
            &copy; {currentYear} Aljamali QR. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <a href="#" className="hover:text-gold">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-gold">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
