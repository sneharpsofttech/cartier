import type {
  Clarity,
  Color,
  Cut,
  FancyColor,
  FancyIntensity,
  Finish,
  Fluorescence,
  GemVariety,
  Lab,
  Shape,
  StoneType,
  Tint,
} from "./grades";

export type Stone = {
  /** Stock number, e.g. "LG-104233". */
  id: string;
  type: StoneType;
  shape: Shape;
  carat: number;
  /** Price in USD. */
  price: number;
  /** White diamonds: D–J. Fancy diamonds and gemstones: null. */
  color: Color | null;
  fancy: { color: FancyColor; intensity: FancyIntensity } | null;
  gem: { variety: GemVariety; origin: string; treatment: string } | null;
  clarity: Clarity | null;
  cut: Cut | null;
  polish: Finish;
  symmetry: Finish;
  fluorescence: Fluorescence;
  lab: Lab;
  certificate: string;
  /** Length x width x depth in mm. */
  measurements: [number, number, number];
  depthPct: number;
  tablePct: number;
  /** Length to width ratio. */
  ratio: number;
  heartsArrows: boolean;
  tint: Tint;
  image: string;
  /** Days since the stone was listed (for "newest"). */
  listedDaysAgo: number;
};

/** A short name for a stone, e.g. "Round 0.35ct D VS1" or "Oval 1.20ct Sapphire". */
export function stoneTitle(s: Stone) {
  const shape = s.shape.charAt(0).toUpperCase() + s.shape.slice(1);
  const ct = `${s.carat.toFixed(2)}ct`;
  if (s.gem) return `${shape} ${ct} ${s.gem.variety}`;
  if (s.fancy) return `${shape} ${ct} ${s.fancy.intensity} ${s.fancy.color}`;
  return `${shape} ${ct} ${s.color} ${s.clarity}`;
}

export const formatPrice = (usd: number) =>
  usd.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
