import type { ReactNode } from "react";
import { ToggleSwitch } from "./ToggleSwitch";

interface SettingsSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function SettingsSection({
  title,
  description,
  children,
  className = "",
}: SettingsSectionProps) {
  return (
    <section className={`dashboard-card rounded-2xl p-5 sm:p-6 ${className}`}>
      <div className="mb-6 border-b border-gold/10 pb-5">
        <h2 className="font-serif text-xl font-bold text-white sm:text-2xl">
          {title}
        </h2>
        {description && (
          <p className="mt-1.5 text-sm text-white/45">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

interface SettingsFieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
  className?: string;
}

export function SettingsField({
  label,
  children,
  hint,
  className = "",
}: SettingsFieldProps) {
  return (
    <div className={className}>
      <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-white/45">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1.5 text-xs text-white/35">{hint}</p>}
    </div>
  );
}

export const settingsInputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 transition-colors focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function SettingsToggle({
  label,
  description,
  checked,
  onChange,
  compact = false,
  id,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  compact?: boolean;
  id?: string;
}) {
  const switchId = id ?? label.toLowerCase().replace(/\s+/g, "-");

  if (compact) {
    return (
      <div className="flex flex-col items-center gap-2">
        <ToggleSwitch
          id={switchId}
          checked={checked}
          onChange={onChange}
          aria-label={label}
        />
        <span className="text-xs font-medium text-white/60">{label}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-black/20 px-4 py-3.5 transition-all duration-200 hover:border-gold/15">
      <label htmlFor={switchId} className="min-w-0 cursor-pointer">
        <p className="text-sm font-medium text-white/80">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-white/40">{description}</p>
        )}
      </label>
      <ToggleSwitch
        id={switchId}
        checked={checked}
        onChange={onChange}
        aria-label={description ? `${label}: ${description}` : label}
      />
    </div>
  );
}
