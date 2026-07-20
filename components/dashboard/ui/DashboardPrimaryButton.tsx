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
}

export function DashboardPrimaryButton({
  children,
  icon,
  onClick,
  type = "button",
  className = "",
  variant = "default",
}: DashboardPrimaryButtonProps) {
  const isCta = variant === "cta";

  return (
    <motion.button
      type={type}
      onClick={onClick}
      whileHover={isCta ? { y: -2 } : { y: -1 }}
      whileTap={{ scale: 0.975 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className={
        isCta
          ? `dashboard-cta-primary ${className}`
          : `menu-btn-primary ${className}`
      }
    >
      {icon}
      {children}
    </motion.button>
  );
}
