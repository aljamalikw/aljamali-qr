"use client";

import { useState } from "react";

interface ListEditorProps {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  renderPreview?: (value: string) => React.ReactNode;
}

const inputClass =
  "w-full rounded-xl border border-gold/15 bg-black/30 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/40 focus:outline-none focus:ring-2 focus:ring-gold/15";

export function ListEditor({
  items,
  onChange,
  placeholder = "Add a value…",
  addLabel = "Add",
  renderPreview,
}: ListEditorProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const value = draft.trim();
    if (!value) return;
    onChange([...items, value]);
    setDraft("");
  };

  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li
              key={`${item}-${index}`}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2"
            >
              {renderPreview ? (
                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-gold/15 bg-black/30">
                  {renderPreview(item)}
                </div>
              ) : null}
              <span className="min-w-0 flex-1 truncate text-sm text-white/70">{item}</span>
              <button
                type="button"
                onClick={() => remove(index)}
                className="shrink-0 rounded-lg p-1.5 text-white/40 transition-colors hover:bg-red-500/10 hover:text-red-300"
                aria-label="Remove"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className={inputClass}
        />
        <button type="button" onClick={commit} className="menu-btn-secondary shrink-0 px-4 text-xs">
          {addLabel}
        </button>
      </div>
    </div>
  );
}
