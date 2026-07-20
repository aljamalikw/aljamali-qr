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

function MenuGrid({
  items,
  lang,
}: {
  items: typeof menuItems;
  lang: Language;
}) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item, index) => (
        <FoodCard key={item.id} item={item} lang={lang} index={index} />
      ))}
    </div>
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-white/60 transition-colors hover:text-gold"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
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

          <div className="flex items-center gap-2">
            <span className="font-serif text-sm font-bold text-white sm:text-base">
              {RESTAURANT.name[lang]}
            </span>
            <span className="hidden rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold sm:inline">
              Demo
            </span>
          </div>

          <LanguageSwitch lang={lang} onChange={setLang} />
        </div>
      </header>

      <section className="relative h-56 sm:h-72">
        <Image
          src={RESTAURANT.coverImage}
          alt={RESTAURANT.name[lang]}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />

        <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-6">
          <div className="animate-fade-in-up opacity-0">
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-gold">
              {t("poweredBy", lang)}
            </p>
            <h1 className="font-serif text-3xl font-bold text-white sm:text-4xl">
              {RESTAURANT.name[lang]}
            </h1>
            <p className="mt-1 text-sm text-white/70 sm:text-base">
              {RESTAURANT.tagline[lang]}
            </p>
          </div>
        </div>
      </section>

      <section className="sticky top-[57px] z-30 border-b border-gold/10 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl space-y-4 px-4 py-4">
          <DemoSearch lang={lang} value={search} onChange={setSearch} />
          <CategoryFilter
            lang={lang}
            active={category}
            onChange={setCategory}
            counts={counts}
          />
        </div>
      </section>

      <main className="mx-auto max-w-6xl px-4 py-8 pb-28">
        {filteredItems.length === 0 ? (
          <div className="animate-fade-in py-16 text-center opacity-0">
            <p className="text-white/50">{t("noResults", lang)}</p>
          </div>
        ) : category === "all" && !search.trim() ? (
          <div className="space-y-12">
            {groupedCategories.map((group) => (
              <section key={group.id} id={group.id}>
                <div className="mb-6 flex items-center gap-3">
                  <span className="text-2xl">{group.icon}</span>
                  <h2 className="font-serif text-2xl font-bold text-white">
                    {group.label[lang]}
                  </h2>
                  <div className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
                </div>
                <MenuGrid items={group.items} lang={lang} />
              </section>
            ))}
          </div>
        ) : (
          <>
            <p className="mb-6 text-sm text-white/40">
              {filteredItems.length} {t("items", lang)}
            </p>
            <MenuGrid items={filteredItems} lang={lang} />
          </>
        )}
      </main>

      <footer className="border-t border-gold/10 bg-surface py-6 text-center">
        <p className="text-xs text-white/40">{t("poweredBy", lang)}</p>
        <Link
          href="/"
          className="mt-2 inline-block text-xs text-gold hover:underline"
        >
          aljamaliqr.com
        </Link>
      </footer>

      <WhatsAppButton lang={lang} />
    </div>
  );
}
