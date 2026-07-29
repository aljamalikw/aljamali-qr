"use client";

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useOrderCart, type OrderCartState } from "@/lib/orders/use-order-cart";
import { formatPublicPrice } from "@/lib/public-menu/format-price";
import { t } from "@/lib/public-menu/i18n";
import type {
  PublicCategoryGroup,
  PublicLanguage,
  PublicMenuData,
  PublicMenuItem,
} from "@/lib/public-menu/types";
import { FloatingCategoryNav } from "./FloatingCategoryNav";
import { LanguageSwitch } from "./LanguageSwitch";
import { MenuItemImage } from "./MenuItemImage";
import { OrderCart } from "./OrderCart";
import { ReserveTableModal } from "./ReserveTableModal";
import { ShareMenuButtons } from "./ShareMenuButtons";

interface PublicMenuViewProps {
  menu: PublicMenuData;
}

const easeOut = [0.22, 1, 0.36, 1] as const;

function getLocalizedName(
  item: Pick<PublicMenuItem, "nameEn" | "nameAr">,
  lang: PublicLanguage,
): string {
  const primary = lang === "ar" ? item.nameAr : item.nameEn;
  const fallback = lang === "ar" ? item.nameEn : item.nameAr;
  return primary.trim() || fallback.trim() || item.nameEn;
}

function getLocalizedDescription(
  item: Pick<PublicMenuItem, "descriptionEn" | "descriptionAr">,
  lang: PublicLanguage,
): string {
  const primary = lang === "ar" ? item.descriptionAr : item.descriptionEn;
  const fallback = lang === "ar" ? item.descriptionEn : item.descriptionAr;
  return primary.trim() || fallback.trim();
}

function getCategoryLabel(
  category: Pick<PublicCategoryGroup["category"], "nameEn" | "nameAr">,
  lang: PublicLanguage,
): string {
  return lang === "ar"
    ? category.nameAr.trim() || category.nameEn
    : category.nameEn;
}

function matchesSearch(item: PublicMenuItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    item.nameEn.toLowerCase().includes(q) ||
    item.nameAr.includes(query.trim()) ||
    item.descriptionEn.toLowerCase().includes(q) ||
    item.descriptionAr.includes(query.trim())
  );
}

function DietaryBadges({
  item,
  lang,
  compact = false,
}: {
  item: PublicMenuItem;
  lang: PublicLanguage;
  compact?: boolean;
}) {
  const badges: { key: string; label: string }[] = [];
  if (item.chefSpecial)
    badges.push({ key: "chef", label: t("chefSpecial", lang) });
  if (item.popular) badges.push({ key: "popular", label: t("popular", lang) });
  if (item.recommended)
    badges.push({ key: "recommended", label: t("recommended", lang) });
  if (item.vegetarian)
    badges.push({ key: "veg", label: t("vegetarian", lang) });
  if (item.vegan) badges.push({ key: "vegan", label: t("vegan", lang) });
  if (item.glutenFree)
    badges.push({ key: "gf", label: t("glutenFree", lang) });
  if (item.halal) badges.push({ key: "halal", label: t("halal", lang) });
  if (item.spicy) badges.push({ key: "spicy", label: t("spicy", lang) });
  if (item.discountPrice !== null)
    badges.push({ key: "offer", label: t("offersSection", lang) });

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1.5 ${compact ? "" : "mt-3"}`}>
      {badges.slice(0, compact ? 3 : 8).map((badge) => (
        <span
          key={badge.key}
          className="rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gold"
        >
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function RestaurantLogo({
  logoUrl,
  name,
}: {
  logoUrl: string | null;
  name: string;
}) {
  const [hasError, setHasError] = useState(false);

  if (!logoUrl || hasError) {
    return (
      <div className="flex h-24 w-24 items-center justify-center rounded-3xl border border-gold/30 bg-black/60 shadow-2xl backdrop-blur-xl sm:h-28 sm:w-28">
        <span className="font-serif text-4xl text-gold">{name.charAt(0)}</span>
      </div>
    );
  }

  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-gold/30 bg-black/40 shadow-2xl sm:h-28 sm:w-28">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt={name}
        className="h-full w-full object-cover"
        onError={() => setHasError(true)}
      />
    </div>
  );
}

function MenuItemCard({
  item,
  lang,
  currency,
  index,
  categoryIcon,
  favorite,
  onToggleFavorite,
  onOpen,
  cart,
}: {
  item: PublicMenuItem;
  lang: PublicLanguage;
  currency: string;
  index: number;
  categoryIcon: string;
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
  cart?: OrderCartState;
}) {
  const name = getLocalizedName(item, lang);
  const description = getLocalizedDescription(item, lang);
  const hasOffer = item.discountPrice !== null;
  const qty = cart?.getQuantity(item.id) ?? 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.28), ease: easeOut }}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl border border-gold/20 bg-black/45 shadow-[0_16px_48px_rgba(0,0,0,0.4)] backdrop-blur-xl transition-all duration-500 hover:-translate-y-2 hover:border-gold/45 hover:shadow-[0_24px_60px_rgba(212,175,55,0.14)]"
    >
      <button
        type="button"
        onClick={onOpen}
        className="relative aspect-[4/3] w-full overflow-hidden bg-surface"
        aria-label={name}
      >
        <MenuItemImage src={item.image} alt={name} fallbackIcon={categoryIcon} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80" />
        <div className="absolute left-3 top-3">
          <DietaryBadges item={item} lang={lang} compact />
        </div>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onToggleFavorite();
          }}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border backdrop-blur-md transition-colors ${
            favorite
              ? "border-gold/50 bg-gold text-black"
              : "border-white/20 bg-black/40 text-white/70 hover:border-gold/40 hover:text-gold"
          }`}
          aria-label={favorite ? "Remove favorite" : "Add favorite"}
        >
          {favorite ? "♥" : "♡"}
        </button>
      </button>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <button type="button" onClick={onOpen} className="text-start">
          <h3 className="font-serif text-lg font-semibold leading-snug text-white transition-colors group-hover:text-gold sm:text-xl">
            {name}
          </h3>
          {description ? (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/55">
              {description}
            </p>
          ) : null}
        </button>

        <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
          {item.preparationTime ? (
            <span>⏱ {item.preparationTime}{ /^\d+$/.test(item.preparationTime) ? ` ${t("prepTime", lang)}` : ""}</span>
          ) : null}
          {item.calories ? (
            <span>🔥 {item.calories}{ /^\d+$/.test(item.calories) ? ` ${t("calories", lang)}` : ""}</span>
          ) : null}
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {hasOffer ? (
              <>
                <p className="font-serif text-xl font-bold text-gold">
                  {formatPublicPrice(item.discountPrice as number, currency, lang)}
                </p>
                <p className="text-xs text-white/35 line-through">
                  {formatPublicPrice(item.price, currency, lang)}
                </p>
              </>
            ) : (
              <p className="font-serif text-xl font-bold text-gold">
                {formatPublicPrice(item.price, currency, lang)}
              </p>
            )}
          </div>

          {cart ? (
            qty > 0 ? (
              <div className="inline-flex items-center gap-2 rounded-full border border-gold/35 bg-gold/15 px-2 py-1">
                <button
                  type="button"
                  onClick={() => cart.decrementLine(item.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gold hover:bg-gold/20"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="min-w-4 text-center text-sm font-semibold text-gold">
                  {qty}
                </span>
                <button
                  type="button"
                  onClick={() => cart.incrementLine(item.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-gold hover:bg-gold/20"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => cart.addItem(item, name)}
                className="rounded-full bg-gradient-to-r from-[#e8c547] via-gold to-[#b8942e] px-4 py-2 text-xs font-bold text-black shadow-lg shadow-gold/20 transition-transform hover:scale-[1.03]"
              >
                + {t("addToCart", lang)}
              </button>
            )
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="rounded-full border border-gold/30 bg-gold/10 px-4 py-2 text-xs font-semibold text-gold"
            >
              {lang === "ar" ? "التفاصيل" : "Details"}
            </button>
          )}
        </div>
      </div>
    </motion.article>
  );
}

function ItemDetailDrawer({
  item,
  lang,
  currency,
  categoryIcon,
  open,
  onClose,
  cart,
}: {
  item: PublicMenuItem | null;
  lang: PublicLanguage;
  currency: string;
  categoryIcon: string;
  open: boolean;
  onClose: () => void;
  cart?: OrderCartState;
}) {
  const [qty, setQty] = useState(1);
  const [notes, setNotes] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (open) {
      setQty(1);
      setNotes("");
      setAdded(false);
    }
  }, [open, item?.id]);

  if (!item) return null;

  const name = getLocalizedName(item, lang);
  const description = getLocalizedDescription(item, lang);
  const hasOffer = item.discountPrice !== null;
  const unit = item.discountPrice ?? item.price;

  const handleAdd = () => {
    if (!cart) return;
    for (let i = 0; i < qty; i += 1) {
      cart.addItem(item, name);
    }
    if (notes.trim()) {
      cart.updateLineNotes(item.id, notes.trim());
    }
    setAdded(true);
    window.setTimeout(() => {
      onClose();
    }, 650);
  };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            aria-label={t("close", lang)}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={name}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: easeOut }}
            className="absolute inset-x-0 bottom-0 max-h-[92vh] overflow-y-auto rounded-t-[2rem] border border-gold/20 bg-[#0a0a0a]/95 shadow-[0_-20px_80px_rgba(0,0,0,0.6)] backdrop-blur-xl"
          >
            <div className="mx-auto max-w-2xl">
              <div className="sticky top-0 z-10 flex justify-center bg-gradient-to-b from-black/80 to-transparent px-4 pt-3 pb-2">
                <span className="h-1.5 w-12 rounded-full bg-white/25" />
              </div>

              <div className="relative aspect-[16/10] w-full overflow-hidden">
                <MenuItemImage
                  src={item.image}
                  alt={name}
                  fallbackIcon={categoryIcon}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-black/20" />
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white backdrop-blur-md"
                  aria-label={t("close", lang)}
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 px-5 pb-10 pt-2 sm:px-8">
                <div>
                  <DietaryBadges item={item} lang={lang} />
                  <h2 className="mt-3 font-serif text-3xl font-bold text-white">
                    {name}
                  </h2>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-serif text-2xl font-bold text-gold">
                      {formatPublicPrice(unit, currency, lang)}
                    </span>
                    {hasOffer ? (
                      <span className="text-sm text-white/35 line-through">
                        {formatPublicPrice(item.price, currency, lang)}
                      </span>
                    ) : null}
                  </div>
                </div>

                {description ? (
                  <p className="text-sm leading-relaxed text-white/65 sm:text-base">
                    {description}
                  </p>
                ) : null}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {item.preparationTime ? (
                    <div className="rounded-2xl border border-gold/15 bg-black/30 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/40">
                        Prep
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {item.preparationTime}
                        {/^\d+$/.test(item.preparationTime)
                          ? ` ${t("prepTime", lang)}`
                          : ""}
                      </p>
                    </div>
                  ) : null}
                  {item.calories ? (
                    <div className="rounded-2xl border border-gold/15 bg-black/30 px-3 py-3">
                      <p className="text-[10px] uppercase tracking-wider text-white/40">
                        {t("calories", lang)}
                      </p>
                      <p className="mt-1 text-sm font-medium text-white">
                        {item.calories}
                      </p>
                    </div>
                  ) : null}
                  <div className="rounded-2xl border border-gold/15 bg-black/30 px-3 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-white/40">
                      {lang === "ar" ? "التوفر" : "Availability"}
                    </p>
                    <p className="mt-1 text-sm font-medium text-emerald-400">
                      {lang === "ar" ? "متاح اليوم" : "Available today"}
                    </p>
                  </div>
                </div>

                {cart ? (
                  <>
                    <div>
                      <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/45">
                        {t("specialInstructions", lang)}
                      </label>
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        rows={2}
                        placeholder={t("itemNotesPlaceholder", lang)}
                        className="w-full rounded-2xl border border-gold/20 bg-black/40 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold/45 focus:outline-none focus:ring-2 focus:ring-gold/15"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="inline-flex items-center gap-3 rounded-full border border-gold/30 bg-gold/10 px-3 py-2">
                        <button
                          type="button"
                          onClick={() => setQty((value) => Math.max(1, value - 1))}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gold hover:bg-gold/20"
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center font-semibold text-white">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setQty((value) => value + 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full text-gold hover:bg-gold/20"
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                      <motion.button
                        type="button"
                        onClick={handleAdd}
                        animate={added ? { scale: [1, 1.05, 1] } : {}}
                        className="flex-1 rounded-2xl bg-gradient-to-r from-[#e8c547] via-gold to-[#b8942e] px-5 py-3.5 text-sm font-bold text-black shadow-xl shadow-gold/25"
                      >
                        {added
                          ? "✓"
                          : `${t("addToCart", lang)} · ${formatPublicPrice(unit * qty, currency, lang)}`}
                      </motion.button>
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

export function PublicMenuView({ menu }: PublicMenuViewProps) {
  const [lang, setLang] = useState<PublicLanguage>("en");
  const [search, setSearch] = useState("");
  const [reserveOpen, setReserveOpen] = useState(false);
  const [headerStuck, setHeaderStuck] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<{
    item: PublicMenuItem;
    icon: string;
  } | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const heroRef = useRef<HTMLElement | null>(null);

  const {
    restaurant,
    groups,
    totalItems,
    popularItems,
    recommendedItems,
    chefSpecialItems,
    offerItems,
  } = menu;
  const canReserve = Boolean(restaurant.id) && restaurant.reservationsEnabled;
  const canOrder =
    Boolean(restaurant.id) && restaurant.onlineOrderingEnabled !== false;
  const cart = useOrderCart(restaurant.taxRate);

  useEffect(() => {
    const onScroll = () => {
      const heroBottom = heroRef.current?.getBoundingClientRect().bottom ?? 0;
      setHeaderStuck(heroBottom < 80);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (groups.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target.id) {
          setActiveCategory(visible.target.id.replace("category-", ""));
        }
      },
      { rootMargin: "-30% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] },
    );

    for (const group of groups) {
      const el = document.getElementById(`category-${group.category.id}`);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [groups]);

  const scrollToCategory = useCallback((categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveCategory(categoryId);
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const isSearching = search.trim().length > 0;

  const filteredGroups = useMemo(() => {
    if (!isSearching) return groups;
    return groups
      .map((group) => ({
        category: group.category,
        items: group.items.filter((item) => matchesSearch(item, search)),
      }))
      .filter((group) => group.items.length > 0);
  }, [groups, search, isSearching]);

  const searchResultCount = useMemo(
    () => filteredGroups.reduce((sum, group) => sum + group.items.length, 0),
    [filteredGroups],
  );

  const highlightSections = [
    { title: t("popularSection", lang), items: popularItems },
    { title: t("recommendedSection", lang), items: recommendedItems },
    { title: t("chefSpecialsSection", lang), items: chefSpecialItems },
    { title: t("offersSection", lang), items: offerItems },
  ].filter((section) => section.items.length > 0);

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      className={`relative min-h-screen bg-background ${lang === "ar" ? "font-arabic" : ""}`}
    >
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
      >
        <div className="absolute left-1/4 top-40 h-80 w-80 rounded-full bg-gold/[0.05] blur-3xl" />
        <div className="absolute right-0 top-[40%] h-72 w-72 rounded-full bg-gold/[0.04] blur-3xl" />
      </div>

      {/* Sticky compact header */}
      <header
        className={`fixed inset-x-0 top-0 z-40 border-b transition-all duration-300 ${
          headerStuck
            ? "border-gold/15 bg-black/90 shadow-[0_8px_30px_rgba(0,0,0,0.45)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="min-w-0">
            <p
              className={`truncate text-xs font-semibold uppercase tracking-[0.18em] transition-opacity ${
                headerStuck ? "text-gold opacity-100" : "opacity-0"
              }`}
            >
              {restaurant.name}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canReserve ? (
              <button
                type="button"
                onClick={() => setReserveOpen(true)}
                className="hidden rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20 sm:inline-flex"
              >
                {t("reserveTable", lang)}
              </button>
            ) : null}
            <ShareMenuButtons
              lang={lang}
              restaurantName={restaurant.name}
              compact
            />
            <LanguageSwitch lang={lang} onChange={setLang} />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section ref={heroRef} className="relative overflow-hidden">
        <div className="absolute inset-0">
          {restaurant.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={restaurant.coverUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-[#1a1a1a] via-black to-[#0a0a0a]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/70 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.12)_0%,transparent_55%)]" />
        </div>

        <div className="relative mx-auto max-w-[1400px] px-4 pb-10 pt-24 sm:px-6 sm:pb-12 sm:pt-28 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-end sm:text-start">
              <RestaurantLogo
                logoUrl={restaurant.logoUrl}
                name={restaurant.name}
              />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                  {restaurant.cuisineType || t("browseMenu", lang)}
                </p>
                <h1 className="mt-2 font-serif text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
                  {restaurant.name}
                </h1>
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Open
                  </span>
                  <span className="rounded-full border border-gold/20 bg-black/40 px-3 py-1 text-xs text-gold backdrop-blur-md">
                    ★ 4.9
                  </span>
                  <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/55 backdrop-blur-md">
                    {totalItems} {t("dishesCount", lang)}
                  </span>
                  {restaurant.openingHours ? (
                    <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/55 backdrop-blur-md">
                      ⏱ {restaurant.openingHours}
                    </span>
                  ) : null}
                </div>
                {restaurant.aboutUs ? (
                  <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/60 sm:mx-0 sm:text-base">
                    {restaurant.aboutUs}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
              {restaurant.phone ? (
                <a
                  href={`tel:${restaurant.phone}`}
                  className="rounded-full border border-gold/30 bg-black/45 px-4 py-2.5 text-xs font-semibold text-gold backdrop-blur-md transition-colors hover:bg-gold/10"
                >
                  {t("callUs", lang)}
                </a>
              ) : null}
              {canReserve ? (
                <button
                  type="button"
                  onClick={() => setReserveOpen(true)}
                  className="rounded-full bg-gradient-to-r from-[#e8c547] via-gold to-[#b8942e] px-4 py-2.5 text-xs font-bold text-black shadow-lg shadow-gold/25"
                >
                  {t("reserveTable", lang)}
                </button>
              ) : null}
              {restaurant.googleMapsUrl ? (
                <a
                  href={restaurant.googleMapsUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 bg-black/45 px-4 py-2.5 text-xs font-semibold text-white/70 backdrop-blur-md hover:border-gold/30 hover:text-gold"
                >
                  📍 {t("getDirections", lang)}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Search + categories */}
      <div className="sticky top-[57px] z-30 border-b border-gold/10 bg-background/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1400px] px-4 pt-4 sm:px-6 lg:px-8">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-white/35">
              🔍
            </span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("search", lang)}
              className="w-full rounded-full border border-gold/25 bg-black/50 py-3.5 pe-12 ps-11 text-sm text-white shadow-[0_8px_30px_rgba(0,0,0,0.35)] placeholder:text-white/35 backdrop-blur-xl focus:border-gold/50 focus:outline-none focus:ring-2 focus:ring-gold/20"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 end-4 flex items-center text-white/40 hover:text-white"
                aria-label={t("clearSearch", lang)}
              >
                ✕
              </button>
            ) : null}
          </div>
        </div>

        {!isSearching && groups.length > 0 ? (
          <nav
            aria-label="Menu categories"
            className="mx-auto max-w-[1400px]"
          >
            <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-4 sm:px-6 lg:px-8">
              {groups.map((group) => {
                const active = activeCategory === group.category.id;
                return (
                  <button
                    key={group.category.id}
                    type="button"
                    onClick={() => scrollToCategory(group.category.id)}
                    className={`relative shrink-0 rounded-full border px-4 py-2.5 text-sm font-medium transition-all duration-300 ${
                      active
                        ? "border-gold bg-gold/15 text-gold shadow-[0_0_20px_rgba(212,175,55,0.15)]"
                        : "border-white/10 bg-black/40 text-white/65 hover:border-gold/30 hover:text-gold"
                    }`}
                  >
                    <span className="me-1.5">{group.category.icon}</span>
                    {getCategoryLabel(group.category, lang)}
                    {active ? (
                      <motion.span
                        layoutId="category-underline"
                        className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-gold"
                      />
                    ) : null}
                  </button>
                );
              })}
            </div>
          </nav>
        ) : null}
      </div>

      <main
        id="menu"
        className="relative mx-auto max-w-[1400px] px-4 py-10 pb-32 sm:px-6 sm:py-12 lg:px-8"
      >
        {isSearching ? (
          searchResultCount === 0 ? (
            <div className="flex flex-col items-center py-24 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-gold/20 bg-gold/10 text-2xl">
                🔍
              </div>
              <p className="font-serif text-xl text-white">
                {t("noSearchResults", lang)}
              </p>
              <p className="mt-2 text-sm text-white/45">
                {lang === "ar"
                  ? "جرّب كلمة أخرى أو تصفح الفئات."
                  : "Try another keyword or browse categories."}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {filteredGroups.map((group) => (
                <section key={group.category.id}>
                  <h2 className="mb-5 font-serif text-2xl font-bold text-white">
                    {group.category.icon}{" "}
                    {getCategoryLabel(group.category, lang)}
                  </h2>
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
                    {group.items.map((item, index) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        lang={lang}
                        currency={restaurant.currency}
                        index={index}
                        categoryIcon={group.category.icon}
                        favorite={favorites.has(item.id)}
                        onToggleFavorite={() => toggleFavorite(item.id)}
                        onOpen={() =>
                          setDetailItem({
                            item,
                            icon: group.category.icon,
                          })
                        }
                        cart={canOrder ? cart : undefined}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : groups.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl border border-gold/20 bg-gold/10 text-2xl">
              🍽️
            </div>
            <p className="font-serif text-xl text-white">
              {t("emptyMenu", lang)}
            </p>
          </div>
        ) : (
          <>
            {highlightSections.map((section) => (
              <section key={section.title} className="mb-12">
                <h2 className="mb-5 font-serif text-2xl font-bold text-white sm:text-3xl">
                  {section.title}
                </h2>
                <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                  {section.items.map((item) => {
                    const name = getLocalizedName(item, lang);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setDetailItem({ item, icon: "🍽️" })
                        }
                        className="group w-[210px] shrink-0 overflow-hidden rounded-3xl border border-gold/20 bg-black/45 text-start shadow-lg backdrop-blur-xl transition-all duration-400 hover:-translate-y-1 hover:border-gold/45"
                      >
                        <div className="relative h-36 overflow-hidden">
                          <MenuItemImage src={item.image} alt={name} />
                        </div>
                        <div className="p-3.5">
                          <p className="line-clamp-2 font-serif text-sm font-semibold text-white group-hover:text-gold">
                            {name}
                          </p>
                          <p className="mt-2 font-serif text-sm font-bold text-gold">
                            {formatPublicPrice(
                              item.discountPrice ?? item.price,
                              restaurant.currency,
                              lang,
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            <div className="space-y-14 sm:space-y-16">
              {groups.map((group) => (
                <section
                  key={group.category.id}
                  id={`category-${group.category.id}`}
                  className="scroll-mt-48"
                >
                  <div className="mb-6 flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-gold/20 bg-black/40 text-2xl">
                      {group.category.icon}
                    </span>
                    <div>
                      <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">
                        {getCategoryLabel(group.category, lang)}
                      </h2>
                      <p className="text-xs text-white/40">
                        {group.items.length} {t("items", lang)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:gap-6">
                    {group.items.map((item, index) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        lang={lang}
                        currency={restaurant.currency}
                        index={index}
                        categoryIcon={group.category.icon}
                        favorite={favorites.has(item.id)}
                        onToggleFavorite={() => toggleFavorite(item.id)}
                        onOpen={() =>
                          setDetailItem({
                            item,
                            icon: group.category.icon,
                          })
                        }
                        cart={canOrder ? cart : undefined}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
      </main>

      <footer className="border-t border-gold/10 bg-black/50 py-10">
        <div className="mx-auto max-w-[1400px] px-4 text-center sm:px-6 lg:px-8">
          <ShareMenuButtons lang={lang} restaurantName={restaurant.name} />
          <p className="mt-5 text-xs uppercase tracking-[0.2em] text-white/30">
            {t("poweredBy", lang)}
          </p>
        </div>
      </footer>

      {canReserve ? (
        <button
          type="button"
          onClick={() => setReserveOpen(true)}
          className="fixed bottom-5 start-5 z-40 flex items-center gap-2 rounded-full border border-gold/30 bg-gold px-4 py-3 text-sm font-semibold text-black shadow-xl shadow-gold/25 sm:hidden"
          aria-label={t("reserveTable", lang)}
        >
          📅 {t("reserveTable", lang)}
        </button>
      ) : null}

      <FloatingCategoryNav
        groups={groups}
        lang={lang}
        onSelect={scrollToCategory}
      />
      <ReserveTableModal
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        restaurantId={restaurant.id}
        lang={lang}
      />
      {canOrder ? (
        <Suspense fallback={null}>
          <OrderCart restaurant={restaurant} cart={cart} lang={lang} />
        </Suspense>
      ) : null}

      <ItemDetailDrawer
        item={detailItem?.item ?? null}
        categoryIcon={detailItem?.icon ?? "🍽️"}
        lang={lang}
        currency={restaurant.currency}
        open={Boolean(detailItem)}
        onClose={() => setDetailItem(null)}
        cart={canOrder ? cart : undefined}
      />
    </div>
  );
}
