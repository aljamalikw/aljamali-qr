"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  filterRewardTemplates,
  getMostPopularTemplates,
  REWARD_TEMPLATE_CATEGORY_ICONS,
  REWARD_TEMPLATE_CATEGORY_LABELS,
  REWARD_TEMPLATE_CATEGORY_ORDER,
  REWARD_TEMPLATES,
  type RewardTemplate,
} from "@/lib/loyalty/reward-templates";

type RewardTemplatePickerProps = {
  onSelectTemplate: (template: RewardTemplate) => void;
  onSelectCustom: () => void;
};

type PickerColumn = {
  key: string;
  label: string;
  icon: string;
  items: RewardTemplate[];
};

function RewardTemplateCard({
  template,
  onSelect,
}: {
  template: RewardTemplate;
  onSelect: (template: RewardTemplate) => void;
}) {
  return (
    <button
      type="button"
      role="option"
      onClick={() => onSelect(template)}
      className="group flex w-full cursor-pointer flex-col gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-3.5 text-start transition-all duration-200 hover:border-gold/45 hover:bg-white/[0.07] focus-visible:border-gold/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-black/35 text-lg transition group-hover:border-gold/30"
            aria-hidden="true"
          >
            {template.icon}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold text-white">
              {template.name}
            </span>
            <span className="mt-1 block text-xs leading-relaxed text-white/45">
              {template.description}
            </span>
          </span>
        </div>
        <span className="shrink-0 rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-[11px] font-medium text-gold">
          {template.pointsRequired} pts
        </span>
      </div>
    </button>
  );
}

export function RewardTemplatePicker({
  onSelectTemplate,
  onSelectCustom,
}: RewardTemplatePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listboxId = useId();

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(
    () => filterRewardTemplates(REWARD_TEMPLATES, search),
    [search],
  );

  const columns = useMemo((): PickerColumn[] => {
    const popular = filterRewardTemplates(
      getMostPopularTemplates(REWARD_TEMPLATES),
      search,
    );

    const categoryColumns = REWARD_TEMPLATE_CATEGORY_ORDER.map((category) => ({
      key: category,
      label: REWARD_TEMPLATE_CATEGORY_LABELS[category],
      icon: REWARD_TEMPLATE_CATEGORY_ICONS[category],
      items: filtered.filter((t) => t.category === category),
    }));

    return [
      {
        key: "most_popular",
        label: "Most Popular",
        icon: REWARD_TEMPLATE_CATEGORY_ICONS.most_popular,
        items: popular,
      },
      ...categoryColumns,
    ].filter((column) => column.items.length > 0 || !search.trim());
  }, [filtered, search]);

  const hasResults = columns.some((column) => column.items.length > 0);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      const id = window.setTimeout(() => searchRef.current?.focus(), 40);
      return () => window.clearTimeout(id);
    }
    setSearch("");
  }, [open]);

  const selectTemplate = (template: RewardTemplate) => {
    onSelectTemplate(template);
    setOpen(false);
  };

  const selectCustom = () => {
    onSelectCustom();
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="menu-btn-primary inline-flex w-full items-center justify-between gap-2 sm:w-auto"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
      >
        <span>⭐ Create Reward</span>
        <span className="text-xs opacity-80" aria-hidden="true">
          {open ? "▴" : "▾"}
        </span>
      </button>

      {mounted
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <div className="fixed inset-0 z-[80]">
                  <motion.button
                    type="button"
                    aria-label="Close reward templates"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                    className="absolute inset-0 bg-black/55 backdrop-blur-[2px]"
                    onClick={() => setOpen(false)}
                  />

                  <div className="pointer-events-none absolute inset-0 flex items-start justify-center overflow-y-auto px-3 py-6 sm:px-6 sm:py-10">
                    <motion.div
                      ref={panelRef}
                      id={listboxId}
                      role="dialog"
                      aria-modal="true"
                      aria-label="Reward templates"
                      initial={{ opacity: 0, y: 12, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.98 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="pointer-events-auto flex w-full max-w-[960px] flex-col overflow-hidden rounded-2xl border border-gold/30 bg-[#12100c] shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
                      style={{ maxHeight: "min(600px, calc(100vh - 3rem))" }}
                    >
                      <div className="shrink-0 border-b border-white/10 px-5 py-4 sm:px-6">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold/85">
                              Reward templates
                            </p>
                            <p className="mt-1 text-sm text-white/45">
                              Choose a ready-made reward, then edit before
                              saving.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-white/55 transition hover:border-white/20 hover:text-white"
                          >
                            Esc
                          </button>
                        </div>
                        <label className="mt-4 block">
                          <span className="sr-only">Search reward templates</span>
                          <input
                            ref={searchRef}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search reward templates..."
                            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/20"
                          />
                        </label>
                      </div>

                      <div
                        role="listbox"
                        aria-label="Template categories"
                        className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6"
                      >
                        {!hasResults ? (
                          <p className="py-16 text-center text-sm text-white/45">
                            No templates match your search.
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                            {columns.map((column) => (
                              <section key={column.key} className="min-w-0">
                                <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                                  <span aria-hidden="true">{column.icon}</span>
                                  {column.label}
                                </h3>
                                {column.items.length === 0 ? (
                                  <p className="rounded-xl border border-dashed border-white/10 px-3 py-6 text-center text-xs text-white/35">
                                    No matches
                                  </p>
                                ) : (
                                  <ul className="space-y-2.5">
                                    {column.items.map((template) => (
                                      <li key={`${column.key}-${template.id}`}>
                                        <RewardTemplateCard
                                          template={template}
                                          onSelect={selectTemplate}
                                        />
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </section>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0 border-t border-white/10 bg-black/25 px-4 py-3 sm:px-6">
                        <button
                          type="button"
                          onClick={selectCustom}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-sm font-semibold text-gold transition hover:border-gold/50 hover:bg-gold/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
                        >
                          <span aria-hidden="true">+</span>
                          Create Custom Reward
                        </button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </div>
  );
}
