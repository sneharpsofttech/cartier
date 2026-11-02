"use client";

/**
 * The shopping bag, kept in this browser's localStorage. There is no checkout
 * backend; the bag lists pieces and totals them.
 */
import { useSyncExternalStore } from "react";

export type BagLine = { id: string; title: string; image: string; href: string; price: number; qty: number };

const KEY = "bag";
const EVENT = "bag-change";
const EMPTY: BagLine[] = [];
let cache: { raw: string | null; lines: BagLine[] } = { raw: null, lines: EMPTY };

function read(): BagLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw !== cache.raw) cache = { raw, lines: raw ? (JSON.parse(raw) as BagLine[]) : EMPTY };
  } catch {
    // Storage blocked or unreadable: treat the bag as empty.
  }
  return cache.lines;
}

function write(lines: BagLine[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(lines));
  } catch {
    // Storage blocked: the bag just won't persist.
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

export const useBag = () => useSyncExternalStore(subscribe, read, () => EMPTY);

export function addToBag(line: Omit<BagLine, "qty">) {
  const lines = read();
  const found = lines.find((l) => l.id === line.id);
  write(found ? lines.map((l) => (l.id === line.id ? { ...l, qty: l.qty + 1 } : l)) : [...lines, { ...line, qty: 1 }]);
}

export function removeFromBag(id: string) {
  write(read().filter((l) => l.id !== id));
}
