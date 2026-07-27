"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { mobileNavLinks, navLinks } from "@/lib/landing-data";
import { Button } from "./Button";
import { Icon } from "./Icons";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-gold/20 bg-black/80 shadow-lg shadow-black/25 backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <nav
        className={`mx-auto flex max-w-7xl items-center justify-between px-6 transition-all duration-300 lg:px-8 ${
          scrolled ? "py-3" : "py-4"
        }`}
        aria-label="Main navigation"
      >
        <Link
          href="/"
          className="group flex items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <span
            className={`flex items-center justify-center rounded-lg bg-gold/10 text-gold transition-all duration-300 group-hover:bg-gold/20 ${
              scrolled ? "h-8 w-8" : "h-9 w-9"
            }`}
          >
            <Icon name="qr" className={scrolled ? "h-4 w-4" : "h-5 w-5"} />
          </span>
          <span
            className={`font-serif font-bold text-white transition-all duration-300 ${
              scrolled ? "text-lg" : "text-xl"
            }`}
          >
            Aljamali <span className="text-gold">QR</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="rounded-md text-sm text-white/70 transition-colors duration-200 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center md:flex">
          <Button href="/login" variant="secondary" className="px-5 py-2.5">
            Login
          </Button>
        </div>

        <button
          type="button"
          className="cursor-pointer rounded-lg p-2 text-white transition-colors duration-200 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
        >
          <Icon name="menu" className="h-6 w-6" />
        </button>
      </nav>

      {mobileOpen && (
        <div className="border-t border-gold/15 bg-black/95 backdrop-blur-xl md:hidden">
          <ul className="flex flex-col gap-1 px-6 py-4">
            {mobileNavLinks.map((link) => {
              const isRoute = link.href.startsWith("/");
              const className =
                "block cursor-pointer rounded-lg px-3 py-3 text-white/80 transition-colors duration-200 hover:bg-gold/10 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50";

              return (
                <li key={link.href}>
                  {isRoute ? (
                    <Link href={link.href} className={className} onClick={closeMobile}>
                      {link.label}
                    </Link>
                  ) : (
                    <a href={link.href} className={className} onClick={closeMobile}>
                      {link.label}
                    </a>
                  )}
                </li>
              );
            })}
            <li className="mt-4 border-t border-white/10 pt-4">
              <Button
                href="/login"
                variant="secondary"
                className="w-full"
                onClick={closeMobile}
              >
                Login
              </Button>
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
