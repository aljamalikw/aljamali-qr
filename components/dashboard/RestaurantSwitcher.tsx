"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useSubscriptionAccess } from "@/components/dashboard/SubscriptionAccessProvider";
import { useToast } from "@/components/ui/ToastProvider";
import { setStoredActiveRestaurantId } from "@/lib/restaurants/active-restaurant";
import { createAdditionalRestaurant } from "@/lib/restaurants/create-additional-restaurant";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { canCreateRestaurant } from "@/lib/subscriptions/plans";
import { DashboardIcon } from "./icons/DashboardIcons";

export function RestaurantSwitcher() {
  const menuId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const { showToast } = useToast();
  const {
    restaurant,
    restaurants,
    restaurantCount,
    loading,
    selectRestaurant,
    refresh,
  } = useRestaurant();
  const { access } = useSubscriptionAccess();

  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const allowedToCreate = canCreateRestaurant(access.plan, restaurantCount);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!panelRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setShowCreateForm(false);
        setCreating(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setShowCreateForm(false);
        setCreating(false);
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      showToast("Enter a restaurant name.");
      return;
    }
    setSubmitting(true);
    const result = await createAdditionalRestaurant({
      restaurantName: trimmed,
      sourceRestaurantId: restaurant?.id,
    });
    setSubmitting(false);

    if (!result.ok) {
      showToast(result.message);
      return;
    }

    showToast("Restaurant created. Continue setup from the dashboard banner.");
    setName("");
    setShowCreateForm(false);
    setCreating(false);
    setOpen(false);
    setStoredActiveRestaurantId(result.restaurant.id);
    const list = await refresh();
    selectRestaurant(result.restaurant.id, list);
  };

  if (loading || !restaurant) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[220px] items-center gap-2 rounded-xl border border-gold/15 bg-surface-elevated/60 px-2.5 py-1.5 text-start transition-colors hover:border-gold/30 sm:max-w-xs"
      >
        <span className="truncate text-xs text-white/55 sm:text-sm">
          Switch
        </span>
        <DashboardIcon
          name="chevron-right"
          className={`h-3.5 w-3.5 shrink-0 text-gold/70 transition-transform ${open ? "-rotate-90" : "rotate-90"}`}
        />
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute start-0 top-full z-50 mt-2 w-[min(100vw-2rem,20rem)] rounded-2xl border border-gold/20 bg-surface-elevated p-2 shadow-xl shadow-black/40"
        >
          <p className="px-2 py-1.5 text-[11px] uppercase tracking-wider text-white/40">
            Your restaurants
          </p>
          <ul className="max-h-56 space-y-0.5 overflow-y-auto">
            {restaurants.map((item) => {
              const active = item.id === restaurant.id;
              const label =
                item.restaurant_name?.trim() || "Untitled restaurant";
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      selectRestaurant(item.id);
                      setOpen(false);
                      setShowCreateForm(false);
                      setCreating(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-start text-sm transition-colors ${
                      active
                        ? "bg-gold/15 text-gold"
                        : "text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <span className="truncate">{label}</span>
                    {active ? (
                      <span className="ms-2 text-[10px] uppercase tracking-wider text-gold/80">
                        Active
                      </span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-2 border-t border-white/5 pt-2">
            {!creating ? (
              <button
                type="button"
                onClick={() => {
                  setCreating(true);
                  setShowCreateForm(allowedToCreate);
                }}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-white/80 transition-colors hover:bg-white/5"
              >
                <span className="text-gold">+</span>
                Add restaurant
              </button>
            ) : allowedToCreate || showCreateForm ? (
              <div className="space-y-2 px-1 py-1">
                <label className="block px-1 text-xs text-white/45">
                  New restaurant name
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-gold/40"
                    placeholder="e.g. Aljamali — Salmiya"
                    autoFocus
                    disabled={submitting}
                  />
                </label>
                <div className="flex gap-2 px-1">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => void handleCreate()}
                    className="menu-btn-primary flex-1 text-xs disabled:opacity-60"
                  >
                    {submitting ? "Creating…" : "Create"}
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={() => {
                      setCreating(false);
                      setShowCreateForm(false);
                      setName("");
                    }}
                    className="menu-btn-secondary flex-1 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-gold/20 bg-gold/[0.06] px-3 py-3">
                <p className="font-serif text-base font-semibold text-white">
                  Need another restaurant?
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-white/55">
                  {access.plan === "Professional"
                    ? "Your Professional plan includes 2 restaurants. Upgrade to Enterprise to cover additional restaurants."
                    : "Upgrade your subscription to manage additional restaurant locations."}
                </p>
                <Link
                  href="/dashboard/subscription"
                  onClick={() => setOpen(false)}
                  className="menu-btn-primary mt-3 inline-flex w-full justify-center text-xs"
                >
                  Upgrade Plan
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
