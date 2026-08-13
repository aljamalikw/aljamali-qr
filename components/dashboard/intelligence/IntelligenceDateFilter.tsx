"use client";

import {
  INTELLIGENCE_RANGE_OPTIONS,
  type IntelligenceRangeId,
} from "@/lib/intelligence/ranges";

type Props = {
  value: IntelligenceRangeId;
  onChange: (id: IntelligenceRangeId) => void;
  customStart: string;
  customEnd: string;
  onCustomStart: (v: string) => void;
  onCustomEnd: (v: string) => void;
};

export function IntelligenceDateFilter({
  value,
  onChange,
  customStart,
  customEnd,
  onCustomStart,
  onCustomEnd,
}: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {INTELLIGENCE_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              value === opt.id
                ? "border-gold/40 bg-gold/15 text-gold"
                : "border-white/10 bg-white/5 text-white/60 hover:border-gold/25 hover:text-white"
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange("custom")}
          className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
            value === "custom"
              ? "border-gold/40 bg-gold/15 text-gold"
              : "border-white/10 bg-white/5 text-white/60 hover:border-gold/25 hover:text-white"
          }`}
        >
          Custom
        </button>
      </div>
      {value === "custom" ? (
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={customStart}
            onChange={(e) => onCustomStart(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-white"
          />
          <input
            type="date"
            value={customEnd}
            onChange={(e) => onCustomEnd(e.target.value)}
            className="rounded-lg border border-white/10 bg-black/20 px-3 py-1.5 text-sm text-white"
          />
        </div>
      ) : null}
    </div>
  );
}
