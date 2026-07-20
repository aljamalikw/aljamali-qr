import type { Language, MenuItem } from "@/lib/saffron-garden/types";
import { formatPrice, t } from "@/lib/saffron-garden/menu-data";
import { FoodImage } from "./FoodImage";

interface FoodCardProps {
  item: MenuItem;
  lang: Language;
  index: number;
}

export function FoodCard({ item, lang, index }: FoodCardProps) {
  return (
    <article
      className="card-premium group relative animate-fade-in-up overflow-hidden rounded-2xl opacity-0 transition-all duration-500 hover:-translate-y-2 hover:border-gold/35 hover:shadow-2xl hover:shadow-gold/10"
      style={{ animationDelay: `${Math.min(index * 50, 450)}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <FoodImage
          src={item.image}
          alt={item.name[lang]}
          category={item.category}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent transition-opacity duration-500 group-hover:from-black/90" />
        <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.12)_0%,transparent_60%)]" />

        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          {item.chefSpecial && (
            <span className="badge-chef">
              {t("chefSpecial", lang)}
            </span>
          )}
          {item.vegetarian && (
            <span className="badge-veg">
              {t("vegetarian", lang)}
            </span>
          )}
          {item.spicy && (
            <span className="badge-spicy">
              🌶 {t("spicy", lang)}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 end-3 rounded-xl border border-gold/20 bg-black/85 px-3.5 py-2 backdrop-blur-md transition-all duration-300 group-hover:border-gold/40 group-hover:bg-black/95">
          <span className="font-serif text-lg font-bold tracking-wide text-gold">
            {formatPrice(item.price, lang)}
          </span>
        </div>
      </div>

      <div className="relative p-5">
        <div className="absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
        <h3 className="font-serif text-lg font-semibold leading-snug text-white transition-colors duration-300 group-hover:text-gold-light sm:text-xl">
          {item.name[lang]}
        </h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-white/50 transition-colors duration-300 group-hover:text-white/65">
          {item.description[lang]}
        </p>
      </div>
    </article>
  );
}
