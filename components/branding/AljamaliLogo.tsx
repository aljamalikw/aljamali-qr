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
    className: "h-20 w-auto max-w-[400px] sm:h-24 sm:max-w-[480px]",
  },
  navbar: {
    width: 400,
    height: 134,
    className:
      "h-[3.75rem] w-auto max-w-[280px] -my-3.5 sm:h-[4.375rem] sm:max-w-[348px] sm:-my-[15px] lg:h-20 lg:max-w-[400px] lg:-my-4",
  },
  sidebar: {
    width: 320,
    height: 108,
    className: "h-16 w-auto max-w-[228px] -my-3.5",
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
      className={`relative inline-block h-16 w-16 shrink-0 overflow-hidden rounded-lg -mx-1 -my-2.5 sm:h-16 sm:w-16 ${className}`}
    >
      <Image
        src={ALJAMALI_LOGO_SRC}
        alt={alt}
        fill
        priority={priority}
        className="object-cover object-left"
        sizes="64px"
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
      sizes="(max-width: 640px) 280px, 400px"
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
