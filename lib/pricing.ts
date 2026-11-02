import type { BandStyle, HeadType, RingConfig, ShankStyle } from "@/components/viewer/ring/config";

/** Setting prices in USD (14k gold). Platinum costs more; the centre stone is priced separately. */
const SHANK_PRICE: Record<ShankStyle, number> = {
  solitaire: 950,
  knifeEdge: 1050,
  pave: 1450,
  graduated: 1550,
  doubleRow: 1850,
  channel: 1700,
  splitPave: 1900,
  twist: 1150,
  marquiseVine: 2100,
  marquiseSide: 1950,
  baguette: 2250,
  floatingMarquise: 1750,
  radiantDemi: 2450,
  diamondArch: 1650,
  frenchPave1: 1550,
  frenchPave2: 1750,
  frenchPave3: 1650,
  frenchPave4: 1600,
  pave1: 1750,
  taperedPave: 1550,
  miniTaperedPave: 1350,
  splitProng: 1650,
  bloom: 1850,
  collar: 1950,
  ropeScarf: 1350,
  tripleRow: 2250,
  modernSplit: 1750,
  stepEmerald: 2150,
  tripleWave: 1250,
  frameTrapezoid: 2050,
  halfMoonSide: 2100,
  chloe: 1250,
  emerald: 2050,
  dotDash: 1650,
  flowerPetal: 1750,
  intertwined: 1350,
  ribbon: 1150,
  paveBow: 1850,
  station: 1450,
  doubleBaguette: 2350,
  doubleRowSide: 1850,
  pearSide: 2050,
  splitCathedral: 1250,
  trapezoidSide: 2050,
  trio: 2250,
  sofia: 1850,
  traditional12: 1000,
  roundSide: 1950,
  zhuri: 1750,
  marquiseHalfEternity: 2350,
};

const HEAD_PRICE: Record<HeadType, number> = { prong: 0, bezel: 250, hiddenHalo: 450, halo: 750, doubleHalo: 1250 };

const BAND_PRICE: Record<BandStyle, number> = { none: 0, plain: 650, knifeEdge: 750, eternity: 1650, twist: 850 };

const metalFactor = (id: string) => (id === "platinum" ? 1.35 : 1);

export type SettingQuote = { setting: number; band: number; total: number };

export function quoteSetting(config: RingConfig): SettingQuote {
  const setting =
    SHANK_PRICE[config.shank] * metalFactor(config.shankMetal) + HEAD_PRICE[config.head] * metalFactor(config.headMetal);
  const band = BAND_PRICE[config.band] * metalFactor(config.bandMetal);
  return { setting: Math.round(setting), band: Math.round(band), total: Math.round(setting + band) };
}
