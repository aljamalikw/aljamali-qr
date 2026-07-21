"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface DashboardPrimaryButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
  variant?: "default" | "cta";
  loading?: boolean;
  disabled?: boolean;
}

function Spinner() {
  return (
    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black" />
  );
}

export function DashboardPrimaryButton({
  children,
  icon,
  onClick,
  type = "button",
  className = "",
  variant = "default",
  loading = false,
  disabled = false,
}: DashboardPrimaryButtonProps) {
  const isCta = variant === "cta";
  const isDisabled = disabled || loading;

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileHover={!isDisabled ? (isCta ? { y: -2 } : { y: -1 }) : undefined}
      whileTap={!isDisabled ? { scale: 0.975 } : undefined}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={
        isCta
          ? `dashboard-cta-primary disabled:cursor-not-allowed disabled:opacity-60 ${className}`
          : `menu-btn-primary disabled:cursor-not-allowed disabled:opacity-60 ${className}`
      }
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Spinner />
          {children}
        </span>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </motion.button>
  );
}
