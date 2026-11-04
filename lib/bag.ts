"use client";

/**
 * The shopping bag, kept in this browser's localStorage. There is no checkout
 * backend; the bag lists pieces and totals them.
 */
import { useSyncExternalStore } from "react";

export type BagLine = {
  id: string;
  title: string;
  image: string;
  href: string;
  price: number;
  qty: number;
  /** A short line under the title: metal, size, the ring's make-up. */
  detail?: string;
};

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

const never = () => () => {};
/** False during the server render and hydration, so pages don't flash "empty" before the bag is read. */
export const useBagReady = () => useSyncExternalStore(never, () => true, () => false);

export function addToBag(line: Omit<BagLine, "qty">) {
  const lines = read();
  const found = lines.find((l) => l.id === line.id);
  write(found ? lines.map((l) => (l.id === line.id ? { ...l, qty: l.qty + 1 } : l)) : [...lines, { ...line, qty: 1 }]);
}

/** Sets a line's quantity (1 to 10); the cart page's steppers use this. */
export function setBagQty(id: string, qty: number) {
  const n = Math.max(1, Math.min(10, Math.round(qty)));
  write(read().map((l) => (l.id === id ? { ...l, qty: n } : l)));
}

export function removeFromBag(id: string) {
  write(read().filter((l) => l.id !== id));
}
