"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";
import { DemoRequestPagination } from "@/components/admin/demo-requests/DemoRequestPagination";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastProvider";
import { ExportMenu } from "@/components/dashboard/ExportMenu";
import {
  canTransitionPaymentStatus,
  requiresPaymentTransitionConfirm,
} from "@/lib/admin/payment-transitions";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/admin/payment-management";
import {
  createManualPaymentViaAdminApi,
  updatePaymentViaAdminApi,
} from "@/lib/admin/payments-client";
import {
  buildPaymentExportDataset,
  displayInvoice,
  fetchPayments,
  filterPayments,
  formatPaymentAmount,
  formatPaymentMethod,
  isManualPaymentEntry,
  PAYMENT_STATUSES,
  type PaymentItem,
  type PaymentStatus,
} from "@/lib/admin/payments";
import {
  fetchOwnerSubscriptionAccounts,
  type OwnerSubscriptionAccount,
} from "@/lib/admin/subscriptions";
import {
  formatDemoDate,
  paginateDemoRequests,
} from "@/lib/demo-requests/utils";
import {
  formatPlanPriceLabel,
  getPlanMonthlyAmount,
} from "@/lib/subscriptions/plans";
import { getCatalogMonthlyPrices } from "@/lib/subscriptions/pricing";

const PAGE_SIZE = 10;

function normalizePlan(plan: string): "Starter" | "Professional" | "Enterprise" {
  if (plan === "Professional" || plan === "Enterprise") return plan;
  return "Starter";
}

function statusClass(status: PaymentStatus): string {
  switch (status) {
    case "paid":
      return "text-emerald-300";
    case "pending":
      return "text-amber-300";
    case "overdue":
      return "text-orange-300";
    case "refunded":
      return "text-sky-300";
    case "failed":
      return "text-red-300";
    default:
      return "text-white/60";
  }
}

function allowedNextStatuses(current: PaymentStatus): PaymentStatus[] {
  return PAYMENT_STATUSES.filter(
    (status) => status !== current && canTransitionPaymentStatus(current, status),
  );
}

export function AdminPaymentsPage() {
  const { showToast } = useToast();
  const editTriggerRef = useRef<HTMLButtonElement | null>(null);
  const [items, setItems] = useState<PaymentItem[]>([]);
  const [owners, setOwners] = useState<OwnerSubscriptionAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<PaymentStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<PaymentItem | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<PaymentStatus>("pending");
  const [nextMethod, setNextMethod] = useState("manual");
  const [nextReference, setNextReference] = useState("");
  const [nextNotes, setNextNotes] = useState("");
  const [nextPaidAt, setNextPaidAt] = useState("");
  const [confirmRefund, setConfirmRefund] = useState(false);
  const [selectedOwnerId, setSelectedOwnerId] = useState("");
  const [createAmount, setCreateAmount] = useState("");
  const [createMethod, setCreateMethod] = useState("manual");
  const [createStatus, setCreateStatus] = useState<PaymentStatus>("paid");
  const [createReference, setCreateReference] = useState("");
  const [createNotes, setCreateNotes] = useState("");
  const [createPaidAt, setCreatePaidAt] = useState("");
  const planPrices = getCatalogMonthlyPrices();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const [paymentsResult, ownersResult] = await Promise.all([
      fetchPayments(),
      fetchOwnerSubscriptionAccounts(),
    ]);
    setLoading(false);
    if (!paymentsResult.ok) {
      setError(paymentsResult.message);
      setItems([]);
      return;
    }
    setItems(paymentsResult.data);
    if (ownersResult.ok) setOwners(ownersResult.data);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  const filtered = useMemo(
    () => filterPayments(items, { search, status }),
    [items, search, status],
  );

  const counts = useMemo(() => {
    const base = {
      invoices: items.length,
      paid: 0,
      pending: 0,
      overdue: 0,
      refunded: 0,
      failed: 0,
    };
    for (const item of items) {
      if (item.status in base) {
        base[item.status as keyof typeof base] += 1;
      }
    }
    return base;
  }, [items]);

  const { pageItems, totalPages, page: safePage } = useMemo(
    () => paginateDemoRequests(filtered, page, PAGE_SIZE),
    [filtered, page],
  );

  const selectedOwner = useMemo(
    () => owners.find((owner) => owner.ownerId === selectedOwnerId) ?? null,
    [owners, selectedOwnerId],
  );

  const openEdit = (item: PaymentItem, trigger?: HTMLButtonElement | null) => {
    editTriggerRef.current = trigger ?? null;
    setEditing(item);
    setNextStatus(item.status);
    setNextMethod(item.paymentMethod ?? "manual");
    setNextReference(item.reference ?? "");
    setNextNotes(item.notes ?? "");
    setNextPaidAt(item.paidAt ? item.paidAt.slice(0, 10) : "");
    setEditError(null);
  };

  const closeEdit = () => {
    setEditing(null);
    setConfirmRefund(false);
    editTriggerRef.current?.focus?.();
  };

  const openCreate = () => {
    setCreating(true);
    setSelectedOwnerId(owners[0]?.ownerId ?? "");
    setCreateAmount("");
    setCreateMethod("manual");
    setCreateStatus("paid");
    setCreateReference("");
    setCreateNotes("");
    setCreatePaidAt(new Date().toISOString().slice(0, 10));
    setEditError(null);
  };

  useEffect(() => {
    if (!selectedOwner) return;
    const amount =
      getPlanMonthlyAmount(selectedOwner.plan) ??
      planPrices[normalizePlan(selectedOwner.plan)] ??
      selectedOwner.monthlyPrice;
    setCreateAmount(String(amount));
  }, [selectedOwner, planPrices]);

  const saveEdit = async () => {
    if (!editing) return;
    if (
      requiresPaymentTransitionConfirm(editing.status, nextStatus) &&
      !confirmRefund
    ) {
      setConfirmRefund(true);
      return;
    }

    setSaving(true);
    setEditError(null);
    const result = await updatePaymentViaAdminApi({
      paymentId: editing.id,
      status: nextStatus !== editing.status ? nextStatus : undefined,
      paymentMethod: nextMethod,
      reference: nextReference,
      notes: nextNotes,
      paidAt: nextPaidAt ? new Date(nextPaidAt).toISOString() : null,
    });
    setSaving(false);

    if (!result.ok) {
      setEditError(result.message);
      showToast(result.message, "error");
      return;
    }

    closeEdit();
    await load();
    showToast(
      result.data.alreadyApplied
        ? "Payment was already up to date"
        : "Payment updated",
    );
  };

  const saveCreate = async () => {
    if (!selectedOwner) {
      setEditError("Select an owner.");
      return;
    }
    const amount = Number(createAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setEditError("Enter a valid amount.");
      return;
    }

    setSaving(true);
    setEditError(null);
    const result = await createManualPaymentViaAdminApi({
      ownerId: selectedOwner.ownerId,
      amount,
      paymentMethod: createMethod,
      status: createStatus,
      reference: createReference,
      notes: createNotes,
      paidAt: createPaidAt ? new Date(createPaidAt).toISOString() : null,
    });
    setSaving(false);

    if (!result.ok) {
      setEditError(result.message);
      showToast(result.message, "error");
      return;
    }

    setCreating(false);
    await load();
    showToast("Manual payment recorded");
  };

  const exportFilterSummary = useMemo(() => {
    const parts: string[] = [];
    if (search.trim()) parts.push(`Search: ${search.trim()}`);
    if (status !== "all") parts.push(`Status: ${status}`);
    return parts;
  }, [search, status]);

  return (
    <AdminPlaceholder
      title="Payments"
      description="Owner subscription billing, manual reconciliation, and payment history."
    >
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {(
            [
              ["Invoices", counts.invoices],
              ["Paid", counts.paid],
              ["Pending", counts.pending],
              ["Overdue", counts.overdue],
              ["Failed", counts.failed],
              ["Refunded", counts.refunded],
            ] as const
          ).map(([label, value]) => (
            <div
              key={label}
              className="rounded-2xl border border-gold/15 bg-black/25 p-4 text-center"
            >
              <p className="text-xs uppercase tracking-[0.15em] text-white/40">
                {label}
              </p>
              <p className="mt-2 font-serif text-2xl text-white">{value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search invoice, owner, email, restaurant, reference…"
            aria-label="Search payments"
            className="w-full max-w-md rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
          />
          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as PaymentStatus | "all")
              }
              aria-label="Filter by status"
              className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            >
              <option value="all">All statuses</option>
              {PAYMENT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ExportMenu
              label="Export"
              getDataset={() =>
                buildPaymentExportDataset(filtered, exportFilterSummary)
              }
              onSuccess={(format, count) =>
                showToast(`Exported ${count} payments (${format.toUpperCase()})`)
              }
              onEmpty={() => showToast("No rows available to export", "error")}
              onError={(message) => showToast(message, "error")}
            />
            <button type="button" className="menu-btn-primary" onClick={openCreate}>
              + Add Payment
            </button>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : error ? (
          <div className="py-12 text-center">
            <p className="text-sm text-white/50">{error}</p>
            <button
              type="button"
              className="menu-btn-primary mt-6"
              onClick={() => void load()}
            >
              Try Again
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={
              search || status !== "all"
                ? "No matching payments"
                : "No payment records yet"
            }
            description={
              search || status !== "all"
                ? "Try adjusting your search or status filter."
                : "Successful and pending payments will appear here."
            }
            className="border-0 bg-transparent"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] text-left">
                <thead>
                  <tr className="border-b border-gold/10">
                    {[
                      "Invoice",
                      "Owner",
                      "Plan",
                      "Covered",
                      "Amount",
                      "Method",
                      "Status",
                      "Paid",
                      "Created",
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
                  {pageItems.map((item) => (
                    <tr key={item.id} className="border-b border-white/5">
                      <td className="px-3 py-3 text-sm text-white">
                        {displayInvoice(item)}
                      </td>
                      <td className="px-3 py-3">
                        <p className="text-sm text-white/80">
                          {item.ownerName ?? "—"}
                        </p>
                        <p className="text-xs text-white/40">
                          {item.ownerEmail ?? "—"}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-sm text-gold">
                        {item.plan ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/60">
                        {item.coveredCount > 0
                          ? `${item.coveredCount} restaurant${item.coveredCount === 1 ? "" : "s"}`
                          : "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/70">
                        {formatPaymentAmount(item.amount, item.currency)}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        <span>{formatPaymentMethod(item.paymentMethod)}</span>
                        {item.isManualEntry ? (
                          <span className="ms-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-200">
                            Manual Entry
                          </span>
                        ) : null}
                      </td>
                      <td
                        className={`px-3 py-3 text-sm capitalize ${statusClass(item.status)}`}
                      >
                        {item.status}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {formatDemoDate(item.paidAt)}
                      </td>
                      <td className="px-3 py-3 text-sm text-white/50">
                        {formatDemoDate(item.createdAt)}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          className="menu-btn-secondary !px-2.5 !py-1.5 text-xs"
                          onClick={(event) =>
                            openEdit(item, event.currentTarget)
                          }
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <DemoRequestPagination
              page={safePage}
              totalPages={totalPages}
              totalItems={filtered.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      <ConfirmModal
        open={Boolean(editing)}
        title="Manage Payment"
        scrollable
        size="lg"
        showCloseButton
        headerSubtitle={
          editing ? (
            <p>
              Owner:{" "}
              <span className="text-white/80">
                {editing.ownerName ?? "Unnamed owner"}
              </span>
            </p>
          ) : null
        }
        description={
          editing ? (
            <div className="space-y-4 text-left">
              <div className="grid gap-3 sm:grid-cols-2">
                <InfoBlock label="Invoice" value={displayInvoice(editing)} />
                <InfoBlock label="Email" value={editing.ownerEmail ?? "—"} />
                <InfoBlock label="Plan" value={editing.plan ?? "—"} />
                <InfoBlock
                  label="Amount"
                  value={formatPaymentAmount(editing.amount, editing.currency)}
                />
                <InfoBlock
                  label="Current status"
                  value={<span className="capitalize">{editing.status}</span>}
                />
                <InfoBlock
                  label="Payment method"
                  value={formatPaymentMethod(editing.paymentMethod)}
                />
                <InfoBlock
                  label="Created"
                  value={formatDemoDate(editing.createdAt)}
                />
                <InfoBlock
                  label="Paid"
                  value={formatDemoDate(editing.paidAt)}
                />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-white/40">
                  Covered restaurants
                </p>
                <ul className="mt-2 space-y-1 text-sm text-white/70">
                  {editing.coveredRestaurantNames.length > 0 ? (
                    editing.coveredRestaurantNames.map((name) => (
                      <li key={name}>• {name}</li>
                    ))
                  ) : (
                    <li>—</li>
                  )}
                </ul>
              </div>

              <label className="block text-xs uppercase tracking-wider text-white/40">
                Status
                <select
                  value={nextStatus}
                  onChange={(e) =>
                    setNextStatus(e.target.value as PaymentStatus)
                  }
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                >
                  <option value={editing.status}>{editing.status} (current)</option>
                  {allowedNextStatuses(editing.status).map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs uppercase tracking-wider text-white/40">
                Payment method
                <select
                  value={nextMethod}
                  onChange={(e) => setNextMethod(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                >
                  {[...PAYMENT_METHOD_OPTIONS, "myfatoorah_failed"].map(
                    (method) => (
                      <option key={method} value={method}>
                        {formatPaymentMethod(method)}
                      </option>
                    ),
                  )}
                </select>
              </label>

              <label className="block text-xs uppercase tracking-wider text-white/40">
                Reference / transaction ID
                <input
                  value={nextReference}
                  onChange={(e) => setNextReference(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>

              <label className="block text-xs uppercase tracking-wider text-white/40">
                Paid date
                <input
                  type="date"
                  value={nextPaidAt}
                  onChange={(e) => setNextPaidAt(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>

              <label className="block text-xs uppercase tracking-wider text-white/40">
                Notes
                <textarea
                  value={nextNotes}
                  onChange={(e) => setNextNotes(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
                />
              </label>

              {editError ? (
                <p className="text-sm text-red-300" role="alert">
                  {editError}
                </p>
              ) : null}
            </div>
          ) : null
        }
        confirmLabel="Save Changes"
        loading={saving}
        onConfirm={() => void saveEdit()}
        onCancel={closeEdit}
      />

      <ConfirmModal
        open={Boolean(creating)}
        title="Add Payment"
        scrollable
        size="lg"
        showCloseButton
        description={
          <div className="space-y-4 text-left">
            <label className="block text-xs uppercase tracking-wider text-white/40">
              Owner
              <select
                value={selectedOwnerId}
                onChange={(e) => setSelectedOwnerId(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {owners.map((owner) => (
                  <option key={owner.ownerId} value={owner.ownerId}>
                    {owner.ownerName?.trim() || owner.ownerEmail || owner.ownerId}
                  </option>
                ))}
              </select>
            </label>

            {selectedOwner ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm text-white/70">
                <p>
                  Subscription:{" "}
                  <span className="text-gold">{selectedOwner.plan}</span> ·{" "}
                  {formatPlanPriceLabel(normalizePlan(selectedOwner.plan))}
                </p>
                <p className="mt-2 text-xs uppercase tracking-wider text-white/35">
                  Covered restaurants
                </p>
                <ul className="mt-1 space-y-1">
                  {selectedOwner.restaurants
                    .filter((restaurant) => restaurant.isCovered)
                    .map((restaurant) => (
                      <li key={restaurant.restaurantId}>
                        • {restaurant.restaurantName?.trim() || "Unnamed"}
                      </li>
                    ))}
                </ul>
              </div>
            ) : null}

            <label className="block text-xs uppercase tracking-wider text-white/40">
              Amount (KWD)
              <input
                type="number"
                min="0"
                step="0.001"
                value={createAmount}
                onChange={(e) => setCreateAmount(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="block text-xs uppercase tracking-wider text-white/40">
              Payment method
              <select
                value={createMethod}
                onChange={(e) => setCreateMethod(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {PAYMENT_METHOD_OPTIONS.filter((m) => m !== "myfatoorah").map(
                  (method) => (
                    <option key={method} value={method}>
                      {formatPaymentMethod(method)}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block text-xs uppercase tracking-wider text-white/40">
              Status
              <select
                value={createStatus}
                onChange={(e) =>
                  setCreateStatus(e.target.value as PaymentStatus)
                }
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              >
                {(["paid", "pending", "failed"] as PaymentStatus[]).map(
                  (option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ),
                )}
              </select>
            </label>

            <label className="block text-xs uppercase tracking-wider text-white/40">
              Payment date
              <input
                type="date"
                value={createPaidAt}
                onChange={(e) => setCreatePaidAt(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="block text-xs uppercase tracking-wider text-white/40">
              Reference / transaction ID
              <input
                value={createReference}
                onChange={(e) => setCreateReference(e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>

            <label className="block text-xs uppercase tracking-wider text-white/40">
              Notes
              <textarea
                value={createNotes}
                onChange={(e) => setCreateNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white"
              />
            </label>

            {editError ? (
              <p className="text-sm text-red-300" role="alert">
                {editError}
              </p>
            ) : null}
          </div>
        }
        confirmLabel="Create Payment"
        loading={saving}
        onConfirm={() => void saveCreate()}
        onCancel={() => setCreating(false)}
      />

      <ConfirmModal
        open={confirmRefund}
        title="Refund this payment?"
        description="This will mark the payment as refunded. The original payment record will be preserved for audit history."
        confirmLabel="Refund Payment"
        variant="danger"
        loading={saving}
        onConfirm={() => void saveEdit()}
        onCancel={() => setConfirmRefund(false)}
      />
    </AdminPlaceholder>
  );
}

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 px-3 py-2.5">
      <p className="text-[11px] uppercase tracking-wider text-white/35">{label}</p>
      <div className="mt-1 text-sm text-white/85">{value}</div>
    </div>
  );
}
