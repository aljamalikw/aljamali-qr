"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRestaurant } from "@/lib/restaurants/use-restaurant";
import { globalIntelligenceSearch } from "@/lib/intelligence/search";
import type { GlobalSearchResult } from "@/lib/intelligence/types";

export function GlobalSearch() {
  const { restaurant, restaurants } = useRestaurant();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    if (!restaurant?.id) return;
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    const timer = window.setTimeout(() => {
      void globalIntelligenceSearch({
        restaurantId: restaurant.id,
        query: q,
        siblingRestaurantIds: restaurants.map((r) => r.id),
      }).then((result) => {
        if (cancelled) return;
        setLoading(false);
        if (!result.ok) {
          setResults([]);
          setError(result.message);
          setOpen(true);
          return;
        }
        setError(null);
        setResults(result.data);
        setOpen(true);
      });
    }, 220);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, restaurant?.id, restaurants]);

  if (!restaurant?.id) return null;

  return (
    <div className="relative hidden min-w-0 max-w-xs flex-1 md:block lg:max-w-sm" ref={wrapRef}>
      <label className="sr-only" htmlFor="global-intelligence-search">
        Search
      </label>
      <input
        id="global-intelligence-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => {
          if (results.length > 0 || error) setOpen(true);
        }}
        placeholder="Search…"
        autoComplete="off"
        aria-controls={listId}
        aria-expanded={open}
        className="w-full rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-sm text-white placeholder:text-white/35 focus:border-gold/30 focus:outline-none"
      />
      {open && (loading || results.length > 0 || error || query.trim().length >= 2) ? (
        <div
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 max-h-72 overflow-auto rounded-xl border border-gold/15 bg-surface-elevated shadow-xl"
        >
          {loading ? (
            <p className="px-3 py-3 text-sm text-white/45">Searching…</p>
          ) : error ? (
            <p className="px-3 py-3 text-sm text-red-300/90">{error}</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-sm text-white/45">No matches</p>
          ) : (
            <ul className="py-1">
              {results.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      setQuery("");
                      setError(null);
                    }}
                    className="block px-3 py-2.5 transition hover:bg-gold/10"
                  >
                    <p className="truncate text-sm font-medium text-white">
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-white/45">
                      {item.type.replaceAll("_", " ")} · {item.subtitle}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </div>
  );
}
