import Link from "next/link";
import { navLinks, socialLinks } from "@/lib/landing-data";
import { Icon } from "./Icons";

const accountLinks = [
  { label: "Restaurant Login", href: "/login" },
  { label: "Create Account", href: "/register" },
  { label: "Forgot Password", href: "/forgot-password" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      id="contact"
      className="border-t border-gold/10 bg-black py-16"
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold/10 text-gold">
                <Icon name="qr" className="h-5 w-5" />
              </span>
              <span className="font-serif text-xl font-bold text-white">
                Aljamali <span className="text-gold">QR</span>
              </span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/50">
              Elevating restaurants digitally with beautiful bilingual QR menus.
              Replace printed menus and impress every guest.
            </p>
            <div className="mt-6 flex gap-4">
              {socialLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/50 transition-all duration-300 hover:-translate-y-0.5 hover:border-gold/30 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
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
              Navigation
            </h3>
            <ul className="space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-white/50 transition-colors duration-300 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:rounded-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-white">
              Account
            </h3>
            <ul className="space-y-3">
              {accountLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/50 transition-colors duration-300 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:rounded-sm"
                  >
                    {link.label}
                  </Link>
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
                <a
                  href="mailto:hello@aljamaliqr.com"
                  className="transition-colors duration-300 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:rounded-sm"
                >
                  hello@aljamaliqr.com
                </a>
              </li>
              <li>+966 50 000 0000</li>
              <li>Riyadh, Saudi Arabia</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
          <p className="text-sm text-white/40">
            &copy; {currentYear} Aljamali QR. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-white/40">
            <a
              href="#"
              className="transition-colors duration-300 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:rounded-sm"
            >
              Privacy Policy
            </a>
            <a
              href="#"
              className="transition-colors duration-300 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:rounded-sm"
            >
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
