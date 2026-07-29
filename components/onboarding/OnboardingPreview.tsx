"use client";

import { motion } from "framer-motion";

export type OnboardingPreviewData = {
  restaurantName: string;
  restaurantType: string;
  city: string;
  logoUrl: string;
  coverUrl: string;
  themePrimaryColor: string;
  menuAccentColor: string;
  fontStyle: string;
  darkModeDefault: boolean;
};

const sampleItems = [
  { name: "Grilled Lamb", price: "18.5" },
  { name: "Saffron Rice", price: "4.5" },
  { name: "Kunafa", price: "3.5" },
] as const;

interface OnboardingPreviewProps {
  data: OnboardingPreviewData;
}

export function OnboardingPreview({ data }: OnboardingPreviewProps) {
  const name = data.restaurantName.trim() || "Your Restaurant";
  const accent = data.menuAccentColor || "#d4af37";
  const primary = data.themePrimaryColor || "#d4af37";
  const dark = data.darkModeDefault;
  const fontClass =
    data.fontStyle === "sans" || data.fontStyle === "rounded"
      ? "font-sans"
      : "font-serif";

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[280px]"
      initial={{ opacity: 0, y: 20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      aria-hidden="true"
    >
      {/* Phone frame */}
      <div className="relative overflow-hidden rounded-[2.25rem] border border-gold/30 bg-black p-2.5 shadow-[0_40px_100px_rgba(0,0,0,0.65),0_0_40px_rgba(212,175,55,0.1)]">
        <div className="absolute left-1/2 top-3 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

        <div
          className="relative overflow-hidden rounded-[1.85rem]"
          style={{
            background: dark
              ? "linear-gradient(165deg, #141414 0%, #080808 100%)"
              : "linear-gradient(165deg, #fafafa 0%, #f0f0f0 100%)",
            color: dark ? "#fff" : "#111",
          }}
        >
          {/* Cover */}
          <div
            className="relative h-28 overflow-hidden"
            style={{
              background: data.coverUrl
                ? undefined
                : `linear-gradient(135deg, ${primary}44, ${accent}22, #000)`,
            }}
          >
            {data.coverUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={data.coverUrl}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : null}
            <div
              className="absolute inset-0"
              style={{
                background: dark
                  ? "linear-gradient(to top, #080808 0%, transparent 70%)"
                  : "linear-gradient(to top, #f0f0f0 0%, transparent 70%)",
              }}
            />
          </div>

          <div className="relative -mt-8 px-4 pb-5">
            <div className="flex items-end gap-3">
              {data.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={data.logoUrl}
                  alt=""
                  className="h-14 w-14 rounded-2xl object-cover shadow-lg"
                  style={{ border: `2px solid ${primary}` }}
                />
              ) : (
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-bold shadow-lg ${fontClass}`}
                  style={{
                    border: `2px solid ${primary}`,
                    color: primary,
                    background: dark ? "#111" : "#fff",
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1 pb-1">
                <p className={`${fontClass} truncate text-base font-bold`}>
                  {name}
                </p>
                <p className="truncate text-[11px]" style={{ color: primary }}>
                  {data.restaurantType || "Digital Menu"}
                  {data.city ? ` · ${data.city}` : ""}
                </p>
              </div>
            </div>

            {/* Mini QR */}
            <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-2.5">
              <div
                className="grid grid-cols-3 gap-0.5 rounded-lg p-1.5"
                style={{ background: dark ? "#fff" : "#111" }}
              >
                {Array.from({ length: 9 }).map((_, i) => (
                  <span
                    key={i}
                    className="h-1.5 w-1.5 rounded-[1px]"
                    style={{
                      background: [0, 2, 4, 6, 8].includes(i)
                        ? dark
                          ? "#111"
                          : "#fff"
                        : dark
                          ? "#999"
                          : "#555",
                    }}
                  />
                ))}
              </div>
              <div>
                <p className="text-[10px] font-medium opacity-70">Scan to order</p>
                <p className="text-[11px] font-semibold" style={{ color: accent }}>
                  QR Menu Ready
                </p>
              </div>
            </div>

            {/* Sample menu */}
            <div className="mt-4 space-y-2">
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: primary }}
              >
                Popular
              </p>
              {sampleItems.map((item) => (
                <div
                  key={item.name}
                  className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2.5"
                  style={{
                    background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)",
                  }}
                >
                  <span className={`${fontClass} text-xs font-medium`}>
                    {item.name}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: accent }}
                  >
                    {item.price} KD
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-3 h-3 w-[70%] rounded-full bg-gold/15 blur-xl" />
      <p className="mt-4 text-center text-xs text-white/35">
        Live menu preview
      </p>
    </motion.div>
  );
}

export function previewFromRestaurant(
  restaurant: {
    restaurant_name?: string | null;
    restaurant_type?: string | null;
    city?: string | null;
    logo_url?: string | null;
    cover_url?: string | null;
    theme_primary_color?: string | null;
    menu_accent_color?: string | null;
    font_style?: string | null;
    dark_mode_default?: boolean | null;
  } | null,
): OnboardingPreviewData {
  return {
    restaurantName: restaurant?.restaurant_name?.trim() ?? "",
    restaurantType: restaurant?.restaurant_type?.trim() ?? "",
    city: restaurant?.city?.trim() ?? "",
    logoUrl: restaurant?.logo_url?.trim() ?? "",
    coverUrl: restaurant?.cover_url?.trim() ?? "",
    themePrimaryColor: restaurant?.theme_primary_color?.trim() || "#d4af37",
    menuAccentColor: restaurant?.menu_accent_color?.trim() || "#d4af37",
    fontStyle: restaurant?.font_style?.trim() || "serif",
    darkModeDefault: restaurant?.dark_mode_default ?? true,
  };
}
