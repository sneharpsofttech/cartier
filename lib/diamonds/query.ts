import {
  CLARITIES,
  COLORS,
  CUTS,
  FANCY_COLORS,
  FINISHES,
  FLUORESCENCE,
  GEM_VARIETIES,
  LABS,
  SHAPES,
  SORTS,
  STONE_TYPES,
  type FancyColor,
  type Finish,
  type Fluorescence,
  type GemVariety,
  type Lab,
  type Shape,
  type Sort,
  type StoneType,
} from "./grades";
import type { Stone } from "./types";

/**
 * A stone search. The same URL parameters drive the API (/api/diamonds?...)
 * and the stone list page, so any list view can be shared as a link.
 */
export type StoneQuery = {
  type: StoneType;
  colorType: "White" | "Fancy";
  shapes: Shape[];
  carat: [number, number] | null;
  price: [number, number] | null;
  /** Grade ranges as indices into the scales in grades.ts (inclusive). */
  color: [number, number];
  clarity: [number, number];
  cut: [number, number];
  fancyColors: FancyColor[];
  varieties: GemVariety[];
  heartsArrows: boolean;
  /** Advanced filters. */
  polish: Finish | null;
  symmetry: Finish | null;
  fluorescence: Fluorescence[];
  labs: Lab[];
  depth: [number, number] | null;
  table: [number, number] | null;
  sort: Sort;
  page: number;
  pageSize: number;
};

export const DEFAULT_QUERY: StoneQuery = {
  type: "natural",
  colorType: "White",
  shapes: [],
  carat: null,
  price: null,
  color: [0, COLORS.length - 1],
  clarity: [0, CLARITIES.length - 1],
  cut: [0, CUTS.length - 1],
  fancyColors: [],
  varieties: [],
  heartsArrows: false,
  polish: null,
  symmetry: null,
  fluorescence: [],
  labs: [],
  depth: null,
  table: null,
  sort: "price-asc",
  page: 1,
  pageSize: 12,
};

export const MAX_PAGE_SIZE = 60;

const list = <T extends string>(raw: string | null, allowed: readonly T[]) =>
  (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is T => (allowed as readonly string[]).includes(s));

function range(params: URLSearchParams, key: string): [number, number] | null {
  const lo = Number(params.get(`${key}_min`));
  const hi = Number(params.get(`${key}_max`));
  const hasLo = params.has(`${key}_min`) && Number.isFinite(lo);
  const hasHi = params.has(`${key}_max`) && Number.isFinite(hi);
  if (!hasLo && !hasHi) return null;
  const a = hasLo ? lo : 0;
  const b = hasHi ? hi : Number.MAX_SAFE_INTEGER;
  return a <= b ? [a, b] : [b, a];
}

function gradeRange(params: URLSearchParams, key: string, scale: readonly string[]): [number, number] {
  const lo = scale.indexOf(params.get(`${key}_min`) ?? "");
  const hi = scale.indexOf(params.get(`${key}_max`) ?? "");
  const a = lo >= 0 ? lo : 0;
  const b = hi >= 0 ? hi : scale.length - 1;
  return a <= b ? [a, b] : [b, a];
}

const pick = <T extends string>(raw: string | null, allowed: readonly T[]): T | null =>
  raw && (allowed as readonly string[]).includes(raw) ? (raw as T) : null;

export function parseQuery(params: URLSearchParams): StoneQuery {
  const page = Math.max(1, Math.floor(Number(params.get("page")) || 1));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(params.get("page_size")) || DEFAULT_QUERY.pageSize)));
  return {
    type: pick(params.get("diamond_type"), STONE_TYPES) ?? DEFAULT_QUERY.type,
    colorType: params.get("color_type") === "Fancy" ? "Fancy" : "White",
    shapes: list(params.get("shape"), SHAPES),
    carat: range(params, "carat"),
    price: range(params, "price"),
    color: gradeRange(params, "color", COLORS),
    clarity: gradeRange(params, "clarity", CLARITIES),
    cut: gradeRange(params, "cut", CUTS),
    fancyColors: list(params.get("fancy_color"), FANCY_COLORS),
    varieties: list(params.get("variety"), GEM_VARIETIES),
    heartsArrows: params.get("hearts_arrows") === "1",
    polish: pick(params.get("polish"), FINISHES),
    symmetry: pick(params.get("symmetry"), FINISHES),
    fluorescence: list(params.get("fluorescence"), FLUORESCENCE),
    labs: list(params.get("lab"), LABS),
    depth: range(params, "depth"),
    table: range(params, "table"),
    sort: pick(params.get("sort"), SORTS) ?? DEFAULT_QUERY.sort,
    page,
    pageSize,
  };
}

/** Query to URL parameters, leaving out anything at its default. */
export function toParams(q: StoneQuery, extra: Record<string, string> = {}) {
  const p = new URLSearchParams();
  p.set("diamond_type", q.type);
  if (q.type !== "gemstone") p.set("color_type", q.colorType);
  if (q.shapes.length) p.set("shape", q.shapes.join(","));
  const setRange = (key: string, r: [number, number] | null, digits = 2) => {
    if (!r) return;
    p.set(`${key}_min`, r[0].toFixed(digits));
    p.set(`${key}_max`, r[1].toFixed(digits));
  };
  setRange("carat", q.carat);
  setRange("price", q.price, 0);
  const setGrade = (key: string, r: [number, number], scale: readonly string[]) => {
    if (r[0] === 0 && r[1] === scale.length - 1) return;
    p.set(`${key}_min`, scale[r[0]]);
    p.set(`${key}_max`, scale[r[1]]);
  };
  setGrade("color", q.color, COLORS);
  setGrade("clarity", q.clarity, CLARITIES);
  setGrade("cut", q.cut, CUTS);
  if (q.fancyColors.length) p.set("fancy_color", q.fancyColors.join(","));
  if (q.varieties.length) p.set("variety", q.varieties.join(","));
  if (q.heartsArrows) p.set("hearts_arrows", "1");
  if (q.polish) p.set("polish", q.polish);
  if (q.symmetry) p.set("symmetry", q.symmetry);
  if (q.fluorescence.length) p.set("fluorescence", q.fluorescence.join(","));
  if (q.labs.length) p.set("lab", q.labs.join(","));
  setRange("depth", q.depth, 1);
  setRange("table", q.table, 1);
  if (q.sort !== DEFAULT_QUERY.sort) p.set("sort", q.sort);
  if (q.page > 1) p.set("page", String(q.page));
  if (q.pageSize !== DEFAULT_QUERY.pageSize) p.set("page_size", String(q.pageSize));
  for (const [k, v] of Object.entries(extra)) p.set(k, v);
  return p;
}

const within = (v: number, r: [number, number] | null) => !r || (v >= r[0] - 1e-9 && v <= r[1] + 1e-9);

/** Everything except price and carat, so the sliders can show their full span. */
function matchesGrades(s: Stone, q: StoneQuery) {
  if (s.type !== q.type) return false;
  if (q.shapes.length && !q.shapes.includes(s.shape)) return false;
  if (q.type === "gemstone") {
    if (q.varieties.length && (!s.gem || !q.varieties.includes(s.gem.variety))) return false;
  } else {
    if (q.colorType === "White") {
      if (!s.color) return false;
      const c = COLORS.indexOf(s.color);
      if (c < q.color[0] || c > q.color[1]) return false;
    } else {
      if (!s.fancy) return false;
      if (q.fancyColors.length && !q.fancyColors.includes(s.fancy.color)) return false;
    }
    const cl = CLARITIES.indexOf(s.clarity!);
    if (cl < q.clarity[0] || cl > q.clarity[1]) return false;
    const cu = CUTS.indexOf(s.cut!);
    if (cu < q.cut[0] || cu > q.cut[1]) return false;
    if (q.heartsArrows && !s.heartsArrows) return false;
  }
  if (q.polish && FINISHES.indexOf(s.polish) > FINISHES.indexOf(q.polish)) return false;
  if (q.symmetry && FINISHES.indexOf(s.symmetry) > FINISHES.indexOf(q.symmetry)) return false;
  if (q.fluorescence.length && !q.fluorescence.includes(s.fluorescence)) return false;
  if (q.labs.length && !q.labs.includes(s.lab)) return false;
  if (!within(s.depthPct, q.depth) || !within(s.tablePct, q.table)) return false;
  return true;
}

const SORTERS: Record<Sort, (a: Stone, b: Stone) => number> = {
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  "carat-asc": (a, b) => a.carat - b.carat || a.price - b.price,
  "carat-desc": (a, b) => b.carat - a.carat || a.price - b.price,
  newest: (a, b) => a.listedDaysAgo - b.listedDaysAgo || a.price - b.price,
};

export type StoneSearchResult = {
  items: Stone[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  /** Full price and carat span for the current type, for slider bounds. */
  bounds: { price: [number, number]; carat: [number, number] };
};

export function searchStones(inventory: Stone[], q: StoneQuery): StoneSearchResult {
  const ofType = inventory.filter((s) => s.type === q.type);
  const bounds = {
    price: [Math.min(...ofType.map((s) => s.price)), Math.max(...ofType.map((s) => s.price))] as [number, number],
    carat: [Math.min(...ofType.map((s) => s.carat)), Math.max(...ofType.map((s) => s.carat))] as [number, number],
  };
  const matches = ofType.filter((s) => matchesGrades(s, q) && within(s.carat, q.carat) && within(s.price, q.price));
  matches.sort(SORTERS[q.sort]);
  const pageCount = Math.max(1, Math.ceil(matches.length / q.pageSize));
  const page = Math.min(q.page, pageCount);
  return {
    items: matches.slice((page - 1) * q.pageSize, page * q.pageSize),
    total: matches.length,
    page,
    pageSize: q.pageSize,
    pageCount,
    bounds,
  };
}
