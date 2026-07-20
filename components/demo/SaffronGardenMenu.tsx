"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Language, MenuCategory } from "@/lib/saffron-garden/types";
import {
  RESTAURANT,
  categories,
  menuItems,
  t,
} from "@/lib/saffron-garden/menu-data";
import { LanguageSwitch } from "./LanguageSwitch";
import { DemoSearch } from "./DemoSearch";
import { CategoryFilter } from "./CategoryFilter";
import { FoodCard } from "./FoodCard";
import { WhatsAppButton } from "./WhatsAppButton";
import { DemoQrSection } from "./DemoQrSection";
import { DemoFooter } from "./DemoFooter";

function MenuGrid({
  items,
  lang,
}: {
  items: typeof menuItems;
  lang: Language;
}) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 sm:gap-7 lg:grid-cols-3 xl:gap-8">
      {items.map((item, index) => (
        <FoodCard key={item.id} item={item} lang={lang} index={index} />
      ))}
    </div>
  );
}

function HeroCover({ alt }: { alt: string }) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-surface-elevated via-black to-surface">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12)_0%,transparent_70%)]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-serif text-6xl text-gold/20 sm:text-8xl">✦</span>
        </div>
      </div>
    );
  }

  return (
    <Image
      src={RESTAURANT.coverImage}
      alt={alt}
      fill
      priority
      sizes="100vw"
      className="object-cover"
      onError={() => setHasError(true)}
    />
  );
}

export function SaffronGardenMenu() {
  const [lang, setLang] = useState<Language>("en");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<MenuCategory | "all">("all");

  const counts = useMemo(() => {
    const result = { all: menuItems.length } as Record<
      MenuCategory | "all",
      number
    >;
    for (const cat of categories) {
      result[cat.id] = menuItems.filter((i) => i.category === cat.id).length;
    }
    return result;
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return menuItems.filter((item) => {
      const matchesCategory =
        category === "all" || item.category === category;
      if (!matchesCategory) return false;
      if (!query) return true;
      const name = item.name[lang].toLowerCase();
      const desc = item.description[lang].toLowerCase();
      const nameAlt = item.name[lang === "en" ? "ar" : "en"].toLowerCase();
      return (
        name.includes(query) ||
        desc.includes(query) ||
        nameAlt.includes(query)
      );
    });
  }, [search, category, lang]);

  const groupedCategories = useMemo(() => {
    if (category !== "all") return [];
    return categories
      .map((cat) => ({
        ...cat,
        items: filteredItems.filter((item) => item.category === cat.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [category, filteredItems]);

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      className={`min-h-screen bg-background ${lang === "ar" ? "font-arabic" : ""}`}
    >
      <header className="sticky top-0 z-40 border-b border-gold/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 transition-colors hover:text-gold"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={lang === "ar" ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"}
              />
            </svg>
            <span className="hidden text-xs sm:inline">{t("backToHome", lang)}</span>
          </Link>

          <div className="flex items-center gap-2.5">
            <span className="font-serif text-sm font-bold text-white sm:text-base">
              {RESTAURANT.name[lang]}
            </span>
            <span className="hidden rounded-full border border-gold/25 bg-gold/10 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold sm:inline">
              Demo
            </span>
          </div>

          <LanguageSwitch lang={lang} onChange={setLang} />
        </div>
      </header>

      <section className="relative h-64 sm:h-80 lg:h-96">
        <HeroCover alt={RESTAURANT.name[lang]} />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(212,175,55,0.08)_0%,transparent_60%)]" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-8 sm:px-6 sm:pb-10">
          <div className="animate-fade-in-up opacity-0">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold sm:text-xs">
              {t("poweredBy", lang)}
            </p>
            <h1 className="font-serif text-3xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
              {RESTAURANT.name[lang]}
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-relaxed text-white/70 sm:mt-3 sm:text-base lg:text-lg">
              {RESTAURANT.tagline[lang]}
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-gold/20 bg-black/40 px-3.5 py-1.5 text-xs text-white/60 backdrop-blur-sm">
                {menuItems.length} {t("dishesCount", lang)}
              </span>
              <a
                href="#menu"
                className="rounded-full bg-gold px-5 py-1.5 text-xs font-semibold text-black transition-all duration-300 hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20"
              >
                {t("viewMenu", lang)}
              </a>
            </div>
          </div>
        </div>
      </section>

      <section
        id="menu"
        className="sticky top-[57px] z-30 border-b border-gold/10 bg-background/95 backdrop-blur-xl"
      >
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6 sm:py-6">
          <DemoSearch lang={lang} value={search} onChange={setSearch} />
          <CategoryFilter
            lang={lang}
            active={category}
            onChange={setCategory}
            counts={counts}
          />
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-10 pb-32 sm:px-6 sm:py-12 sm:pb-36">
        {filteredItems.length === 0 ? (
          <div className="animate-fade-in py-20 text-center opacity-0">
            <p className="text-4xl opacity-30">🍽️</p>
            <p className="mt-4 text-white/50">{t("noResults", lang)}</p>
          </div>
        ) : category === "all" && !search.trim() ? (
          <div className="space-y-14 sm:space-y-16">
            {groupedCategories.map((group) => (
              <section key={group.id} id={group.id}>
                <div className="mb-7 flex items-center gap-4 sm:mb-8">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/15 bg-surface text-xl sm:h-12 sm:w-12 sm:text-2xl">
                    {group.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">
                      {group.label[lang]}
                    </h2>
                    <p className="mt-0.5 text-xs text-white/40">
                      {group.items.length} {t("items", lang)}
                    </p>
                  </div>
                  <div className="hidden h-px flex-1 bg-gradient-to-r from-gold/25 to-transparent sm:block" />
                </div>
                <MenuGrid items={group.items} lang={lang} />
              </section>
            ))}
          </div>
        ) : (
          <>
            <p className="mb-7 text-sm text-white/40">
              {filteredItems.length} {t("items", lang)}
            </p>
            <MenuGrid items={filteredItems} lang={lang} />
          </>
        )}
      </main>

      <DemoQrSection lang={lang} />
      <DemoFooter lang={lang} />
      <WhatsAppButton lang={lang} />
    </div>
  );
}
