import type { ShapeId } from "./shapes";

export type HeadType = "prong" | "bezel" | "hiddenHalo" | "halo" | "doubleHalo";

export type ShankStyle =
  | "graduated"
  | "floatingMarquise"
  | "pave"
  | "radiantDemi"
  | "diamondArch"
  | "frenchPave2"
  | "splitProng"
  | "baguette"
  | "solitaire"
  | "bloom"
  | "collar"
  | "miniTaperedPave"
  | "ropeScarf"
  | "tripleRow"
  | "modernSplit"
  | "stepEmerald"
  | "tripleWave"
  | "frameTrapezoid"
  | "halfMoonSide"
  | "chloe"
  | "emerald"
  | "frenchPave1"
  | "dotDash"
  | "flowerPetal"
  | "intertwined"
  | "marquiseVine"
  | "ribbon"
  | "paveBow"
  | "station"
  | "doubleBaguette"
  | "doubleRowSide"
  | "pearSide"
  | "doubleRow"
  | "knifeEdge"
  | "splitCathedral"
  | "trapezoidSide"
  | "twist"
  | "trio"
  | "channel"
  | "pave1"
  | "sofia"
  | "traditional12"
  | "roundSide"
  | "taperedPave"
  | "zhuri"
  | "frenchPave3"
  | "marquiseHalfEternity"
  | "frenchPave4"
  | "marquiseSide"
  | "splitPave";

export type BandStyle = "none" | "plain" | "eternity" | "twist" | "knifeEdge";

export type RingConfig = {
  head: HeadType;
  shape: ShapeId;
  carat: number;
  centerGem: string;
  headMetal: string;
  shank: ShankStyle;
  accentGem: string;
  shankMetal: string;
  band: BandStyle;
  bandMetal: string;
  /** US ring size. */
  ringSize: number;
};

export type Option<T extends string = string> = { id: T; label: string };

export const HEAD_TYPES: Option<HeadType>[] = [
  { id: "prong", label: "Classic Prong" },
  { id: "bezel", label: "Bezel" },
  { id: "hiddenHalo", label: "Hidden Halo" },
  { id: "halo", label: "Single Halo" },
  { id: "doubleHalo", label: "Double Halo" },
];

/** US ring sizes offered, in half sizes. */
export const RING_SIZES = Array.from({ length: 17 }, (_, i) => 3 + i * 0.5);

export const CARATS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 3.5, 4, 5];

/** Every shank design the builder offers, in the order its grid shows them. */
export const SHANK_STYLES: Option<ShankStyle>[] = [
  { id: "graduated", label: "Graduated Pavé" },
  { id: "floatingMarquise", label: "Floating Marquise" },
  { id: "pave", label: "Pavé" },
  { id: "radiantDemi", label: "Radiant Demi Eternity" },
  { id: "diamondArch", label: "Diamond Arch" },
  { id: "frenchPave2", label: "French Pavé II" },
  { id: "splitProng", label: "Split Prong" },
  { id: "baguette", label: "Tapered Baguette" },
  { id: "solitaire", label: "Traditional Solitaire" },
  { id: "bloom", label: "Bloom" },
  { id: "collar", label: "Collar" },
  { id: "miniTaperedPave", label: "Mini Tapered Pavé" },
  { id: "ropeScarf", label: "Rope Scarf" },
  { id: "tripleRow", label: "Triple Row" },
  { id: "modernSplit", label: "Modern Split" },
  { id: "stepEmerald", label: "Step Emerald" },
  { id: "tripleWave", label: "Triple Wave" },
  { id: "frameTrapezoid", label: "Frame Trapezoid" },
  { id: "halfMoonSide", label: "Half Moon Side Stone" },
  { id: "chloe", label: "Chloe" },
  { id: "emerald", label: "Emerald" },
  { id: "frenchPave1", label: "French Pavé I" },
  { id: "dotDash", label: "Dot Dash" },
  { id: "flowerPetal", label: "Flower Petal" },
  { id: "intertwined", label: "Intertwined" },
  { id: "marquiseVine", label: "Marquise Vine" },
  { id: "ribbon", label: "Ribbon" },
  { id: "paveBow", label: "Pavé Bow" },
  { id: "station", label: "Station" },
  { id: "doubleBaguette", label: "Double Baguette" },
  { id: "doubleRowSide", label: "Double Row Side Stone" },
  { id: "pearSide", label: "Pear Side Stone" },
  { id: "doubleRow", label: "Double Row" },
  { id: "knifeEdge", label: "Knife Edge" },
  { id: "splitCathedral", label: "Split Cathedral" },
  { id: "trapezoidSide", label: "Trapezoid Side Stone" },
  { id: "twist", label: "Twist" },
  { id: "trio", label: "Trio" },
  { id: "channel", label: "Channel Set" },
  { id: "pave1", label: "Micro Pavé" },
  { id: "sofia", label: "Sofia" },
  { id: "traditional12", label: "Traditional Flat Edge" },
  { id: "roundSide", label: "Round Side Stone" },
  { id: "taperedPave", label: "Tapered Pavé" },
  { id: "zhuri", label: "Zhuri" },
  { id: "frenchPave3", label: "French Pavé III" },
  { id: "marquiseHalfEternity", label: "Marquise Half Eternity" },
  { id: "frenchPave4", label: "French Pavé IV" },
  { id: "marquiseSide", label: "Marquise Side Stones" },
  { id: "splitPave", label: "Split Shank Pavé" },
];

export const BAND_STYLES: Option<BandStyle>[] = [
  { id: "none", label: "None" },
  { id: "plain", label: "Plain Band" },
  { id: "knifeEdge", label: "Knife Edge" },
  { id: "eternity", label: "Pavé Eternity" },
  { id: "twist", label: "Twist" },
];

export type MetalOption = Option & { color: string; preview: string };
export type GemOption = Option & { color: string; preview: string };

export const METAL_OPTIONS: MetalOption[] = [
  {
    id: "white",
    label: "White Gold",
    color: "#dfe3e8",
    preview: "radial-gradient(circle at 30% 30%, #ffffff, #b9bec4 60%, #8d9399)",
  },
  {
    id: "yellow",
    label: "Yellow Gold",
    color: "#f2d672",
    preview: "radial-gradient(circle at 30% 30%, #fff1a8, #f2c230 55%, #c98f0e)",
  },
  {
    id: "rose",
    label: "Rose Gold",
    color: "#f3b3a3",
    preview: "radial-gradient(circle at 30% 30%, #fde6dc, #f0b2a1 55%, #b9786a)",
  },
  {
    id: "platinum",
    label: "Platinum",
    color: "#c9ccd2",
    preview: "radial-gradient(circle at 30% 30%, #f4f5f7, #a9adb4 60%, #6f747c)",
  },
];

export const GEM_OPTIONS: GemOption[] = [
  {
    id: "diamond",
    label: "Diamond",
    color: "#ffffff",
    preview: "radial-gradient(circle at 30% 30%, #ffffff, #dfe7ef 55%, #9fb0c0)",
  },
  {
    id: "ruby",
    label: "Ruby",
    color: "#e2236a",
    preview: "radial-gradient(circle at 30% 30%, #ff9ac0, #e2236a 55%, #8c0a3b)",
  },
  {
    id: "pink",
    label: "Pink Diamond",
    color: "#f6b2c0",
    preview: "radial-gradient(circle at 30% 30%, #fff0f3, #f6b2c0 55%, #c97b8d)",
  },
  {
    id: "sapphire",
    label: "Sapphire",
    color: "#2a5bea",
    preview: "radial-gradient(circle at 30% 30%, #9fbaff, #2a5bea 55%, #11286e)",
  },
  {
    id: "emerald",
    label: "Emerald",
    color: "#14a660",
    preview: "radial-gradient(circle at 30% 30%, #9ff0c4, #14a660 55%, #075232)",
  },
  {
    id: "yellow",
    label: "Yellow Diamond",
    color: "#ffd84d",
    preview: "radial-gradient(circle at 30% 30%, #fff6c9, #ffd84d 55%, #c79a0c)",
  },
];

export const DEFAULT_CONFIG: RingConfig = {
  head: "prong",
  shape: "round",
  carat: 1,
  centerGem: "ruby",
  headMetal: "yellow",
  shank: "marquiseVine",
  accentGem: "diamond",
  shankMetal: "yellow",
  band: "none",
  bandMetal: "yellow",
  ringSize: 6,
};

export const metalColor = (id: string) => (METAL_OPTIONS.find((m) => m.id === id) ?? METAL_OPTIONS[0]).color;
export const gemColor = (id: string) => (GEM_OPTIONS.find((g) => g.id === id) ?? GEM_OPTIONS[0]).color;

const labelOf = (options: Option[], id: string) => options.find((o) => o.id === id)?.label ?? id;

/** A short human-readable line describing the whole build. */
export function describe(config: RingConfig, shapeLabel: string) {
  const parts = [
    labelOf(HEAD_TYPES, config.head),
    shapeLabel,
    `${config.carat.toFixed(2)} ct`,
    labelOf(GEM_OPTIONS, config.centerGem),
    labelOf(METAL_OPTIONS, config.headMetal),
    labelOf(SHANK_STYLES, config.shank),
    labelOf(GEM_OPTIONS, config.accentGem),
    labelOf(METAL_OPTIONS, config.shankMetal),
  ];
  if (config.band !== "none") parts.push(labelOf(BAND_STYLES, config.band), labelOf(METAL_OPTIONS, config.bandMetal));
  return parts.join(" · ");
}

/** Stable build code derived from the configuration, e.g. RB-4F2A91. */
export function buildCode(config: RingConfig) {
  const text = JSON.stringify(config);
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619);
  return `RB-${(hash >>> 0).toString(16).toUpperCase().padStart(8, "0").slice(0, 6)}`;
}

const KEYS = Object.keys(DEFAULT_CONFIG) as (keyof RingConfig)[];

/** URL parameters for a ring, leaving out whatever matches `base` (a setting's own design). */
export function toSearchParams(config: RingConfig, base: RingConfig = DEFAULT_CONFIG) {
  const params = new URLSearchParams();
  for (const key of KEYS) {
    if (config[key] !== base[key]) params.set(key, String(config[key]));
  }
  return params;
}

export function fromSearchParams(
  params: URLSearchParams,
  valid: { shapes: string[] },
  base: RingConfig = DEFAULT_CONFIG,
): RingConfig {
  const config = { ...base };
  const pick = <T extends string>(key: keyof RingConfig, allowed: readonly string[]) => {
    const value = params.get(key);
    return value && allowed.includes(value) ? (value as T) : undefined;
  };
  const metals = METAL_OPTIONS.map((m) => m.id);
  const gems = GEM_OPTIONS.map((g) => g.id);

  config.head = pick<HeadType>("head", HEAD_TYPES.map((o) => o.id)) ?? config.head;
  config.shape = pick<ShapeId>("shape", valid.shapes) ?? config.shape;
  config.shank = pick<ShankStyle>("shank", SHANK_STYLES.map((o) => o.id)) ?? config.shank;
  config.band = pick<BandStyle>("band", BAND_STYLES.map((o) => o.id)) ?? config.band;
  config.centerGem = pick("centerGem", gems) ?? config.centerGem;
  config.accentGem = pick("accentGem", gems) ?? config.accentGem;
  config.headMetal = pick("headMetal", metals) ?? config.headMetal;
  config.shankMetal = pick("shankMetal", metals) ?? config.shankMetal;
  config.bandMetal = pick("bandMetal", metals) ?? config.bandMetal;

  const size = Number(params.get("ringSize"));
  if (RING_SIZES.includes(size)) config.ringSize = size;

  // Any real stone weight is accepted (a chosen diamond can be 1.07 ct), not just the preset sizes.
  const carat = Number(params.get("carat"));
  if (Number.isFinite(carat) && carat >= 0.2 && carat <= 8) config.carat = Math.round(carat * 100) / 100;
  return config;
}
