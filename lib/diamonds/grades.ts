/** Grading scales, best first. Shared by the API, the filters and the generator. */

export const STONE_TYPES = ["natural", "labgrown", "gemstone"] as const;
export type StoneType = (typeof STONE_TYPES)[number];

export const STONE_TYPE_LABELS: Record<StoneType, string> = {
  natural: "Natural Diamonds",
  labgrown: "Lab-Grown Diamonds",
  gemstone: "Colored Gemstones",
};

export const SHAPES = [
  "round",
  "oval",
  "pear",
  "emerald",
  "princess",
  "radiant",
  "marquise",
  "cushion",
  "asscher",
  "heart",
] as const;
export type Shape = (typeof SHAPES)[number];

export const SHAPE_LABELS: Record<Shape, string> = {
  round: "Round",
  oval: "Oval",
  pear: "Pear",
  emerald: "Emerald",
  princess: "Princess",
  radiant: "Radiant",
  marquise: "Marquise",
  cushion: "Cushion",
  asscher: "Asscher",
  heart: "Heart",
};

export const COLORS = ["D", "E", "F", "G", "H", "I", "J"] as const;
export type Color = (typeof COLORS)[number];

export const CLARITIES = ["FL", "IF", "VVS1", "VVS2", "VS1", "VS2", "SI1", "SI2", "SI3", "I1"] as const;
export type Clarity = (typeof CLARITIES)[number];

export const CUTS = ["Ideal", "Excellent", "Very Good", "Good"] as const;
export type Cut = (typeof CUTS)[number];

export const FINISHES = ["Excellent", "Very Good", "Good"] as const;
export type Finish = (typeof FINISHES)[number];

export const FLUORESCENCE = ["None", "Faint", "Medium", "Strong"] as const;
export type Fluorescence = (typeof FLUORESCENCE)[number];

export const LABS = ["GIA", "IGI"] as const;
export type Lab = (typeof LABS)[number];

/** Fancy coloured diamonds. */
export const FANCY_COLORS = ["Yellow", "Pink", "Blue", "Green"] as const;
export type FancyColor = (typeof FANCY_COLORS)[number];
export const FANCY_INTENSITIES = ["Fancy Light", "Fancy", "Fancy Intense", "Fancy Vivid"] as const;
export type FancyIntensity = (typeof FANCY_INTENSITIES)[number];

/** Coloured gemstones. */
export const GEM_VARIETIES = ["Sapphire", "Ruby", "Emerald", "Pink Sapphire", "Yellow Sapphire", "Morganite"] as const;
export type GemVariety = (typeof GEM_VARIETIES)[number];

/** Which rendered stone image tint each colour uses (public/stones/{shape}-{tint}.webp). */
export const TINTS = ["white", "yellow", "pink", "blue", "green", "red", "peach"] as const;
export type Tint = (typeof TINTS)[number];

export const FANCY_TINT: Record<FancyColor, Tint> = { Yellow: "yellow", Pink: "pink", Blue: "blue", Green: "green" };
export const GEM_TINT: Record<GemVariety, Tint> = {
  Sapphire: "blue",
  Ruby: "red",
  Emerald: "green",
  "Pink Sapphire": "pink",
  "Yellow Sapphire": "yellow",
  Morganite: "peach",
};

/** Swatch colours for the filter chips. */
export const TINT_SWATCH: Record<Tint, string> = {
  white: "#f4f6f8",
  yellow: "#f6cf45",
  pink: "#f19ab8",
  blue: "#2f5fe0",
  green: "#159a5b",
  red: "#c8123f",
  peach: "#f2b9a0",
};

export const SORTS = ["price-asc", "price-desc", "carat-asc", "carat-desc", "newest"] as const;
export type Sort = (typeof SORTS)[number];

export const SORT_LABELS: Record<Sort, string> = {
  "price-asc": "Price: Low to High",
  "price-desc": "Price: High to Low",
  "carat-asc": "Carat: Low to High",
  "carat-desc": "Carat: High to Low",
  newest: "Newest",
};
