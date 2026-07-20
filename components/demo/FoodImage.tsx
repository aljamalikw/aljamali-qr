"use client";

import { useState } from "react";
import Image from "next/image";
import type { MenuCategory } from "@/lib/saffron-garden/types";
import { categories } from "@/lib/saffron-garden/menu-data";

interface FoodImageProps {
  src: string;
  alt: string;
  category: MenuCategory;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

function getCategoryIcon(category: MenuCategory): string {
  return categories.find((c) => c.id === category)?.icon ?? "🍽️";
}

export function FoodImage({
  src,
  alt,
  category,
  priority = false,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  className = "object-cover transition-transform duration-700 ease-out group-hover:scale-110",
}: FoodImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-surface-elevated via-surface to-black"
        aria-label={alt}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
        <span className="relative text-5xl opacity-80 drop-shadow-lg sm:text-6xl">
          {getCategoryIcon(category)}
        </span>
        <span className="relative mt-3 max-w-[80%] text-center text-[10px] font-medium uppercase tracking-[0.2em] text-gold/50">
          Saffron Garden
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
