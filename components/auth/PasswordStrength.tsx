"use client";

import { motion } from "framer-motion";
import { getPasswordStrength, type PasswordStrengthLevel } from "@/lib/auth/utils";

interface PasswordStrengthProps {
  password: string;
}

const barColors: Record<PasswordStrengthLevel, string> = {
  weak: "bg-red-500",
  fair: "bg-amber-500",
  good: "bg-emerald-500",
  strong: "bg-gold",
};

const textColors: Record<PasswordStrengthLevel, string> = {
  weak: "text-red-400",
  fair: "text-amber-400",
  good: "text-emerald-400",
  strong: "text-gold",
};

export function PasswordStrength({ password }: PasswordStrengthProps) {
  if (!password) return null;

  const { level, score, label } = getPasswordStrength(password);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-2"
    >
      <div className="flex h-1.5 overflow-hidden rounded-full bg-white/10">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${barColors[level]}`}
        />
      </div>
      <p className={`text-xs font-medium ${textColors[level]}`}>
        Password strength: {label}
      </p>
    </motion.div>
  );
}
