"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { WhatsAppCampaignBuilder } from "@/components/dashboard/marketing/WhatsAppCampaignBuilder";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { DashboardCard } from "@/components/dashboard/ui/DashboardCard";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { isAdminRole } from "@/lib/auth/roles";
import { useAuthUser } from "@/lib/auth/use-auth-user";
import {
  backfillCustomersFromHistory,
  computeCustomerSummary,
  fetchCustomers,
  filterCustomers,
  formatCustomerMoney,
  paginateCustomers,
  type Customer,
  type CustomerFilter,
} from "@/lib/customers/queries";
import { formatDemoDate } from "@/lib/demo-requests/utils";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { planAllowsMarketing } from "@/lib/subscriptions/plans";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 10;

const FILTERS: { id: CustomerFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "VIP", label: "VIP" },
  { id: "Regular", label: "Regular" },
  { id: "Inactive", label: "Inactive" },
  { id: "High Spender", label: "High Spender" },
  { id: "Birthday", label: "Birthday" },
];

function TagChip({ tag }: { tag: string }) {
  return (
    <span className="inline-flex rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 text-[11px] text-gold">
      {tag}
    </span>
  );
}

export function CustomersManagement() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const { access } = useSubscriptionAccess();
  const { role } = useAuthUser();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<CustomerFilter>("all");
  const [birthdayMonth, setBirthdayMonth] = useState<number | "all">("all");
  const [page, setPage] = useState(1);
  const [campaignBuilderOpen, setCampaignBuilderOpen] = useState(false);

  const canCreateCampaign =
    isAdminRole(role) || planAllowsMarketing(access.plan);

  const load = useCallback(async (options?: { quiet?: boolean }) => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    if (!options?.quiet) {
      setLoading(true);
    }
    setError(null);

    if (!options?.quiet) {
      const backfill = await backfillCustomersFromHistory(restaurant.id);
      if (!backfill.ok) {
        // Non-fatal — table may not be migrated yet.
      }
    }

    const result = await fetchCustomers(restaurant.id);
    if (!options?.quiet) {
      setLoading(false);
    }
    if (!result.ok) {
      setError(result.message);
      setCustomers([]);
      return;
    }
    setCustomers(result.data);
  }, [restaurant?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!restaurant?.id) return;

    const channel = supabase
      .channel(`customers-dashboard-${restaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "customers",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => {
          void load({ quiet: true });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [restaurant?.id, load]);

  useEffect(() => {
    setPage(1);
  }, [search, filter, birthdayMonth]);

  const filtered = useMemo(
    () =>
      filterCustomers(customers, {
        search,
        filter,
        birthdayMonth,
      }),
    [customers, search, filter, birthdayMonth],
  );

  const summary = useMemo(
    () => computeCustomerSummary(customers),
    [customers],
  );

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateCustomers(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  if (restaurantLoading || loading) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Restaurant CRM built automatically from orders and reservations.
          </p>
        </header>
        <TableSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">
            Customers
          </h1>
          <p className="mt-1 text-sm text-white/45">
            Restaurant-scoped CRM — each restaurant owns its own customers.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {canCreateCampaign ? (
            <button
              type="button"
              onClick={() => setCampaignBuilderOpen(true)}
              className="menu-btn-primary shrink-0"
            >
              New Campaign
            </button>
          ) : (
            <Link
              href="/dashboard/subscription"
              className="menu-btn-secondary shrink-0"
              title="WhatsApp campaigns require Professional or Enterprise"
            >
              New Campaign
            </Link>
          )}
          <button
            type="button"
            onClick={() => void load()}
            className="menu-btn-secondary shrink-0"
          >
            Refresh
          </button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Customers", value: String(summary.customers) },
          {
            label: "Returning Customers",
            value: String(summary.returningCustomers),
          },
          {
            label: "Average Spend",
            value: formatCustomerMoney(summary.averageSpend),
          },
          {
            label: "Top Customer",
            value: summary.topCustomerName
              ? `${summary.topCustomerName}`
              : "—",
            sub: summary.topCustomerName
              ? formatCustomerMoney(summary.topCustomerSpent)
              : undefined,
          },
        ].map((card, index) => (
          <DashboardCard key={card.label} delay={index * 0.05} className="p-5">
            <p className="text-[11px] font-medium uppercase tracking-[0.15em] text-white/45">
              {card.label}
            </p>
            <p className="mt-2 font-serif text-2xl font-bold text-white sm:text-3xl">
              {card.value}
            </p>
            {card.sub ? (
              <p className="mt-1 text-xs text-gold/80">{card.sub}</p>
            ) : null}
          </DashboardCard>
        ))}
      </div>

      <DashboardCard className="space-y-4 p-4 sm:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, or email…"
            className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as CustomerFilter)}
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          >
            {FILTERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <select
            value={birthdayMonth === "all" ? "all" : String(birthdayMonth)}
            onChange={(e) =>
              setBirthdayMonth(
                e.target.value === "all" ? "all" : Number(e.target.value),
              )
            }
            className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white focus:border-gold/30 focus:outline-none"
          >
            <option value="all">Birthday month</option>
            {Array.from({ length: 12 }, (_, index) => (
              <option key={index + 1} value={String(index + 1)}>
                {new Date(2000, index, 1).toLocaleString("en", {
                  month: "long",
                })}
              </option>
            ))}
          </select>
          <p className="text-sm text-white/40">
            {filtered.length} customer{filtered.length === 1 ? "" : "s"}
          </p>
        </div>

        {error ? (
          <div className="py-10 text-center">
            <p className="text-sm text-white/50">{error}</p>
            <p className="mt-2 text-xs text-white/35">
              If this is a new deploy, apply the customers CRM migration in
              Supabase.
            </p>
            <button
              type="button"
              onClick={() => void load()}
              className="menu-btn-primary mt-4"
            >
              Try Again
            </button>
          </div>
        ) : pageItems.length === 0 ? (
          <p className="py-12 text-center text-sm text-white/45">
            {search || filter !== "all"
              ? "No customers match your filters."
              : "No customers yet. They appear automatically from orders and reservations."}
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {[
                      "Customer",
                      "Phone",
                      "Orders",
                      "Reservations",
                      "Total Spent",
                      "Last Visit",
                      "Tags",
                      "Actions",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-3 py-3 text-xs font-semibold uppercase tracking-wider text-white/40"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((customer) => (
                    <tr
                      key={customer.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-3 py-3">
                        <p className="text-sm font-medium text-white">
                          {customer.fullName?.trim() || "Guest"}
                        </p>
                        <p className="mt-0.5 text-xs text-white/40">
                          {customer.email || "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {customer.phone || "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {customer.totalOrders}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {customer.totalReservations}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/85">
                        {formatCustomerMoney(customer.totalSpent)}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {customer.lastVisit
                          ? formatDemoDate(customer.lastVisit)
                          : "—"}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex flex-wrap gap-1">
                          {customer.tags.length === 0 ? (
                            <span className="text-xs text-white/35">—</span>
                          ) : (
                            customer.tags.slice(0, 3).map((tag) => (
                              <TagChip key={tag} tag={tag} />
                            ))
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <Link
                          href={`/dashboard/customers/${customer.id}`}
                          className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 ? (
              <div className="flex items-center justify-between gap-3 pt-2">
                <p className="text-xs text-white/40">
                  Page {safePage} of {totalPages}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    className="menu-btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    disabled={safePage >= totalPages}
                    className="menu-btn-secondary !px-3 !py-1.5 text-xs disabled:opacity-40"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                  >
                    Next
                  </button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </DashboardCard>

      {restaurant?.id && canCreateCampaign ? (
        <WhatsAppCampaignBuilder
          open={campaignBuilderOpen}
          restaurantId={restaurant.id}
          restaurantName={restaurant.restaurant_name ?? "Restaurant"}
          plan={access.plan}
          bypassAdmin={isAdminRole(role)}
          onClose={() => setCampaignBuilderOpen(false)}
          onCreated={() => {
            showToast("Campaign created");
          }}
        />
      ) : null}
    </div>
  );
}
