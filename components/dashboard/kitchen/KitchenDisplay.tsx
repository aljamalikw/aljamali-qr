"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/components/ui/ToastProvider";
import { fetchOrders } from "@/lib/orders/fetchOrders";
import type { Order } from "@/lib/orders/types";
import { updateOrderStatus } from "@/lib/orders/updateOrderStatus";
import { getNextOrderStatus } from "@/lib/orders/utils";
import { OnlineOrderingFeatureGate } from "@/components/dashboard/OnlineOrderingFeatureGate";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { supabase } from "@/lib/supabase";
import { KitchenOrderCard } from "./KitchenOrderCard";

const MUTE_STORAGE_KEY = "kds-muted";
const MAX_COMPLETED_CARDS = 20;

function playBeep(): void {
  try {
    const AudioCtx =
      window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.4);
    oscillator.onended = () => void ctx.close();
  } catch {
    // Audio not supported in this environment — fail silently.
  }
}

function readInitialMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

/** Public entry — Starter sees upgrade card; Pro/Enterprise see KDS. */
export function KitchenDisplay() {
  return (
    <OnlineOrderingFeatureGate>
      <KitchenDisplayContent />
    </OnlineOrderingFeatureGate>
  );
}

function KitchenDisplayContent() {
  const { showToast } = useToast();
  const { restaurant, loading: restaurantLoading } = useRestaurant();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(readInitialMuted);
  const [now, setNow] = useState(() => Date.now());

  const knownPendingIds = useRef<Set<string> | null>(null);

  const loadOrders = useCallback(async () => {
    if (!restaurant?.id) {
      setLoading(false);
      return;
    }
    const result = await fetchOrders(restaurant.id);
    setLoading(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError(null);

    const pendingIds = new Set(
      result.data.filter((order) => order.status === "Pending").map((order) => order.id),
    );

    if (knownPendingIds.current) {
      const hasNewPending = [...pendingIds].some((id) => !knownPendingIds.current!.has(id));
      if (hasNewPending && !muted) playBeep();
    }
    knownPendingIds.current = pendingIds;

    setOrders(result.data);
  }, [restaurant?.id, muted]);

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  useEffect(() => {
    if (!restaurant?.id) return;

    const channel = supabase
      .channel(`orders-kds-${restaurant.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `restaurant_id=eq.${restaurant.id}`,
        },
        () => {
          void loadOrders();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant?.id]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMuted = () => {
    setMuted((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem(MUTE_STORAGE_KEY, String(next));
      } catch {
        // ignore storage failures
      }
      return next;
    });
  };

  const handleAdvance = useCallback(
    async (order: Order) => {
      const nextStatus = getNextOrderStatus(order.status);
      if (!nextStatus) return;

      const result = await updateOrderStatus(order.id, nextStatus);
      if (!result.ok) {
        showToast(result.message, "error");
        return;
      }
      setOrders((prev) => prev.map((o) => (o.id === result.data.id ? result.data : o)));
    },
    [showToast],
  );

  const columns = useMemo(() => {
    const newOrders = orders.filter((o) => o.status === "Pending");
    const preparingOrders = orders.filter((o) => o.status === "Accepted" || o.status === "Preparing");
    const readyOrders = orders.filter((o) => o.status === "Ready");
    const completedOrders = orders
      .filter((o) => o.status === "Completed")
      .sort((a, b) => new Date(b.completedAt ?? b.updatedAt).getTime() - new Date(a.completedAt ?? a.updatedAt).getTime())
      .slice(0, MAX_COMPLETED_CARDS);

    return [
      { id: "new", label: "New", orders: newOrders, accent: "border-t-amber-400" },
      { id: "preparing", label: "Preparing", orders: preparingOrders, accent: "border-t-blue-400" },
      { id: "ready", label: "Ready", orders: readyOrders, accent: "border-t-emerald-400" },
      { id: "completed", label: "Completed", orders: completedOrders, accent: "border-t-white/20" },
    ];
  }, [orders]);

  if (restaurantLoading) {
    return (
      <div className="mx-auto max-w-[1600px] space-y-6">
        <div className="skeleton-shimmer h-10 w-64 rounded-xl" />
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="mx-auto max-w-3xl py-16 text-center">
        <p className="text-sm text-white/50">Complete restaurant onboarding to use the Kitchen Display.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-white sm:text-3xl">Kitchen Display</h1>
          <p className="mt-1 text-sm text-white/45">
            Live order queue for {restaurant.restaurant_name ?? "your kitchen"}.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleMuted}
          className="menu-btn-secondary shrink-0"
          aria-pressed={muted}
        >
          {muted ? "🔇 Muted" : "🔊 Sound On"}
        </button>
      </div>

      {error ? (
        <div className="dashboard-card rounded-2xl p-8 text-center">
          <p className="text-sm text-white/50">{error}</p>
          <button type="button" onClick={() => void loadOrders()} className="menu-btn-primary mt-4">
            Try Again
          </button>
        </div>
      ) : loading ? (
        <div className="grid gap-4 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer h-64 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="scrollbar-hide -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
          {columns.map((column) => (
            <div key={column.id} className="w-[320px] shrink-0 space-y-3 lg:w-auto">
              <div className="flex items-center justify-between px-1">
                <h2 className="font-serif text-lg font-bold text-white">{column.label}</h2>
                <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-0.5 text-xs text-white/60">
                  {column.orders.length}
                </span>
              </div>
              <div className="max-h-[75vh] space-y-3 overflow-y-auto pe-1">
                {column.orders.length === 0 ? (
                  <div className="dashboard-card rounded-2xl p-6 text-center text-sm text-white/35">
                    No orders
                  </div>
                ) : (
                  column.orders.map((order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      now={now}
                      onAdvance={(o) => void handleAdvance(o)}
                      accentClass={column.accent}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
