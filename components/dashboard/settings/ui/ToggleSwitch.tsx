"use client";

interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  "aria-label"?: string;
  disabled?: boolean;
}

export function ToggleSwitch({
  checked,
  onChange,
  id,
  "aria-label": ariaLabel,
  disabled = false,
}: ToggleSwitchProps) {
  const toggle = () => {
    if (!disabled) onChange(!checked);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      toggle();
    }
  };

  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={toggle}
      onKeyDown={handleKeyDown}
      className={`relative h-6 w-11 shrink-0 rounded-full p-0.5 transition-colors duration-250 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-gold" : "bg-neutral-700"
      }`}
    >
      <span
        aria-hidden="true"
        className={`block h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-250 ease-out ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
