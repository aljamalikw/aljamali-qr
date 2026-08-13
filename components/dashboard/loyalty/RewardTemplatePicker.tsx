"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  filterRewardTemplates,
  REWARD_TEMPLATE_CATEGORY_LABELS,
  REWARD_TEMPLATE_CATEGORY_ORDER,
  REWARD_TEMPLATES,
  type RewardTemplate,
} from "@/lib/loyalty/reward-templates";

type RewardTemplatePickerProps = {
  onSelectTemplate: (template: RewardTemplate) => void;
  onSelectCustom: () => void;
};

export function RewardTemplatePicker({
  onSelectTemplate,
  onSelectCustom,
}: RewardTemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(
    () => filterRewardTemplates(REWARD_TEMPLATES, search),
    [search],
  );

  const grouped = useMemo(() => {
    return REWARD_TEMPLATE_CATEGORY_ORDER.map((category) => ({
      category,
      label: REWARD_TEMPLATE_CATEGORY_LABELS[category],
      items: filtered.filter((t) => t.category === category),
    })).filter((group) => group.items.length > 0);
  }, [filtered]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => searchRef.current?.focus(), 0);
      return () => window.clearTimeout(id);
    }
    setSearch("");
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="menu-btn-primary inline-flex w-full items-center justify-between gap-2 sm:w-auto"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>⭐ Create Reward</span>
        <span className="text-xs opacity-80" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {open ? (
        <div
          role="listbox"
          aria-label="Reward templates"
          className="absolute start-0 z-30 mt-2 w-[min(100vw-2rem,26rem)] overflow-hidden rounded-2xl border border-gold/20 bg-[#12100c] shadow-2xl shadow-black/50"
        >
          <div className="border-b border-white/10 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold/80">
              ⭐ Reward Templates
            </p>
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
            />
          </div>

          <div className="max-h-[min(60vh,22rem)] overflow-y-auto py-1">
            {grouped.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-white/45">
                No templates match your search.
              </p>
            ) : (
              grouped.map((group) => (
                <div key={group.category} className="py-1">
                  <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                    {group.label}
                  </p>
                  <ul className="space-y-0.5 px-1.5">
                    {group.items.map((template) => (
                      <li key={template.id}>
                        <button
                          type="button"
                          role="option"
                          onClick={() => {
                            onSelectTemplate(template);
                            setOpen(false);
                          }}
                          className="flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-start transition hover:bg-gold/10"
                        >
                          <span
                            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-black/30 text-lg"
                            aria-hidden="true"
                          >
                            {template.icon}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-white">
                              {template.name}
                            </span>
                            <span className="mt-0.5 block text-xs leading-relaxed text-white/45">
                              {template.description}
                            </span>
                            <span className="mt-1 block text-[11px] text-gold/80">
                              {template.pointsRequired} pts ·{" "}
                              {template.rewardType.replaceAll("_", " ")}
                            </span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}

            <div className="mt-1 border-t border-white/10 py-1">
              <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">
                {REWARD_TEMPLATE_CATEGORY_LABELS.custom}
              </p>
              <div className="px-1.5 pb-1">
                <button
                  type="button"
                  role="option"
                  onClick={() => {
                    onSelectCustom();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-start transition hover:bg-gold/10"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/10 text-lg"
                    aria-hidden="true"
                  >
                    ➕
                  </span>
                  <span>
                    <span className="block text-sm font-medium text-white">
                      Create Custom Reward…
                    </span>
                    <span className="mt-0.5 block text-xs text-white/45">
                      Start from a blank form and set your own details.
                    </span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
