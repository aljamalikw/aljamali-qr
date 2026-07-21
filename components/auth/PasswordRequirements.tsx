"use client";

import { motion } from "framer-motion";

interface PasswordRequirement {
  id: string;
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
}

function getRequirements(password: string): PasswordRequirement[] {
  return [
    { id: "length", label: "At least 8 characters", met: password.length >= 8 },
    {
      id: "upper",
      label: "One uppercase letter",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lower",
      label: "One lowercase letter",
      met: /[a-z]/.test(password),
    },
    { id: "number", label: "One number", met: /\d/.test(password) },
    {
      id: "special",
      label: "One special character",
      met: /[^a-zA-Z0-9]/.test(password),
    },
  ];
}

export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  if (!password) return null;

  const requirements = getRequirements(password);
  const metCount = requirements.filter((r) => r.met).length;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="rounded-xl border border-white/5 bg-black/20 p-3"
    >
      <p className="mb-2 text-xs font-medium text-white/45">
        Password requirements ({metCount}/{requirements.length})
      </p>
      <ul className="space-y-1.5">
        {requirements.map((req) => (
          <motion.li
            key={req.id}
            initial={false}
            animate={{ opacity: req.met ? 1 : 0.65 }}
            className="flex items-center gap-2 text-xs"
          >
            <span
              className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] transition-colors ${
                req.met
                  ? "bg-emerald-500/20 text-emerald-400"
                  : "bg-white/5 text-white/30"
              }`}
            >
              {req.met ? "✓" : "○"}
            </span>
            <span className={req.met ? "text-emerald-300/90" : "text-white/45"}>
              {req.label}
            </span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

export function meetsPasswordRequirements(password: string): boolean {
  return getRequirements(password).every((r) => r.met);
}
