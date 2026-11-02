import type { RingConfig } from "@/components/viewer/ring/config";
import type { Stone } from "./types";

/**
 * Links between the three steps (stone, setting, review).
 *
 * A chosen setting travels as `setting=<slug>` plus the builder's own
 * parameters (metal, size…); a chosen stone travels as `stone=<id>`. The stone
 * list carries the setting part along in `ring`, so choosing a diamond never
 * loses the setting, and the setting pages carry `stone`.
 */

/** Builder centre-gem colour that best matches a stone. */
export function stoneGemColor(stone: Stone) {
  if (stone.gem) {
    return { Sapphire: "sapphire", Ruby: "ruby", Emerald: "emerald", "Pink Sapphire": "pink", "Yellow Sapphire": "yellow", Morganite: "pink" }[
      stone.gem.variety
    ];
  }
  if (stone.fancy) return { Yellow: "yellow", Pink: "pink", Blue: "sapphire", Green: "emerald" }[stone.fancy.color];
  return "diamond";
}

/** A ring's settings with the centre stone's shape, weight and colour taken from the chosen stone. */
export function withStone(config: RingConfig, stone: Stone | null): RingConfig {
  if (!stone) return config;
  return { ...config, shape: stone.shape, carat: stone.carat, centerGem: stoneGemColor(stone) };
}

/** A setting's product page, with its options and any chosen stone. */
export function settingUrl(slug: string, query: string | URLSearchParams = "") {
  const p = new URLSearchParams(query);
  p.delete("setting");
  const qs = p.toString();
  return `/settings/${slug}${qs ? `?${qs}` : ""}`;
}

/** Where "Select this stone" goes: back to the chosen setting, or on to pick one. */
export function selectStoneUrl(stone: Stone, ring = "") {
  const p = new URLSearchParams(ring);
  p.set("stone", stone.id);
  p.set("shape", stone.shape);
  p.set("carat", stone.carat.toFixed(2));
  p.set("centerGem", stoneGemColor(stone));
  const slug = p.get("setting");
  if (slug) return settingUrl(slug, p);
  return `/settings?stone=${encodeURIComponent(stone.id)}`;
}

/** Stone list URL that remembers the setting chosen so far. */
export function stoneListUrl(ring = "", extra: Record<string, string> = {}) {
  const p = new URLSearchParams(extra);
  if (!p.has("diamond_type")) p.set("diamond_type", "natural");
  if (ring) p.set("ring", ring);
  return `/diamonds?${p.toString()}`;
}

/** Review URL for a ring query (setting, its options and the stone). */
export const reviewUrl = (ringQuery: string) => `/review?${ringQuery}`;
