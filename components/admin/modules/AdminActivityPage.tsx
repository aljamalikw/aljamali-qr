"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  ACTIVITY_ACTIONS,
  exportActivityLogsToCsv,
  fetchActivityLogs,
  formatActivityAction,
  type ActivityLogRow,
} from "@/lib/admin/activity-log";
import { fetchIsSuperAdmin } from "@/lib/auth/get-user-role";
import { formatDemoDate } from "@/lib/demo-requests/utils";
import { supabase } from "@/lib/supabase";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";

export function AdminActivityPage() {
  const { showToast } = useToast();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");
  const [actorEmail, setActorEmail] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const isSuper = await fetchIsSuperAdmin(session?.user ?? null);
      if (mounted) setAllowed(isSuper);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchActivityLogs({
      search,
      action,
      actorEmail,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
    });
    setLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      setRows([]);
      return;
    }
    setRows(result.data);
  }, [search, action, actorEmail, dateFrom, dateTo, showToast]);

  useEffect(() => {
    if (allowed) void load();
  }, [allowed, load]);

  const actors = useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      if (row.actorEmail) set.add(row.actorEmail);
    }
    return [...set].sort();
  }, [rows]);

  if (allowed === null || (allowed && loading && rows.length === 0)) {
    return (
      <AdminPlaceholder
        title="Activity Log"
        description="Audit trail of Super Admin and platform actions."
      >
        <TableSkeleton rows={6} />
      </AdminPlaceholder>
    );
  }

  if (!allowed) {
    return (
      <AdminPlaceholder
        title="Activity Log"
        description="Audit trail of Super Admin and platform actions."
      >
        <p className="py-12 text-center text-sm text-white/50">
          Super Admin access required.
        </p>
      </AdminPlaceholder>
    );
  }

  return (
    <AdminPlaceholder
      title="Activity Log"
      description="Searchable audit trail for restaurants, subscriptions, and impersonation."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search action, admin, restaurant…"
            className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
          />
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          >
            <option value="all">All actions</option>
            {ACTIVITY_ACTIONS.map((value) => (
              <option key={value} value={value}>
                {formatActivityAction(value)}
              </option>
            ))}
          </select>
          <select
            value={actorEmail}
            onChange={(e) => setActorEmail(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          >
            <option value="all">All admins</option>
            {actors.map((email) => (
              <option key={email} value={email}>
                {email}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          />
          <button
            type="button"
            className="menu-btn-secondary"
            onClick={() => {
              const csv = exportActivityLogsToCsv(rows);
              downloadCsv(`activity-${csvTimestamp()}.csv`, csv);
              showToast(`Exported ${rows.length} log rows`);
            }}
          >
            Export CSV
          </button>
        </div>

        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/45">
            No activity logs match your filters.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-gold/15 bg-black/25">
            <table className="w-full min-w-[980px] text-left">
              <thead>
                <tr className="border-b border-gold/10">
                  {[
                    "Timestamp",
                    "Admin",
                    "Restaurant",
                    "Action",
                    "IP",
                    "Reason",
                    "Details",
                  ].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 text-sm text-white/60">
                      {formatDemoDate(row.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/75">
                      {row.actorEmail || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/70">
                      {row.restaurantName || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gold">
                      {formatActivityAction(row.action)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/45">
                      {row.ipAddress || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/55">
                      {row.reason || "—"}
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-xs text-white/40">
                      {JSON.stringify(row.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminPlaceholder>
  );
}
