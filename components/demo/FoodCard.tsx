import Image from "next/image";
import type { Language, MenuItem } from "@/lib/saffron-garden/types";
import { formatPrice, t } from "@/lib/saffron-garden/menu-data";

interface FoodCardProps {
  item: MenuItem;
  lang: Language;
  index: number;
}

export function FoodCard({ item, lang, index }: FoodCardProps) {
  return (
    <article
      className="card-premium group animate-fade-in-up overflow-hidden rounded-2xl opacity-0 transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:shadow-xl hover:shadow-gold/5"
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <Image
          src={item.image}
          alt={item.name[lang]}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        <div className="absolute start-3 top-3 flex flex-wrap gap-1.5">
          {item.chefSpecial && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-black shadow-lg">
              {t("chefSpecial", lang)}
            </span>
          )}
          {item.vegetarian && (
            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 backdrop-blur-sm">
              {t("vegetarian", lang)}
            </span>
          )}
          {item.spicy && (
            <span className="rounded-full border border-red-500/40 bg-red-500/20 px-2.5 py-1 text-[10px] font-semibold text-red-300 backdrop-blur-sm">
              🌶 {t("spicy", lang)}
            </span>
          )}
        </div>

        <div className="absolute bottom-3 end-3 rounded-xl bg-black/80 px-3 py-1.5 backdrop-blur-sm">
          <span className="font-serif text-lg font-bold text-gold">
            {formatPrice(item.price, lang)}
          </span>
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-serif text-lg font-semibold text-white">
          {item.name[lang]}
        </h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-white/55">
          {item.description[lang]}
        </p>
      </div>
    </article>
  );
}
