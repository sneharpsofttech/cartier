import {
  CLARITIES,
  COLORS,
  CUTS,
  FANCY_COLORS,
  FANCY_INTENSITIES,
  FANCY_TINT,
  FINISHES,
  FLUORESCENCE,
  GEM_TINT,
  GEM_VARIETIES,
  SHAPES,
  type Clarity,
  type Color,
  type Cut,
  type GemVariety,
  type Shape,
  type StoneType,
} from "./grades";
import type { Stone } from "./types";

/**
 * Demo inventory: a deterministic, realistic-looking stock list. Replace
 * `generateInventory` with a supplier feed (Nivoda, RapNet, VDB…) to go live;
 * everything else (API, filters, pages) works off the `Stone` type.
 */

const COUNTS: Record<StoneType, number> = { natural: 2600, labgrown: 4800, gemstone: 900 };

/** Small, fast seeded PRNG so the inventory is the same on every run. */
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Rand = () => number;

function weighted<T>(rand: Rand, items: readonly T[], weights: number[]) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

/** Log-normal-ish carat weights: most stones 0.5–2 ct, a long tail to `max`. */
function caratWeight(rand: Rand, median: number, max: number) {
  const u = Math.max(rand(), 1e-6);
  const v = rand();
  const normal = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  const ct = median * Math.exp(normal * 0.55);
  return Math.round(Math.min(max, Math.max(0.3, ct)) * 100) / 100;
}

/** Length/width ratios and how much each shape weighs per mm (relative to round). */
const SHAPE_SPEC: Record<Shape, { ratio: [number, number]; weight: number; price: number; share: number }> = {
  round: { ratio: [1, 1.01], weight: 1, price: 1.15, share: 30 },
  oval: { ratio: [1.3, 1.5], weight: 0.95, price: 1, share: 16 },
  pear: { ratio: [1.45, 1.7], weight: 0.95, price: 0.95, share: 8 },
  emerald: { ratio: [1.3, 1.5], weight: 1.05, price: 0.92, share: 9 },
  princess: { ratio: [1, 1.04], weight: 1.1, price: 0.88, share: 6 },
  radiant: { ratio: [1.15, 1.35], weight: 1.05, price: 0.9, share: 8 },
  marquise: { ratio: [1.8, 2.1], weight: 0.85, price: 0.9, share: 5 },
  cushion: { ratio: [1, 1.15], weight: 1.05, price: 0.9, share: 9 },
  asscher: { ratio: [1, 1.04], weight: 1.1, price: 0.9, share: 4 },
  heart: { ratio: [0.95, 1.05], weight: 1, price: 0.92, share: 5 },
};

const COLOR_PRICE: Record<Color, number> = { D: 1.3, E: 1.2, F: 1.12, G: 1, H: 0.9, I: 0.8, J: 0.7 };
const CLARITY_PRICE: Record<Clarity, number> = {
  FL: 1.8, IF: 1.55, VVS1: 1.35, VVS2: 1.25, VS1: 1.12, VS2: 1, SI1: 0.86, SI2: 0.74, SI3: 0.64, I1: 0.5,
};
const CUT_PRICE: Record<Cut, number> = { Ideal: 1.1, Excellent: 1, "Very Good": 0.9, Good: 0.8 };

const GEM_INFO: Record<GemVariety, { perCarat: number; origins: string[]; treatments: string[] }> = {
  Sapphire: { perCarat: 1400, origins: ["Sri Lanka", "Madagascar", "Australia", "Montana"], treatments: ["Heated", "Unheated"] },
  Ruby: { perCarat: 2200, origins: ["Mozambique", "Thailand", "Madagascar"], treatments: ["Heated", "Unheated"] },
  Emerald: { perCarat: 1600, origins: ["Colombia", "Zambia", "Brazil"], treatments: ["Minor oil", "Moderate oil"] },
  "Pink Sapphire": { perCarat: 1200, origins: ["Madagascar", "Sri Lanka"], treatments: ["Heated", "Unheated"] },
  "Yellow Sapphire": { perCarat: 900, origins: ["Sri Lanka", "Madagascar"], treatments: ["Heated", "Unheated"] },
  Morganite: { perCarat: 180, origins: ["Brazil", "Madagascar"], treatments: ["None"] },
};

const PREFIX: Record<StoneType, string> = { natural: "ND", labgrown: "LG", gemstone: "GS" };

function makeStone(type: StoneType, index: number, rand: Rand): Stone {
  const shape = weighted(rand, SHAPES, SHAPES.map((s) => SHAPE_SPEC[s].share));
  const spec = SHAPE_SPEC[shape];
  const carat = caratWeight(rand, type === "labgrown" ? 1.25 : type === "natural" ? 0.9 : 1.1, type === "labgrown" ? 8 : 5);

  // Mostly white diamonds; a slice of fancy colours.
  const fancyDiamond = type !== "gemstone" && rand() < (type === "labgrown" ? 0.12 : 0.06);
  const color: Color | null = type === "gemstone" || fancyDiamond ? null : weighted(rand, COLORS, [12, 17, 19, 20, 15, 10, 7]);
  const fancy = fancyDiamond
    ? {
        color: weighted(rand, FANCY_COLORS, [55, 25, 12, 8]),
        intensity: weighted(rand, FANCY_INTENSITIES, [25, 35, 28, 12]),
      }
    : null;
  const variety = type === "gemstone" ? weighted(rand, GEM_VARIETIES, [30, 18, 18, 12, 12, 10]) : null;
  const gem = variety
    ? {
        variety,
        origin: GEM_INFO[variety].origins[Math.floor(rand() * GEM_INFO[variety].origins.length)],
        treatment: weighted(rand, GEM_INFO[variety].treatments, GEM_INFO[variety].treatments.map((_, i) => (i ? 1 : 3))),
      }
    : null;

  const clarity: Clarity | null = type === "gemstone" ? null : weighted(rand, CLARITIES, [1, 3, 9, 12, 18, 20, 18, 11, 4, 4]);
  const cut: Cut | null = type === "gemstone" ? null : weighted(rand, CUTS, [30, 40, 22, 8]);
  const polish = weighted(rand, FINISHES, [70, 25, 5]);
  const symmetry = weighted(rand, FINISHES, [62, 30, 8]);
  const fluorescence = type === "labgrown" ? weighted(rand, FLUORESCENCE, [85, 10, 4, 1]) : weighted(rand, FLUORESCENCE, [60, 22, 12, 6]);
  const lab = type === "natural" ? weighted(rand, ["GIA", "IGI"] as const, [80, 20]) : weighted(rand, ["GIA", "IGI"] as const, [30, 70]);
  const heartsArrows = shape === "round" && cut === "Ideal" && rand() < 0.35;

  // Size from weight: a 1 ct round is about 6.5 mm across.
  const ratio = Math.round((spec.ratio[0] + rand() * (spec.ratio[1] - spec.ratio[0])) * 100) / 100;
  const width = 6.5 * Math.cbrt(carat / spec.weight) / Math.sqrt(ratio);
  const depthPct = Math.round((shape === "round" ? 60 + rand() * 3.2 : 61 + rand() * 9) * 10) / 10;
  const tablePct = Math.round((shape === "round" ? 54 + rand() * 6 : 57 + rand() * 12) * 10) / 10;
  const measurements: [number, number, number] = [
    Math.round(width * ratio * 100) / 100,
    Math.round(width * 100) / 100,
    Math.round(width * (depthPct / 100) * 100) / 100,
  ];

  // Price per carat climbs with size; lab-grown is a fraction of natural.
  let price: number;
  if (gem && variety) {
    price = GEM_INFO[variety].perCarat * Math.pow(carat, 1.35) * (gem.treatment === "Unheated" ? 1.6 : 1) * (0.7 + rand() * 0.6);
  } else {
    const grade = (color ? COLOR_PRICE[color] : 1) * CLARITY_PRICE[clarity!] * CUT_PRICE[cut!] * spec.price;
    const fancyMult = fancy ? { Yellow: 1.4, Pink: 6, Blue: 7, Green: 5 }[fancy.color] * (1 + FANCY_INTENSITIES.indexOf(fancy.intensity) * 0.45) : 1;
    const perCarat = type === "natural" ? 4200 * Math.pow(carat, 0.85) : 520 * Math.pow(carat, 0.3);
    price = perCarat * carat * grade * (type === "labgrown" && fancy ? 1.3 : fancyMult) * (0.85 + rand() * 0.3);
  }
  // Floor for the smallest, lowest-grade stones, still varying with weight.
  price = Math.round(Math.max(130 + carat * 70 + rand() * 30, price));

  const tint = gem ? GEM_TINT[gem.variety] : fancy ? FANCY_TINT[fancy.color] : "white";
  const id = `${PREFIX[type]}-${String(100000 + index * 7 + Math.floor(rand() * 7)).padStart(6, "0")}`;
  const certificate = `${lab === "GIA" ? "" : "LG"}${Math.floor(1e9 + rand() * 9e9)}`;

  return {
    id,
    type,
    shape,
    carat,
    price,
    color,
    fancy,
    gem,
    clarity,
    cut,
    polish,
    symmetry,
    fluorescence,
    lab,
    certificate,
    measurements,
    depthPct,
    tablePct,
    ratio,
    heartsArrows,
    tint,
    image: `/stones/${shape}-${tint}.webp`,
    listedDaysAgo: Math.floor(rand() * 180),
  };
}

export function generateInventory(): Stone[] {
  const stones: Stone[] = [];
  (Object.keys(COUNTS) as StoneType[]).forEach((type, t) => {
    const rand = mulberry32(20261029 + t * 7919);
    for (let i = 0; i < COUNTS[type]; i++) stones.push(makeStone(type, i, rand));
  });
  return stones;
}
