import {
  DEFAULT_CONFIG,
  METAL_OPTIONS,
  type HeadType,
  type RingConfig,
  type ShankStyle,
} from "@/components/viewer/ring/config";
import type { ShapeId } from "@/components/viewer/ring/shapes";
import { quoteSetting } from "@/lib/pricing";

/**
 * Ring setting products: each is a preset of the 3D builder (head + shank),
 * shown and opened with its own centre stone shape.
 */

export const SETTING_STYLES = ["solitaire", "bezel", "halo", "hidden-halo", "pave", "side-stone", "vintage"] as const;
export type SettingStyle = (typeof SETTING_STYLES)[number];

export const SETTING_STYLE_LABELS: Record<SettingStyle, string> = {
  solitaire: "Solitaire",
  bezel: "Bezel",
  halo: "Halo",
  "hidden-halo": "Hidden Halo",
  pave: "Pavé",
  "side-stone": "Side Stone",
  vintage: "Vintage",
};

/** Metals a setting comes in; product photos exist for the gold colours (platinum uses white). */
export const SETTING_METALS = METAL_OPTIONS.map((m) => m.id);
export type SettingMetal = (typeof SETTING_METALS)[number];
export const photoMetal = (metal: string) => (metal === "platinum" ? "white" : metal);

export type Setting = {
  slug: string;
  stock: string;
  name: string;
  style: SettingStyle;
  tagline: string;
  description: string;
  head: HeadType;
  shank: ShankStyle;
  /** Centre stone shape the setting is photographed and opened with (any shape fits). */
  shape: ShapeId;
  sideStones: { count: number; carats: number } | null;
  /** Price per metal, centre stone not included. */
  prices: Record<string, number>;
  featured: boolean;
};

/** Accent diamonds each part adds (count, total carats). */
const SHANK_STONES: Record<ShankStyle, [number, number]> = {
  solitaire: [0, 0],
  knifeEdge: [0, 0],
  twist: [0, 0],
  marquiseVine: [18, 0.62],
  pave: [34, 0.2],
  graduated: [24, 0.28],
  doubleRow: [60, 0.35],
  channel: [26, 0.4],
  splitPave: [40, 0.3],
  marquiseSide: [8, 0.48],
  baguette: [6, 0.36],
  floatingMarquise: [8, 0.32],
  radiantDemi: [30, 0.9],
  diamondArch: [30, 0.22],
  frenchPave1: [22, 0.24],
  frenchPave2: [46, 0.36],
  frenchPave3: [20, 0.3],
  frenchPave4: [26, 0.22],
  pave1: [90, 0.3],
  taperedPave: [22, 0.26],
  miniTaperedPave: [22, 0.12],
  splitProng: [14, 0.28],
  bloom: [28, 0.3],
  collar: [60, 0.34],
  ropeScarf: [12, 0.1],
  tripleRow: [90, 0.5],
  modernSplit: [24, 0.16],
  stepEmerald: [6, 0.42],
  tripleWave: [0, 0],
  frameTrapezoid: [2, 0.3],
  halfMoonSide: [2, 0.4],
  chloe: [6, 0.1],
  emerald: [8, 0.38],
  dotDash: [16, 0.3],
  flowerPetal: [18, 0.26],
  intertwined: [10, 0.08],
  ribbon: [0, 0],
  paveBow: [26, 0.3],
  station: [6, 0.24],
  doubleBaguette: [32, 0.5],
  doubleRowSide: [32, 0.36],
  pearSide: [2, 0.34],
  splitCathedral: [0, 0],
  trapezoidSide: [2, 0.32],
  trio: [2, 0.5],
  sofia: [20, 0.3],
  traditional12: [0, 0],
  roundSide: [4, 0.42],
  zhuri: [26, 0.3],
  marquiseHalfEternity: [28, 0.7],
};
const HEAD_STONES: Record<HeadType, [number, number]> = {
  prong: [0, 0],
  bezel: [0, 0],
  hiddenHalo: [18, 0.12],
  halo: [24, 0.2],
  doubleHalo: [52, 0.42],
};

type Seed = [
  name: string,
  style: SettingStyle,
  head: HeadType,
  shank: ShankStyle,
  shape: ShapeId,
  tagline: string,
  featured?: boolean,
];

/** Centre stone weight for photos and the builder's starting point. */
export const DISPLAY_CARAT = 1.5;

const SEEDS: Seed[] = [
  ["Aurora", "solitaire", "prong", "solitaire", "oval", "The timeless four-prong solitaire", true],
  ["Lumen", "solitaire", "prong", "knifeEdge", "marquise", "A crisp knife-edge band that catches the light"],
  ["Celeste", "vintage", "prong", "twist", "round", "Two strands of metal twisted like rope"],
  ["Seraphine", "vintage", "prong", "marquiseVine", "pear", "Marquise leaves climbing a woven vine", true],
  ["Elodie", "pave", "prong", "pave", "round", "A slender band lined with pavé diamonds", true],
  ["Margaux", "pave", "prong", "graduated", "emerald", "Pavé stones that grow towards the centre"],
  ["Isadora", "pave", "prong", "doubleRow", "cushion", "Two rows of sparkle on a wide band"],
  ["Vivienne", "side-stone", "prong", "channel", "princess", "Princess-cut stones set flush in a channel"],
  ["Noémie", "pave", "prong", "splitPave", "oval", "A split shank that opens to cradle the centre"],
  ["Rosalind", "side-stone", "prong", "marquiseSide", "round", "Marquise side stones set east to west"],
  ["Odette", "side-stone", "prong", "baguette", "emerald", "Tapered baguettes in a clean, architectural line", true],
  ["Clémence", "hidden-halo", "hiddenHalo", "solitaire", "oval", "A secret ring of diamonds under the centre stone"],
  ["Juliette", "hidden-halo", "hiddenHalo", "pave", "cushion", "Hidden halo and pavé band for sparkle from every side", true],
  ["Amélie", "hidden-halo", "hiddenHalo", "knifeEdge", "radiant", "A hidden halo on a sharp knife-edge band"],
  ["Coralie", "halo", "halo", "solitaire", "round", "A halo that makes the centre stone look larger"],
  ["Delphine", "halo", "halo", "pave", "oval", "Halo and pavé band, brilliant all round", true],
  ["Estelle", "halo", "halo", "twist", "pear", "A halo crowning a twisted rope band"],
  ["Fleur", "halo", "halo", "marquiseVine", "round", "A halo blooming above a marquise vine"],
  ["Gabrielle", "halo", "halo", "splitPave", "cushion", "A halo framed by a split pavé shank"],
  ["Hélène", "halo", "halo", "channel", "princess", "A halo above a channel of princess stones"],
  ["Inès", "halo", "doubleHalo", "solitaire", "round", "Two halos for maximum presence"],
  ["Léonie", "halo", "doubleHalo", "pave", "oval", "Double halo and pavé band: our most brilliant", true],
  ["Mireille", "halo", "doubleHalo", "graduated", "asscher", "Double halo with a graduated pavé band"],
  ["Solène", "halo", "doubleHalo", "baguette", "emerald", "Double halo flanked by tapered baguettes"],
  ["Béatrix", "bezel", "bezel", "solitaire", "cushion", "A smooth bezel hugging a cushion cut", true],
  ["Ondine", "bezel", "bezel", "knifeEdge", "oval", "An oval in a slim bezel on a knife-edge band"],
  ["Viola", "bezel", "bezel", "pave", "round", "A round bezel on a band of pavé"],
  ["Maëlle", "bezel", "bezel", "solitaire", "emerald", "An emerald cut framed in polished metal"],
];

const slugify = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

function describeSetting(name: string, head: HeadType, shank: ShankStyle, stones: Setting["sideStones"]) {
  const headText = {
    prong: "a classic prong head",
    bezel: "a smooth bezel of metal wrapped all the way around the centre stone",
    hiddenHalo: "a hidden halo of diamonds tucked beneath the centre stone",
    halo: "a halo of round diamonds around the centre stone",
    doubleHalo: "two concentric halos of round diamonds",
  }[head];
  const accent = stones ? ` It is set with ${stones.count} accent diamonds (approx. ${stones.carats.toFixed(2)} ct total).` : "";
  return `The ${name} pairs ${headText} with our ${shank === "solitaire" ? "plain polished" : shank.replace(/([A-Z])/g, " $1").toLowerCase()} band.${accent} It fits any centre stone shape from 0.2 to 8 carats and is made to order in your ring size.`;
}

function priceFor(head: HeadType, shank: ShankStyle, metal: string) {
  const config: RingConfig = { ...DEFAULT_CONFIG, head, shank, headMetal: metal, shankMetal: metal, band: "none" };
  return quoteSetting(config).setting;
}

export const SETTINGS: Setting[] = SEEDS.map(([name, style, head, shank, shape, tagline, featured = false], i) => {
  const count = SHANK_STONES[shank][0] + HEAD_STONES[head][0];
  const carats = SHANK_STONES[shank][1] + HEAD_STONES[head][1];
  const sideStones = count ? { count, carats: Math.round(carats * 100) / 100 } : null;
  return {
    slug: slugify(name),
    stock: `ML-${2101 + i}`,
    name,
    style,
    tagline,
    description: describeSetting(name, head, shank, sideStones),
    head,
    shank,
    shape,
    sideStones,
    prices: Object.fromEntries(SETTING_METALS.map((m) => [m, priceFor(head, shank, m)])),
    featured,
  };
});

export const getSetting = (slug: string) => SETTINGS.find((s) => s.slug === slug) ?? null;

/** Product photo of a setting in a metal (rendered by scripts/render_thumbnails.py settings). */
export const settingImage = (s: Setting, metal: string) => `/rings/${s.slug}-${photoMetal(metal)}.webp`;

/** A setting's product page (photos, price, details), carrying the chosen metal and any stone; the 3D builder is one click on. */
export function settingDetailUrl(slug: string, query: string | URLSearchParams = "") {
  const qs = new URLSearchParams(query).toString();
  return `/engagement-rings/${slug}${qs ? `?${qs}` : ""}`;
}

/** The builder configuration a setting starts from. */
export function settingConfig(s: Setting, metal = "yellow"): RingConfig {
  return {
    ...DEFAULT_CONFIG,
    head: s.head,
    shank: s.shank,
    shape: s.shape,
    carat: DISPLAY_CARAT,
    centerGem: "diamond",
    headMetal: metal,
    shankMetal: metal,
    bandMetal: metal,
  };
}

export const SETTING_SORTS = ["featured", "price-asc", "price-desc", "name"] as const;
export type SettingSort = (typeof SETTING_SORTS)[number];
export const SETTING_SORT_LABELS: Record<SettingSort, string> = {
  featured: "Featured",
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  name: "Name",
};

/** DAZORA's design lines, shown as each setting's "designer". */
export const SETTING_DESIGNERS = {
  signature: "DAZORA Signature",
  atelier: "DAZORA Atelier",
  eclat: "DAZORA Éclat",
  heritage: "DAZORA Heritage",
} as const;
export type SettingDesigner = keyof typeof SETTING_DESIGNERS;

const DESIGNER_BY_STYLE: Record<SettingStyle, SettingDesigner> = {
  solitaire: "signature",
  bezel: "signature",
  halo: "atelier",
  "hidden-halo": "atelier",
  pave: "eclat",
  "side-stone": "eclat",
  vintage: "heritage",
};

export const settingDesigner = (s: Pick<Setting, "style">) => DESIGNER_BY_STYLE[s.style];

const METAL_NAMES: Record<string, string> = {
  white: "14K White Gold",
  yellow: "14K Yellow Gold",
  rose: "14K Rose Gold",
  platinum: "Platinum",
};

const SHAPE_NAMES: Record<string, string> = {
  round: "Round",
  oval: "Oval",
  cushion: "Cushion",
  emerald: "Emerald Cut",
  pear: "Pear",
  princess: "Princess",
  asscher: "Asscher",
  marquise: "Marquise",
  heart: "Heart",
  radiant: "Radiant",
};

const HEAD_NAMES: Record<HeadType, string> = {
  prong: "",
  bezel: "Bezel",
  hiddenHalo: "Hidden Halo",
  halo: "Halo",
  doubleHalo: "Double Halo",
};

const SHANK_NAMES: Record<ShankStyle, string> = {
  solitaire: "",
  knifeEdge: "Knife Edge",
  twist: "Twist",
  marquiseVine: "Vine",
  pave: "Pavé",
  graduated: "Graduated Pavé",
  doubleRow: "Double Row",
  channel: "Channel Set",
  splitPave: "Split Shank",
  marquiseSide: "Marquise Side Stone",
  baguette: "Baguette",
  floatingMarquise: "Floating Marquise",
  radiantDemi: "Radiant Demi Eternity",
  diamondArch: "Diamond Arch",
  frenchPave1: "French Pavé",
  frenchPave2: "French Pavé",
  frenchPave3: "Graduated French Pavé",
  frenchPave4: "Knife Edge French Pavé",
  pave1: "Micro Pavé",
  taperedPave: "Tapered Pavé",
  miniTaperedPave: "Petite Tapered Pavé",
  splitProng: "Split Prong",
  bloom: "Bloom",
  collar: "Collar",
  ropeScarf: "Rope",
  tripleRow: "Triple Row",
  modernSplit: "Modern Split Shank",
  stepEmerald: "Step Emerald Side Stone",
  tripleWave: "Triple Wave",
  frameTrapezoid: "Framed Trapezoid",
  halfMoonSide: "Half Moon Side Stone",
  chloe: "Bezel Station",
  emerald: "Emerald Side Stone",
  dotDash: "Dot Dash",
  flowerPetal: "Flower Petal",
  intertwined: "Intertwined",
  ribbon: "Ribbon",
  paveBow: "Pavé Bow",
  station: "Station",
  doubleBaguette: "Double Baguette",
  doubleRowSide: "Double Row Side Stone",
  pearSide: "Pear Side Stone",
  splitCathedral: "Split Cathedral",
  trapezoidSide: "Trapezoid Side Stone",
  trio: "Three Stone",
  sofia: "Marquise and Round",
  traditional12: "Flat Edge",
  roundSide: "Round Side Stone",
  zhuri: "Slanted Marquise",
  marquiseHalfEternity: "Marquise Half Eternity",
};

/** Catalogue title, e.g. "The Delphine 14K Yellow Gold Oval Halo Pavé Engagement Ring". */
export function settingTitle(s: Setting, metal: string) {
  const plain = s.head === "prong" && (s.shank === "solitaire" || s.shank === "knifeEdge");
  const parts = [
    `The ${s.name}`,
    METAL_NAMES[metal] ?? METAL_NAMES.yellow,
    SHAPE_NAMES[s.shape],
    plain ? "Solitaire" : HEAD_NAMES[s.head],
    SHANK_NAMES[s.shank],
    "Engagement Ring",
  ];
  return parts.filter(Boolean).join(" ");
}

export type SettingQuery = {
  styles: SettingStyle[];
  designers: SettingDesigner[];
  /** Centre stone shapes the settings are shown with. */
  shapes: ShapeId[];
  metal: string;
  price: [number, number] | null;
  sort: SettingSort;
};

export function parseSettingQuery(params: URLSearchParams): SettingQuery {
  const styles = (params.get("style") ?? "")
    .split(",")
    .filter((s): s is SettingStyle => (SETTING_STYLES as readonly string[]).includes(s));
  const designers = (params.get("designer") ?? "")
    .split(",")
    .filter((d): d is SettingDesigner => d in SETTING_DESIGNERS);
  const shapes = (params.get("shape") ?? "")
    .split(",")
    .filter((sh): sh is ShapeId => sh in SHAPE_NAMES);
  const metal = SETTING_METALS.includes(params.get("metal") ?? "") ? params.get("metal")! : "yellow";
  const lo = Number(params.get("price_min"));
  const hi = Number(params.get("price_max"));
  const price: [number, number] | null =
    params.has("price_min") || params.has("price_max")
      ? [Number.isFinite(lo) ? lo : 0, params.has("price_max") && Number.isFinite(hi) ? hi : Infinity]
      : null;
  const sort = (SETTING_SORTS as readonly string[]).includes(params.get("sort") ?? "")
    ? (params.get("sort") as SettingSort)
    : "featured";
  return { styles, designers, shapes, metal, price, sort };
}

export function searchSettings(q: SettingQuery) {
  const items = SETTINGS.filter(
    (s) =>
      (!q.styles.length || q.styles.includes(s.style)) &&
      (!q.designers.length || q.designers.includes(settingDesigner(s))) &&
      (!q.shapes.length || q.shapes.includes(s.shape)) &&
      (!q.price || (s.prices[q.metal] >= q.price[0] && s.prices[q.metal] <= q.price[1])),
  );
  const by = {
    featured: (a: Setting, b: Setting) => Number(b.featured) - Number(a.featured) || a.prices[q.metal] - b.prices[q.metal],
    "price-asc": (a: Setting, b: Setting) => a.prices[q.metal] - b.prices[q.metal],
    "price-desc": (a: Setting, b: Setting) => b.prices[q.metal] - a.prices[q.metal],
    name: (a: Setting, b: Setting) => a.name.localeCompare(b.name),
  }[q.sort];
  const all = SETTINGS.map((s) => s.prices[q.metal]);
  return { items: [...items].sort(by), total: items.length, bounds: [Math.min(...all), Math.max(...all)] as [number, number] };
}
