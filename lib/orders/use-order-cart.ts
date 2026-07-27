"use client";

import { useCallback, useMemo, useState } from "react";
import type { PublicMenuItem } from "@/lib/public-menu/types";
import type { CartLine } from "./types";

function round(value: number): number {
  return Math.round((value + Number.EPSILON) * 1000) / 1000;
}

export type OrderCartState = {
  lines: CartLine[];
  totalCount: number;
  subtotal: number;
  taxAmount: number;
  grandTotal: number;
  getQuantity: (menuItemId: string) => number;
  addItem: (item: PublicMenuItem, displayName: string) => void;
  incrementLine: (key: string) => void;
  decrementLine: (key: string) => void;
  removeLine: (key: string) => void;
  updateLineNotes: (key: string, notes: string) => void;
  clearCart: () => void;
};

export function useOrderCart(taxRate: number = 0): OrderCartState {
  const [lines, setLines] = useState<CartLine[]>([]);

  const addItem = useCallback((item: PublicMenuItem, displayName: string) => {
    setLines((prev) => {
      const key = item.id;
      const existing = prev.find((line) => line.key === key);
      if (existing) {
        return prev.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      const unitPrice = item.discountPrice ?? item.price;
      return [
        ...prev,
        { key, menuItemId: item.id, name: displayName, unitPrice, quantity: 1, notes: "" },
      ];
    });
  }, []);

  const incrementLine = useCallback((key: string) => {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, quantity: line.quantity + 1 } : line)),
    );
  }, []);

  const decrementLine = useCallback((key: string) => {
    setLines((prev) =>
      prev.flatMap((line) => {
        if (line.key !== key) return [line];
        if (line.quantity <= 1) return [];
        return [{ ...line, quantity: line.quantity - 1 }];
      }),
    );
  }, []);

  const removeLine = useCallback((key: string) => {
    setLines((prev) => prev.filter((line) => line.key !== key));
  }, []);

  const updateLineNotes = useCallback((key: string, notes: string) => {
    setLines((prev) => prev.map((line) => (line.key === key ? { ...line, notes } : line)));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const getQuantity = useCallback(
    (menuItemId: string) => lines.find((line) => line.key === menuItemId)?.quantity ?? 0,
    [lines],
  );

  const totalCount = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const subtotal = useMemo(
    () => round(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0)),
    [lines],
  );
  const taxAmount = useMemo(() => round(subtotal * (taxRate / 100)), [subtotal, taxRate]);
  const grandTotal = useMemo(() => round(subtotal + taxAmount), [subtotal, taxAmount]);

  return {
    lines,
    totalCount,
    subtotal,
    taxAmount,
    grandTotal,
    getQuantity,
    addItem,
    incrementLine,
    decrementLine,
    removeLine,
    updateLineNotes,
    clearCart,
  };
}
