"use client";

import { useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { emailTemplateRegistry } from "@/lib/email-templates/registry";

export function AdminEmailTemplatesPage() {
  const [activeId, setActiveId] = useState(emailTemplateRegistry[0]?.id ?? "");

  const active = useMemo(
    () => emailTemplateRegistry.find((entry) => entry.id === activeId),
    [activeId],
  );

  const html = useMemo(() => active?.render() ?? "", [active]);

  return (
    <AdminPlaceholder
      title="Email Templates"
      description="Read-only preview of every branded transactional email."
    >
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Email templates" className="space-y-1.5">
          {emailTemplateRegistry.map((entry) => {
            const isActive = entry.id === activeId;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setActiveId(entry.id)}
                aria-current={isActive ? "true" : undefined}
                className={`w-full rounded-xl border px-4 py-3 text-start transition-colors ${
                  isActive
                    ? "border-gold/40 bg-gold/10 text-gold"
                    : "border-white/10 bg-black/20 text-white/70 hover:border-gold/25 hover:text-white"
                }`}
              >
                <p className="text-sm font-semibold">{entry.label}</p>
                <p className="mt-0.5 text-xs text-white/40">
                  {entry.description}
                </p>
              </button>
            );
          })}
        </nav>

        <div className="overflow-hidden rounded-2xl border border-gold/15 bg-black/20">
          <div className="flex items-center justify-between border-b border-gold/10 bg-black/30 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
              Preview — {active?.label ?? ""}
            </p>
          </div>
          <iframe
            key={activeId}
            title={`${active?.label ?? "Email"} preview`}
            srcDoc={html}
            sandbox=""
            className="h-[720px] w-full bg-[#050505]"
          />
        </div>
      </div>
    </AdminPlaceholder>
  );
}
