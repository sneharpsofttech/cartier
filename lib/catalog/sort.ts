/** Sorting and price formatting shared by collection pages (server and client). */
export type SortId = "featured" | "price-asc" | "price-desc" | "name";
export const SORTS: { id: SortId; label: string }[] = [
  { id: "featured", label: "Default Sorting" },
  { id: "price-asc", label: "Price, low to high" },
  { id: "price-desc", label: "Price, high to low" },
  { id: "name", label: "Alphabetically, A–Z" },
];

export function sortItems<T extends { price: number; title: string }>(items: T[], sort: SortId) {
  const copy = [...items];
  if (sort === "price-asc") copy.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") copy.sort((a, b) => b.price - a.price);
  if (sort === "name") copy.sort((a, b) => a.title.localeCompare(b.title));
  return copy;
}

export const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
export const parseMoney = (s: string) => Number(s.replace(/[^0-9.]/g, ""));

/** Short price for slider ends, e.g. $900, $2.5K, $11K. */
export const shortMoney = (v: number) =>
  v >= 10000 ? `$${Math.round(v / 1000)}K` : v >= 1000 ? `$${(Math.round(v / 100) / 10).toString()}K` : `$${Math.round(v)}`;
