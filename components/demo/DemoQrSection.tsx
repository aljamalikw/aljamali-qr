"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { Language } from "@/lib/saffron-garden/types";
import { RESTAURANT, t } from "@/lib/saffron-garden/menu-data";

interface DemoQrSectionProps {
  lang: Language;
}

export function DemoQrSection({ lang }: DemoQrSectionProps) {
  const [menuUrl, setMenuUrl] = useState("https://aljamaliqr.com/demo");

  useEffect(() => {
    setMenuUrl(`${window.location.origin}/demo`);
  }, []);

  return (
    <section
      id="scan-qr"
      className="relative overflow-hidden border-y border-gold/10 bg-surface py-14 sm:py-20"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.06)_0%,transparent_60%)]" />

      <div className="relative mx-auto max-w-6xl px-4">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="text-center lg:text-start">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold">
              {t("qrEyebrow", lang)}
            </p>
            <h2 className="font-serif text-3xl font-bold text-white sm:text-4xl">
              {t("qrTitle", lang)}
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-white/55 sm:text-base lg:mx-0 mx-auto">
              {t("qrDescription", lang)}
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <div className="flex items-center gap-2 rounded-full border border-gold/15 bg-black/40 px-4 py-2 text-xs text-white/60">
                <span className="text-gold">✦</span>
                {t("qrFeature1", lang)}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-gold/15 bg-black/40 px-4 py-2 text-xs text-white/60">
                <span className="text-gold">✦</span>
                {t("qrFeature2", lang)}
              </div>
              <div className="flex items-center gap-2 rounded-full border border-gold/15 bg-black/40 px-4 py-2 text-xs text-white/60">
                <span className="text-gold">✦</span>
                {t("qrFeature3", lang)}
              </div>
            </div>
          </div>

          <div className="flex justify-center">
            <div className="qr-frame group relative rounded-3xl p-1">
              <div className="rounded-[22px] bg-black p-6 sm:p-8">
                <div className="mx-auto flex h-44 w-44 items-center justify-center rounded-2xl bg-white p-3 shadow-2xl shadow-gold/10 sm:h-52 sm:w-52">
                  <QRCodeSVG
                    value={menuUrl}
                    size={176}
                    level="M"
                    bgColor="#ffffff"
                    fgColor="#050505"
                    includeMargin={false}
                    className="h-full w-full"
                  />
                </div>

                <div className="mt-6 text-center">
                  <p className="font-serif text-lg font-semibold text-white">
                    {RESTAURANT.name[lang]}
                  </p>
                  <p className="mt-1 truncate text-xs text-white/40">{menuUrl}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
