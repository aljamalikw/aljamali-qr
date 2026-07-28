import Link from "next/link";
import type { ReactNode } from "react";

interface AuthFooterProps {
  children: ReactNode;
}

export function AuthFooter({ children }: AuthFooterProps) {
  return (
    <p className="mt-8 text-center text-sm text-white/45">{children}</p>
  );
}

export function AuthFooterLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="font-medium text-gold transition-colors hover:text-gold-light"
    >
      {children}
    </Link>
  );
}
