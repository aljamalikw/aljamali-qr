"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { logAdminActivity } from "@/lib/admin/activity-log";
import {
  fetchEmailTemplates,
  queueEmailNotification,
  renderTemplatePreview,
  updateEmailTemplate,
  type EmailTemplateRecord,
} from "@/lib/email/framework";
import { emailTemplateRegistry } from "@/lib/email-templates/registry";

export function AdminEmailTemplatesPage() {
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<EmailTemplateRecord[]>([]);
  const [activeId, setActiveId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [draft, setDraft] = useState({
    subject: "",
    bodyHtml: "",
    enabled: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchEmailTemplates();
    setLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    setTemplates(result.data);
    const first = result.data[0]?.id ?? emailTemplateRegistry[0]?.id ?? "";
    setActiveId((current) => current || first);
  }, [showToast]);

  useEffect(() => {
    void load();
  }, [load]);

  const active = useMemo(
    () => templates.find((entry) => entry.id === activeId) ?? null,
    [templates, activeId],
  );

  useEffect(() => {
    if (!active) return;
    setDraft({
      subject: active.subject,
      bodyHtml: active.bodyHtml,
      enabled: active.enabled,
    });
  }, [active]);

  const previewHtml = useMemo(() => {
    if (!active) return "";
    // Prefer live draft for editable templates; fall back to registry HTML when body is plain.
    if (draft.bodyHtml.includes("<html") || draft.bodyHtml.length > 40) {
      return renderTemplatePreview({
        ...active,
        subject: draft.subject,
        bodyHtml: draft.bodyHtml,
      });
    }
    const legacy = emailTemplateRegistry.find((entry) => entry.id === activeId);
    return legacy?.render() ?? renderTemplatePreview(active);
  }, [active, draft, activeId]);

  const handleSave = async () => {
    if (!active) return;
    setSaving(true);
    const result = await updateEmailTemplate({
      id: active.id,
      subject: draft.subject,
      bodyHtml: draft.bodyHtml,
      enabled: draft.enabled,
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    void logAdminActivity({
      action: "email_template_updated",
      details: { templateId: active.id },
    });
    showToast("Template saved");
    await load();
  };

  const handleTest = async () => {
    if (!active || !testEmail.trim()) {
      showToast("Enter a test email address.", "error");
      return;
    }
    setSaving(true);
    const result = await queueEmailNotification({
      templateId: active.id,
      toEmail: testEmail.trim(),
      subject: draft.subject,
      bodyHtml: draft.bodyHtml,
      asPreview: false,
      meta: { kind: "test" },
    });
    setSaving(false);
    if (!result.ok) {
      showToast(result.message, "error");
      return;
    }
    void logAdminActivity({
      action: "test_email_queued",
      details: { templateId: active.id, to: testEmail.trim() },
    });
    showToast("Test email queued (framework outbox — no provider connected)");
  };

  if (loading) {
    return (
      <AdminPlaceholder
        title="Email Templates"
        description="Preview, edit, and queue branded transactional emails."
      >
        <TableSkeleton rows={4} />
      </AdminPlaceholder>
    );
  }

  return (
    <AdminPlaceholder
      title="Email Templates"
      description="Reusable notification framework. Provider integration is not connected yet — test sends go to the outbox."
    >
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Email templates" className="space-y-1.5">
          {templates.map((entry) => {
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
                <p className="mt-0.5 text-xs text-white/40">{entry.description}</p>
              </button>
            );
          })}
        </nav>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-gold/15 bg-black/20">
            <div className="flex items-center justify-between border-b border-gold/10 bg-black/30 px-4 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/40">
                Preview — {active?.label ?? ""}
              </p>
            </div>
            <iframe
              key={`${activeId}-${draft.subject}`}
              title={`${active?.label ?? "Email"} preview`}
              srcDoc={previewHtml}
              sandbox=""
              className="h-[420px] w-full bg-[#050505]"
            />
          </div>

          {active ? (
            <div className="rounded-2xl border border-gold/15 bg-black/20 p-5">
              <h3 className="font-serif text-lg text-white">Edit template</h3>
              <label className="mt-4 block text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">
                  Subject
                </span>
                <input
                  value={draft.subject}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-white focus:border-gold/35 focus:outline-none"
                />
              </label>
              <label className="mt-4 block text-sm">
                <span className="mb-1.5 block text-xs uppercase tracking-wider text-white/40">
                  Body HTML
                </span>
                <textarea
                  value={draft.bodyHtml}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, bodyHtml: e.target.value }))
                  }
                  rows={8}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 font-mono text-xs text-white focus:border-gold/35 focus:outline-none"
                />
              </label>
              <label className="mt-4 flex items-center gap-2 text-sm text-white/70">
                <input
                  type="checkbox"
                  checked={draft.enabled}
                  onChange={(e) =>
                    setDraft((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                />
                Enabled
              </label>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  className="menu-btn-primary"
                  disabled={saving}
                  onClick={() => void handleSave()}
                >
                  {saving ? "Saving…" : "Save template"}
                </button>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                  className="flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm text-white focus:border-gold/35 focus:outline-none"
                />
                <button
                  type="button"
                  className="menu-btn-secondary"
                  disabled={saving}
                  onClick={() => void handleTest()}
                >
                  Send test
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </AdminPlaceholder>
  );
}
