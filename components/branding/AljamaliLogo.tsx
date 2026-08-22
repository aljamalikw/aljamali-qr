import Image from "next/image";
import Link from "next/link";

/** Public path for the official Al Jamali QR logo (case-sensitive hosts). */
export const ALJAMALI_LOGO_SRC = "/images/aljamali-qr-logo.png";

export const ALJAMALI_BRAND_NAME = "Al Jamali QR";

export type AljamaliLogoVariant = "full" | "compact" | "navbar" | "sidebar";

type AljamaliLogoProps = {
  variant?: AljamaliLogoVariant;
  /** When true with `sidebar`, renders the compact AJ crop. */
  collapsed?: boolean;
  /** Wrap in a home link. Pass `null` to render without a link. Default `/`. */
  href?: string | null;
  priority?: boolean;
  className?: string;
  /** Accessible label; defaults to brand name. */
  alt?: string;
};

const FULL_SIZE: Record<
  Exclude<AljamaliLogoVariant, "compact">,
  { width: number; height: number; className: string }
> = {
  full: {
    width: 360,
    height: 120,
    className: "h-12 w-auto max-w-[240px] sm:h-14 sm:max-w-[280px]",
  },
  navbar: {
    width: 320,
    height: 108,
    className:
      "h-8 w-auto max-w-[168px] sm:h-10 sm:max-w-[200px] lg:h-12 lg:max-w-[240px]",
  },
  sidebar: {
    width: 280,
    height: 94,
    className: "h-9 w-auto max-w-[180px]",
  },
};

/**
 * Official Al Jamali QR brand mark.
 * - `full` / `navbar` / `sidebar`: complete horizontal logo
 * - `compact`: left-cropped AJ monogram for tight spaces
 */
export function AljamaliLogo({
  variant = "full",
  collapsed = false,
  href = "/",
  priority = false,
  className = "",
  alt = ALJAMALI_BRAND_NAME,
}: AljamaliLogoProps) {
  const useCompact = variant === "compact" || (variant === "sidebar" && collapsed);

  const sizeKey =
    variant === "navbar" || variant === "sidebar" ? variant : "full";
  const size = FULL_SIZE[sizeKey];

  const mark = useCompact ? (
    <span
      className={`relative inline-block h-9 w-9 shrink-0 overflow-hidden rounded-lg sm:h-10 sm:w-10 ${className}`}
    >
      <Image
        src={ALJAMALI_LOGO_SRC}
        alt={alt}
        fill
        priority={priority}
        className="object-cover object-left"
        sizes="40px"
      />
    </span>
  ) : (
    <Image
      src={ALJAMALI_LOGO_SRC}
      alt={alt}
      width={size.width}
      height={size.height}
      priority={priority}
      className={`object-contain ${size.className} ${className}`}
      sizes="(max-width: 640px) 168px, 240px"
    />
  );

  if (href === null) {
    return mark;
  }

  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
      aria-label={`${ALJAMALI_BRAND_NAME} home`}
    >
      {mark}
    </Link>
  );
}
