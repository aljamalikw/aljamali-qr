import type { DashboardMenuItem } from "@/lib/dashboard/menu/types";

interface MenuBadgesProps {
  item: Pick<DashboardMenuItem, "chefSpecial" | "vegetarian" | "spicy">;
  size?: "sm" | "md";
}

export function MenuBadges({ item, size = "sm" }: MenuBadgesProps) {
  const textSize = size === "sm" ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  if (!item.chefSpecial && !item.vegetarian && !item.spicy) {
    return <span className="text-xs text-white/30">—</span>;
  }

  return (
    <div className="flex flex-wrap gap-1">
      {item.chefSpecial && (
        <span className={`rounded-full bg-gold/15 font-semibold uppercase tracking-wide text-gold ${textSize}`}>
          Chef&apos;s Special
        </span>
      )}
      {item.vegetarian && (
        <span className={`rounded-full border border-emerald-500/30 bg-emerald-500/10 font-medium text-emerald-300 ${textSize}`}>
          Vegetarian
        </span>
      )}
      {item.spicy && (
        <span className={`rounded-full border border-red-500/30 bg-red-500/10 font-medium text-red-300 ${textSize}`}>
          🌶 Spicy
        </span>
      )}
    </div>
  );
}
