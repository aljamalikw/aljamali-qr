"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AuthButtonProps {
  children: ReactNode;
  type?: "button" | "submit";
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary";
  onClick?: () => void;
  className?: string;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-90" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function AuthButton({
  children,
  type = "button",
  loading = false,
  disabled = false,
  variant = "primary",
  onClick,
  className = "",
}: AuthButtonProps) {
  const isPrimary = variant === "primary";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={!disabled && !loading ? { y: -2 } : undefined}
      whileTap={!disabled && !loading ? { scale: 0.975 } : undefined}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={`w-full ${
        isPrimary ? "auth-btn-primary" : "auth-btn-secondary"
      } disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <Spinner />
          <span>{children}</span>
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
