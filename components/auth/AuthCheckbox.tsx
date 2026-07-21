"use client";

interface AuthCheckboxProps {
  id: string;
  label: React.ReactNode;
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

export function AuthCheckbox({
  id,
  label,
  checked,
  onChange,
  error,
}: AuthCheckboxProps) {
  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/5 bg-black/20 px-4 py-3 transition-colors hover:border-gold/15"
      >
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gold/30 bg-black text-gold focus:ring-gold/30"
        />
        <span className="text-sm leading-relaxed text-white/60">{label}</span>
      </label>
      {error && (
        <p className="text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
