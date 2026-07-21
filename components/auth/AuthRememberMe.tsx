"use client";

interface AuthRememberMeProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export function AuthRememberMe({ checked, onChange }: AuthRememberMeProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-3 rounded-xl border border-white/5 bg-black/20 px-3 py-2 transition-all duration-200 hover:border-gold/20"
    >
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-md border transition-all duration-200 ${
          checked
            ? "border-gold bg-gold text-black"
            : "border-gold/30 bg-black group-hover:border-gold/50"
        }`}
      >
        {checked && (
          <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2 6l3 3 5-5" />
          </svg>
        )}
      </span>
      <span className="text-sm text-white/60 group-hover:text-white/80">
        Remember me
      </span>
    </button>
  );
}
