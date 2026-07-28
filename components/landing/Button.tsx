"use client";

import Link from "next/link";
import { useCallback, useState, type MouseEvent, type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps {
  href?: string;
  variant?: ButtonVariant;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

const variants: Record<ButtonVariant, string> = {
  primary:
    "cursor-pointer bg-gradient-to-r from-[#e8c547] via-gold to-[#b8942e] text-black shadow-lg shadow-gold/25 hover:scale-[1.03] hover:shadow-gold/45 active:scale-[0.98]",
  secondary:
    "cursor-pointer border border-gold/40 bg-black/40 text-white hover:border-gold hover:bg-black/60 hover:text-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.15)] active:scale-[0.98]",
  outline:
    "cursor-pointer border border-white/20 bg-transparent text-white hover:border-gold/50 hover:text-gold active:scale-[0.98]",
};

function RippleSurface({
  href,
  variant = "primary",
  children,
  className = "",
  onClick,
}: ButtonProps) {
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);

  const spawnRipple = useCallback((event: MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { id, x, y }]);
    window.setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);
  }, []);

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    spawnRipple(event);
    onClick?.();
  };

  const base =
    "relative inline-flex items-center justify-center overflow-hidden rounded-xl px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

  const classes = `${base} ${variants[variant]} ${className}`;

  const rippleLayer = (
    <>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute h-0 w-0 animate-[landing-ripple_600ms_ease-out_forwards] rounded-full bg-white/25"
          style={{ left: ripple.x, top: ripple.y }}
          aria-hidden="true"
        />
      ))}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} onClick={handleClick}>
        {rippleLayer}
        <span className="relative z-[1]">{children}</span>
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={classes}>
      {rippleLayer}
      <span className="relative z-[1]">{children}</span>
    </button>
  );
}

export function Button(props: ButtonProps) {
  return <RippleSurface {...props} />;
}
