"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import {
  ACTIVITY_ACTIONS,
  exportActivityLogsToCsv,
  fetchActivityFilterOptions,
  fetchActivityLogs,
  formatActivityAction,
  type ActivityFilterOptions,
  type ActivityLogRow,
} from "@/lib/admin/activity-log";
import { fetchIsSuperAdmin } from "@/lib/auth/get-user-role";
import {
  formatDemoDate,
  formatDemoDateTime,
} from "@/lib/demo-requests/utils";
import { supabase } from "@/lib/supabase";
import { csvTimestamp, downloadCsv } from "@/lib/utils/csv";

const PAGE_SIZE = 25;

function PrettyJson({ value }: { value: Record<string, unknown> }) {
  const text = JSON.stringify(value, null, 2);
  if (!text || text === "{}") {
    return <p className="text-sm text-white/40">—</p>;
  }
  return (
    <pre className="max-h-64 overflow-auto rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-emerald-200/90">
      {text}
    </pre>
  );
}

function DetailPanel({
  row,
  onClose,
}: {
  row: ActivityLogRow;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        className="h-full flex-1 cursor-default"
        aria-label="Close details"
        onClick={onClose}
      />
      <aside className="dashboard-card flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-gold/15 bg-[#0d0d0f] p-6 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-white/40">
              Activity Details
            </p>
            <h2 className="mt-1 font-serif text-xl font-bold text-white">
              {formatActivityAction(row.action)}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="menu-btn-secondary !px-3 !py-1.5 text-xs"
          >
            Close
          </button>
        </div>

        <div className="space-y-4 text-sm">
          <DetailRow label="Actor" value={row.actorName || row.actorEmail || "—"} />
          <DetailRow label="Email" value={row.actorEmail || "—"} />
          <DetailRow label="Role" value={row.actorRole || "—"} />
          <DetailRow
            label="Timestamp"
            value={formatDemoDateTime(row.createdAt)}
          />
          <DetailRow
            label="Restaurant"
            value={row.restaurantName || "—"}
          />
          <DetailRow label="Owner" value={row.ownerName || "—"} />
          <DetailRow label="Action" value={formatActivityAction(row.action)} />
          <DetailRow
            label="Entity"
            value={
              row.entityType
                ? `${row.entityType}${row.entityId ? ` · ${row.entityId}` : ""}`
                : "—"
            }
          />
          <DetailRow label="IP Address" value={row.ipAddress || "—"} />
          <DetailRow label="User Agent" value={row.userAgent || "—"} />

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">
              Previous values
            </p>
            <PrettyJson value={row.oldValues} />
          </div>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">
              New values
            </p>
            <PrettyJson value={row.newValues} />
          </div>
          <div>
            <p className="mb-2 text-[11px] uppercase tracking-wider text-white/40">
              Metadata
            </p>
            <PrettyJson value={row.metadata} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 px-4 py-3">
      <p className="text-[11px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <p className="mt-1 break-words text-white/85">{value}</p>
    </div>
  );
}

export function AdminActivityPage() {
  const { showToast } = useToast();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<ActivityLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [action, setAction] = useState<string>("all");
  const [actorEmail, setActorEmail] = useState("all");
  const [actorRole, setActorRole] = useState("all");
  const [restaurantId, setRestaurantId] = useState("all");
  const [ownerId, setOwnerId] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ActivityLogRow | null>(null);
  const [filterOptions, setFilterOptions] = useState<ActivityFilterOptions>({
    restaurants: [],
    owners: [],
    actors: [],
    roles: [],
  });

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

  useEffect(() => {
    setPage(1);
  }, [
    search,
    action,
    actorEmail,
    actorRole,
    restaurantId,
    ownerId,
    dateFrom,
    dateTo,
  ]);

  const loadFilters = useCallback(async () => {
    const result = await fetchActivityFilterOptions();
    if (result.ok) setFilterOptions(result.data);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const result = await fetchActivityLogs({
      search,
      action,
      actorEmail,
      actorRole,
      restaurantId,
      ownerId,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      page,
      pageSize: PAGE_SIZE,
    });
    setLoading(false);
    if (!result.ok) {
      showToast(result.message, "error");
      setRows([]);
      setTotal(0);
      return;
    }
    setRows(result.data);
    setTotal(result.total);
  }, [
    search,
    action,
    actorEmail,
    actorRole,
    restaurantId,
    ownerId,
    dateFrom,
    dateTo,
    page,
    showToast,
  ]);

  useEffect(() => {
    if (!allowed) return;
    void loadFilters();
    void load();
  }, [allowed, load, loadFilters]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(total / PAGE_SIZE)),
    [total],
  );

  if (allowed === null || (allowed && loading && rows.length === 0 && total === 0)) {
    return (
      <AdminPlaceholder
        title="Activity & Audit Log"
        description="Single source of truth for platform administrator and owner actions."
      >
        <TableSkeleton rows={6} />
      </AdminPlaceholder>
    );
  }

  if (!allowed) {
    return (
      <AdminPlaceholder
        title="Activity & Audit Log"
        description="Single source of truth for platform administrator and owner actions."
      >
        <p className="py-12 text-center text-sm text-white/50">
          Super Admin access required.
        </p>
      </AdminPlaceholder>
    );
  }

  return (
    <AdminPlaceholder
      title="Activity & Audit Log"
      description="Searchable audit trail for restaurants, subscriptions, menu, support, and impersonation."
    >
      <div className="space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search owner, restaurant, actor, email, action…"
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
            <option value="all">All actors</option>
            {filterOptions.actors.map((actor) => (
              <option key={actor.email} value={actor.email}>
                {actor.email}
              </option>
            ))}
          </select>
          <select
            value={actorRole}
            onChange={(e) => setActorRole(e.target.value)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          >
            <option value="all">All roles</option>
            {filterOptions.roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <select
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
            className="max-w-[220px] rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          >
            <option value="all">All owners</option>
            {filterOptions.owners.map((owner) => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>
          <select
            value={restaurantId}
            onChange={(e) => setRestaurantId(e.target.value)}
            className="max-w-[220px] rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          >
            <option value="all">All restaurants</option>
            {filterOptions.restaurants.map((restaurant) => (
              <option key={restaurant.id} value={restaurant.id}>
                {restaurant.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            aria-label="From date"
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            aria-label="To date"
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

        {loading ? (
          <TableSkeleton rows={5} />
        ) : rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/45">
            No activity logs match your filters.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto rounded-2xl border border-gold/15 bg-black/25">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {[
                      "Time",
                      "Actor",
                      "Role",
                      "Restaurant",
                      "Owner",
                      "Action",
                      "Entity",
                      "View Details",
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
                        <p>{formatDemoDate(row.createdAt)}</p>
                        <p className="mt-0.5 text-xs text-white/35">
                          {new Date(row.createdAt).toLocaleTimeString("en-GB", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/75">
                        <p>{row.actorName || "—"}</p>
                        <p className="mt-0.5 text-xs text-white/35">
                          {row.actorEmail || "—"}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-sm text-white/55">
                        {row.actorRole || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {row.restaurantName || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/70">
                        {row.ownerName || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gold">
                        {formatActivityAction(row.action)}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/55">
                        {row.entityType || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                          onClick={() => setSelected(row)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DemoRequestPagination
              page={Math.min(page, totalPages)}
              totalPages={totalPages}
              totalItems={total}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {selected ? (
        <DetailPanel row={selected} onClose={() => setSelected(null)} />
      ) : null}
    </AdminPlaceholder>
  );
}
