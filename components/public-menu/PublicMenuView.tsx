"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import { useOrderCart, type OrderCartState } from "@/lib/orders/use-order-cart";
import { formatPublicPrice } from "@/lib/public-menu/format-price";
import { t } from "@/lib/public-menu/i18n";
import type {
  PublicCategoryGroup,
  PublicLanguage,
  PublicMenuData,
  PublicMenuItem,
} from "@/lib/public-menu/types";
import { planAllowsOnlineOrdering } from "@/lib/subscriptions/plans";
import { AljamaliLogo } from "@/components/branding/AljamaliLogo";
import { FloatingCategoryNav } from "./FloatingCategoryNav";
import { ImageLightbox } from "./ImageLightbox";
import { LanguageSwitch } from "./LanguageSwitch";
import { MenuItemImage } from "./MenuItemImage";
import { OrderCart } from "./OrderCart";
import { ReserveTableModal } from "./ReserveTableModal";
import { ShareMenuButtons } from "./ShareMenuButtons";

interface PublicMenuViewProps {
  menu: PublicMenuData;
}

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
  return lang === "ar" ? category.nameAr.trim() || category.nameEn : category.nameEn;
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

function DietaryBadges({ item, lang }: { item: PublicMenuItem; lang: PublicLanguage }) {
  const badges: { key: string; label: string; className: string }[] = [];

  if (item.chefSpecial) badges.push({ key: "chef", label: t("chefSpecial", lang), className: "badge-chef" });
  if (item.popular) badges.push({ key: "popular", label: `⭐ ${t("popular", lang)}`, className: "badge-veg" });
  if (item.recommended) badges.push({ key: "recommended", label: `👍 ${t("recommended", lang)}`, className: "badge-veg" });
  if (item.vegetarian) badges.push({ key: "veg", label: `🌱 ${t("vegetarian", lang)}`, className: "badge-veg" });
  if (item.vegan) badges.push({ key: "vegan", label: `🌿 ${t("vegan", lang)}`, className: "badge-veg" });
  if (item.glutenFree) badges.push({ key: "gf", label: `🌾 ${t("glutenFree", lang)}`, className: "badge-veg" });
  if (item.halal) badges.push({ key: "halal", label: `☪ ${t("halal", lang)}`, className: "badge-veg" });
  if (item.spicy) badges.push({ key: "spicy", label: `🌶 ${t("spicy", lang)}`, className: "badge-spicy" });

  if (badges.length === 0) return null;

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {badges.map((badge) => (
        <span key={badge.key} className={badge.className}>
          {badge.label}
        </span>
      ))}
    </div>
  );
}

function AddToCartControl({
  quantity,
  lang,
  onAdd,
  onIncrement,
  onDecrement,
}: {
  quantity: number;
  lang: PublicLanguage;
  onAdd: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}) {
  if (quantity === 0) {
    return (
      <button
        type="button"
        onClick={onAdd}
        className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20"
      >
        + {t("addToCart", lang)}
      </button>
    );
  }

  return (
    <div className="mt-3 inline-flex items-center gap-3 self-start rounded-full border border-gold/30 bg-gold/10 px-2 py-1">
      <button
        type="button"
        onClick={onDecrement}
        className="flex h-6 w-6 items-center justify-center rounded-full text-gold transition-colors hover:bg-gold/20"
        aria-label="Decrease quantity"
      >
        −
      </button>
      <span className="min-w-4 text-center text-sm font-semibold text-gold">{quantity}</span>
      <button
        type="button"
        onClick={onIncrement}
        className="flex h-6 w-6 items-center justify-center rounded-full text-gold transition-colors hover:bg-gold/20"
        aria-label="Increase quantity"
      >
        +
      </button>
    </div>
  );
}

function MenuItemCard({
  item,
  lang,
  currency,
  index,
  categoryIcon,
  onImageClick,
  cart,
}: {
  item: PublicMenuItem;
  lang: PublicLanguage;
  currency: string;
  index: number;
  categoryIcon: string;
  onImageClick: (src: string, alt: string) => void;
  cart?: OrderCartState;
}) {
  const name = getLocalizedName(item, lang);
  const description = getLocalizedDescription(item, lang);
  const altName = lang === "ar" ? item.nameEn : item.nameAr;
  const hasOffer = item.discountPrice !== null;

  return (
    <article
      className="card-premium group relative animate-fade-in-up overflow-hidden rounded-2xl opacity-0 transition-all duration-500 hover:border-gold/35 hover:shadow-xl hover:shadow-gold/10"
      style={{ animationDelay: `${Math.min(index * 50, 450)}ms` }}
    >
      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
        <button
          type="button"
          onClick={() => item.image && onImageClick(item.image, name)}
          className="relative mx-auto h-[160px] w-[160px] shrink-0 cursor-zoom-in overflow-hidden rounded-xl border border-gold/10 bg-surface sm:mx-0"
          aria-label={`${name} — enlarge image`}
        >
          <MenuItemImage src={item.image} alt={name} fallbackIcon={categoryIcon} />
          {hasOffer && (
            <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-lg">
              {t("offersSection", lang) === "Today's Offers" ? "Offer" : t("offersSection", lang)}
            </span>
          )}
        </button>

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h3 className="font-serif text-lg font-semibold leading-snug text-white transition-colors duration-300 group-hover:text-gold-light sm:text-xl">
                {name}
              </h3>
              {altName.trim() && altName.trim() !== name.trim() && (
                <p className="mt-1 text-sm leading-snug text-white/45">{altName}</p>
              )}
            </div>
            <div className="shrink-0 text-end">
              {hasOffer ? (
                <div className="flex flex-col items-end">
                  <p className="font-serif text-lg font-bold tracking-wide text-gold sm:text-xl">
                    {formatPublicPrice(item.discountPrice as number, currency, lang)}
                  </p>
                  <p className="text-xs text-white/35 line-through">
                    {formatPublicPrice(item.price, currency, lang)}
                  </p>
                </div>
              ) : (
                <p className="font-serif text-lg font-bold tracking-wide text-gold sm:text-xl">
                  {formatPublicPrice(item.price, currency, lang)}
                </p>
              )}
            </div>
          </div>

          <DietaryBadges item={item} lang={lang} />

          {description && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-white/55 transition-colors duration-300 group-hover:text-white/70">
              {description}
            </p>
          )}

          {(item.preparationTime || item.calories) && (
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-white/40">
              {item.preparationTime && (
                <span className="inline-flex items-center gap-1">
                  ⏱ {item.preparationTime} {/^\d+$/.test(item.preparationTime) ? t("prepTime", lang) : ""}
                </span>
              )}
              {item.calories && (
                <span className="inline-flex items-center gap-1">
                  🔥 {item.calories} {/^\d+$/.test(item.calories) ? t("calories", lang) : ""}
                </span>
              )}
            </div>
          )}

          {cart && (
            <AddToCartControl
              quantity={cart.getQuantity(item.id)}
              lang={lang}
              onAdd={() => cart.addItem(item, name)}
              onIncrement={() => cart.incrementLine(item.id)}
              onDecrement={() => cart.decrementLine(item.id)}
            />
          )}
        </div>
      </div>
    </article>
  );
}

function HighlightCard({
  item,
  lang,
  currency,
  onImageClick,
}: {
  item: PublicMenuItem;
  lang: PublicLanguage;
  currency: string;
  onImageClick: (src: string, alt: string) => void;
}) {
  const name = getLocalizedName(item, lang);
  const hasOffer = item.discountPrice !== null;

  return (
    <button
      type="button"
      onClick={() => item.image && onImageClick(item.image, name)}
      className="card-premium group flex w-[190px] shrink-0 flex-col overflow-hidden rounded-2xl text-start transition-all duration-300 hover:-translate-y-1 hover:border-gold/35"
    >
      <div className="relative h-[130px] w-full overflow-hidden bg-surface">
        <MenuItemImage src={item.image} alt={name} />
        {hasOffer && (
          <span className="absolute left-2 top-2 rounded-full bg-red-500 px-2 py-0.5 text-[10px] font-bold uppercase text-white shadow-lg">
            %
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-3">
        <p className="line-clamp-2 font-serif text-sm font-semibold text-white">{name}</p>
        <div className="mt-auto pt-2">
          {hasOffer ? (
            <div className="flex items-baseline gap-1.5">
              <span className="font-serif text-sm font-bold text-gold">
                {formatPublicPrice(item.discountPrice as number, currency, lang)}
              </span>
              <span className="text-[11px] text-white/35 line-through">
                {formatPublicPrice(item.price, currency, lang)}
              </span>
            </div>
          ) : (
            <span className="font-serif text-sm font-bold text-gold">
              {formatPublicPrice(item.price, currency, lang)}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function HighlightSection({
  title,
  items,
  lang,
  currency,
  onImageClick,
}: {
  title: string;
  items: PublicMenuItem[];
  lang: PublicLanguage;
  currency: string;
  onImageClick: (src: string, alt: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10 sm:mb-12">
      <h2 className="mb-4 font-serif text-xl font-bold text-white sm:text-2xl">{title}</h2>
      <div className="scrollbar-hide -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {items.map((item) => (
          <HighlightCard key={item.id} item={item} lang={lang} currency={currency} onImageClick={onImageClick} />
        ))}
      </div>
    </section>
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
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/20 bg-surface-elevated shadow-xl sm:h-24 sm:w-24">
        <span className="font-serif text-3xl text-gold/70 sm:text-4xl">✦</span>
      </div>
    );
  }

  return (
    <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-gold/20 bg-white/5 shadow-xl sm:h-24 sm:w-24">
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

export function PublicMenuView({ menu }: PublicMenuViewProps) {
  const [lang, setLang] = useState<PublicLanguage>("en");
  const [search, setSearch] = useState("");
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [reserveOpen, setReserveOpen] = useState(false);
  const { restaurant, groups, totalItems, popularItems, recommendedItems, chefSpecialItems, offerItems } = menu;
  const canReserve = Boolean(restaurant.id) && restaurant.reservationsEnabled;
  const canOrder =
    Boolean(restaurant.id) &&
    restaurant.onlineOrderingEnabled !== false &&
    planAllowsOnlineOrdering(restaurant.subscriptionPlan);
  const cart = useOrderCart(restaurant.taxRate);

  const scrollToCategory = useCallback((categoryId: string) => {
    const element = document.getElementById(`category-${categoryId}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const openLightbox = useCallback((src: string, alt: string) => setLightbox({ src, alt }), []);
  const closeLightbox = useCallback(() => setLightbox(null), []);

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

  return (
    <div
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      className={`min-h-screen bg-background ${lang === "ar" ? "font-arabic" : ""}`}
    >
      <header className="sticky top-0 z-40 border-b border-gold/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <AljamaliLogo variant="compact" href="/" className="!h-14 !w-14 -my-3 sm:!h-14 sm:!w-14" />
            <p className="truncate text-xs font-semibold uppercase tracking-[0.2em] text-gold/80">
              {t("poweredBy", lang)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canReserve && (
              <button
                type="button"
                onClick={() => setReserveOpen(true)}
                className="hidden items-center gap-1.5 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-xs font-semibold text-gold transition-colors hover:bg-gold/20 sm:flex"
              >
                📅 {t("reserveTable", lang)}
              </button>
            )}
            <ShareMenuButtons lang={lang} restaurantName={restaurant.name} compact />
            <LanguageSwitch lang={lang} onChange={setLang} />
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-gold/10">
        {restaurant.coverUrl ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={restaurant.coverUrl} alt="" className="h-full w-full object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-background/80 to-background" />
          </div>
        ) : (
          <>
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,transparent_55%)]" />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/40 to-background" />
          </>
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="animate-fade-in-up flex flex-col items-center text-center opacity-0 sm:items-start sm:text-start">
            <RestaurantLogo logoUrl={restaurant.logoUrl} name={restaurant.name} />

            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.25em] text-gold sm:text-xs">
              {t("browseMenu", lang)}
            </p>
            <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-white sm:text-5xl">
              {restaurant.name}
            </h1>

            {restaurant.cuisineType && (
              <p className="mt-2 text-sm text-white/50">{restaurant.cuisineType}</p>
            )}

            {restaurant.aboutUs && (
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/55 sm:text-base">
                {restaurant.aboutUs}
              </p>
            )}

            {(restaurant.openingHours || restaurant.socialInstagram || restaurant.socialFacebook || restaurant.socialTiktok || restaurant.whatsappNumber || restaurant.website || restaurant.googleMapsUrl) && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                {restaurant.openingHours && (
                  <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/55 backdrop-blur-sm">
                    🕐 {restaurant.openingHours}
                  </span>
                )}
                {restaurant.whatsappNumber && (
                  <a
                    href={`https://wa.me/${restaurant.whatsappNumber.replace(/[^\d]/g, "")}`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/55 backdrop-blur-sm transition-colors hover:border-gold/30 hover:text-gold"
                  >
                    💬 {t("whatsappUs", lang)}
                  </a>
                )}
                {restaurant.socialInstagram && (
                  <a href={restaurant.socialInstagram} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/55 backdrop-blur-sm transition-colors hover:border-gold/30 hover:text-gold">
                    Instagram
                  </a>
                )}
                {restaurant.socialFacebook && (
                  <a href={restaurant.socialFacebook} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/55 backdrop-blur-sm transition-colors hover:border-gold/30 hover:text-gold">
                    Facebook
                  </a>
                )}
                {restaurant.socialTiktok && (
                  <a href={restaurant.socialTiktok} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/55 backdrop-blur-sm transition-colors hover:border-gold/30 hover:text-gold">
                    TikTok
                  </a>
                )}
                {restaurant.googleMapsUrl && (
                  <a href={restaurant.googleMapsUrl} target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-black/30 px-3 py-1.5 text-xs text-white/55 backdrop-blur-sm transition-colors hover:border-gold/30 hover:text-gold">
                    📍 {t("getDirections", lang)}
                  </a>
                )}
              </div>
            )}

            {totalItems > 0 && (
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <span className="rounded-full border border-gold/20 bg-black/40 px-3.5 py-1.5 text-xs text-white/60 backdrop-blur-sm">
                  {totalItems} {t("dishesCount", lang)}
                </span>
                <a
                  href="#menu"
                  className="rounded-full bg-gold px-5 py-1.5 text-xs font-semibold text-black transition-all duration-300 hover:bg-gold-light hover:shadow-lg hover:shadow-gold/20"
                >
                  {t("viewMenu", lang)}
                </a>
                {canReserve && (
                  <button
                    type="button"
                    onClick={() => setReserveOpen(true)}
                    className="rounded-full border border-gold/30 bg-black/40 px-5 py-1.5 text-xs font-semibold text-gold backdrop-blur-sm transition-all duration-300 hover:border-gold/50 hover:bg-gold/10"
                  >
                    📅 {t("reserveTable", lang)}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="sticky top-[57px] z-30 border-b border-gold/10 bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-6xl px-4 pt-4 sm:px-6">
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 start-4 flex items-center text-white/30">🔍</span>
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search", lang)}
              className="w-full rounded-full border border-white/10 bg-surface px-4 py-2.5 ps-10 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute inset-y-0 end-3 flex items-center text-white/40 hover:text-white"
                aria-label={t("clearSearch", lang)}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {!isSearching && groups.length > 0 && (
          <nav aria-label="Menu categories" className="mx-auto max-w-6xl">
            <div className="scrollbar-hide flex gap-2 overflow-x-auto px-4 py-4 sm:px-6">
              {groups.map((group) => (
                <button
                  key={group.category.id}
                  type="button"
                  onClick={() => scrollToCategory(group.category.id)}
                  className="shrink-0 rounded-full border border-white/10 bg-surface px-4 py-2.5 text-sm font-medium text-white/70 transition-all duration-300 hover:border-gold/30 hover:text-gold"
                >
                  <span className="me-1.5">{group.category.icon}</span>
                  {getCategoryLabel(group.category, lang)} ({group.items.length})
                </button>
              ))}
            </div>
          </nav>
        )}
      </div>

      <main id="menu" className="mx-auto max-w-6xl px-4 py-10 pb-24 sm:px-6 sm:py-12">
        {isSearching ? (
          searchResultCount === 0 ? (
            <div className="animate-fade-in py-20 text-center opacity-0">
              <p className="text-4xl opacity-30">🔍</p>
              <p className="mt-4 text-white/50">{t("noSearchResults", lang)}</p>
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              {filteredGroups.map((group) => (
                <section key={group.category.id}>
                  <div className="mb-5 flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/15 bg-surface text-lg">
                      {group.category.icon}
                    </span>
                    <h2 className="font-serif text-xl font-bold text-white">
                      {getCategoryLabel(group.category, lang)}
                    </h2>
                  </div>
                  <div className="flex flex-col gap-4">
                    {group.items.map((item, index) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        lang={lang}
                        currency={restaurant.currency}
                        index={index}
                        categoryIcon={group.category.icon}
                        onImageClick={openLightbox}
                        cart={canOrder ? cart : undefined}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )
        ) : groups.length === 0 ? (
          <div className="animate-fade-in py-20 text-center opacity-0">
            <p className="text-4xl opacity-30">🍽️</p>
            <p className="mt-4 text-white/50">{t("emptyMenu", lang)}</p>
          </div>
        ) : (
          <>
            <HighlightSection title={t("popularSection", lang)} items={popularItems} lang={lang} currency={restaurant.currency} onImageClick={openLightbox} />
            <HighlightSection title={t("recommendedSection", lang)} items={recommendedItems} lang={lang} currency={restaurant.currency} onImageClick={openLightbox} />
            <HighlightSection title={t("chefSpecialsSection", lang)} items={chefSpecialItems} lang={lang} currency={restaurant.currency} onImageClick={openLightbox} />
            <HighlightSection title={t("offersSection", lang)} items={offerItems} lang={lang} currency={restaurant.currency} onImageClick={openLightbox} />

            <div className="space-y-14 sm:space-y-16">
              {groups.map((group) => (
                <section
                  key={group.category.id}
                  id={`category-${group.category.id}`}
                  className="scroll-mt-44"
                >
                  <div className="mb-7 flex items-center gap-4 sm:mb-8">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-gold/15 bg-surface text-xl sm:h-12 sm:w-12 sm:text-2xl">
                      {group.category.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-serif text-2xl font-bold text-white sm:text-3xl">
                        {getCategoryLabel(group.category, lang)}
                      </h2>
                      <p className="mt-0.5 text-xs text-white/40">
                        {group.items.length} {t("items", lang)}
                      </p>
                    </div>
                    <div className="hidden h-px flex-1 bg-gradient-to-r from-gold/25 to-transparent sm:block" />
                  </div>

                  <div className="flex flex-col gap-4">
                    {group.items.map((item, index) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        lang={lang}
                        currency={restaurant.currency}
                        index={index}
                        categoryIcon={group.category.icon}
                        onImageClick={openLightbox}
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

      <footer className="border-t border-gold/10 bg-black/40 py-8">
        <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
          <div className="mb-4 flex flex-col items-center gap-3">
            <AljamaliLogo variant="full" href="/" className="!h-20 !max-w-[380px]" />
            <ShareMenuButtons lang={lang} restaurantName={restaurant.name} />
          </div>
          <p className="text-xs uppercase tracking-[0.2em] text-white/30">
            {t("poweredBy", lang)}
          </p>
        </div>
      </footer>

      {canReserve && (
        <button
          type="button"
          onClick={() => setReserveOpen(true)}
          className="fixed bottom-5 start-5 z-40 flex items-center gap-2 rounded-full border border-gold/30 bg-gold px-4 py-3 text-sm font-semibold text-black shadow-xl shadow-gold/25 transition-transform hover:-translate-y-0.5 sm:hidden"
          aria-label={t("reserveTable", lang)}
        >
          📅 {t("reserveTable", lang)}
        </button>
      )}

      <FloatingCategoryNav groups={groups} lang={lang} onSelect={scrollToCategory} />
      <ImageLightbox src={lightbox?.src ?? null} alt={lightbox?.alt ?? ""} onClose={closeLightbox} />
      <ReserveTableModal
        open={reserveOpen}
        onClose={() => setReserveOpen(false)}
        restaurantId={restaurant.id}
        lang={lang}
      />
      {canOrder && (
        <Suspense fallback={null}>
          <OrderCart restaurant={restaurant} cart={cart} lang={lang} />
        </Suspense>
      )}
    </div>
  );
}
