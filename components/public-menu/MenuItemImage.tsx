"use client";

import { useState } from "react";

interface MenuItemImageProps {
  src: string;
  alt: string;
  fallbackIcon?: string;
}

export function MenuItemImage({
  src,
  alt,
  fallbackIcon = "🍽️",
}: MenuItemImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        className="relative flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-surface-elevated via-surface to-black"
        aria-label={alt}
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(212,175,55,0.08)_0%,transparent_70%)]" />
        <span className="relative text-4xl opacity-80 drop-shadow-lg">
          {fallbackIcon}
        </span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
      loading="lazy"
      onError={() => setHasError(true)}
    />
  );
}
