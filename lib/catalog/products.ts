/**
 * Fine jewellery catalogue: earrings, necklaces, bracelets, wedding bands and
 * gemstone rings. Every piece is built from the same 3D parts as the ring
 * builder, so its photo (`public/jewelry/{slug}.webp`) is a real render; see
 * `scripts/render_thumbnails.py products`.
 */
import type { HeadType, ShankStyle } from "@/components/viewer/ring/config";
import type { ShapeId } from "@/components/viewer/ring/shapes";

export const PRODUCT_TYPES = ["earrings", "necklaces", "bracelets", "bands", "rings"] as const;
export type ProductType = (typeof PRODUCT_TYPES)[number];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  earrings: "Diamond & Gemstone Earrings",
  necklaces: "Necklaces & Pendants",
  bracelets: "Bracelets",
  bands: "Wedding Bands",
  rings: "Gemstone Rings",
};

export type Metal = "white" | "yellow" | "rose" | "platinum";
export type Gem = "diamond" | "ruby" | "pink" | "sapphire" | "emerald" | "yellow";
export type Origin = "natural" | "lab";

/** How the piece is drawn: which parts, and how they're arranged. */
export type Design =
  | { kind: "studs"; shape: ShapeId; carat: number; head: HeadType }
  | { kind: "pendant"; shape: ShapeId; carat: number; head: HeadType }
  | { kind: "bracelet"; stone: number; alternate?: Gem }
  | { kind: "band"; shank: ShankStyle; eternity: boolean }
  | { kind: "ring"; shape: ShapeId; carat: number; head: HeadType; shank: ShankStyle };

export type Product = {
  slug: string;
  sku: string;
  name: string;
  type: ProductType;
  metal: Metal;
  gem: Gem;
  origin: Origin;
  /** Total diamond or gem weight in carats. */
  ctw: number;
  price: number;
  /** Original price when the piece is on sale. */
  compareAt?: number;
  description: string;
  design: Design;
};

const METAL_NAMES: Record<Metal, string> = {
  white: "14K White Gold",
  yellow: "14K Yellow Gold",
  rose: "14K Rose Gold",
  platinum: "Platinum",
};

export const METAL_LABELS: Record<Metal, string> = {
  white: "White Gold",
  yellow: "Yellow Gold",
  rose: "Rose Gold",
  platinum: "Platinum",
};

export const GEM_LABELS: Record<Gem, string> = {
  diamond: "Diamond",
  ruby: "Ruby",
  pink: "Pink Sapphire",
  sapphire: "Sapphire",
  emerald: "Emerald",
  yellow: "Yellow Sapphire",
};

type Seed = Omit<Product, "slug" | "sku" | "name" | "description"> & { title: string; note: string };

const SEEDS: Seed[] = [
  // Earrings
  { title: "Round Diamond Stud Earrings", type: "earrings", metal: "white", gem: "diamond", origin: "natural", ctw: 0.5, price: 1150, note: "Four prong martini setting with friction posts and backs.", design: { kind: "studs", shape: "round", carat: 0.5, head: "prong" } },
  { title: "Round Lab Grown Diamond Stud Earrings", type: "earrings", metal: "white", gem: "diamond", origin: "lab", ctw: 2, price: 1325, note: "Two D colour, VS2 clarity lab grown diamonds in four prong settings.", design: { kind: "studs", shape: "round", carat: 1, head: "prong" } },
  { title: "Oval Diamond Stud Earrings", type: "earrings", metal: "yellow", gem: "diamond", origin: "natural", ctw: 1, price: 2890, compareAt: 3400, note: "Elongated oval diamonds that flatter every face shape.", design: { kind: "studs", shape: "oval", carat: 0.5, head: "prong" } },
  { title: "Princess Cut Diamond Stud Earrings", type: "earrings", metal: "platinum", gem: "diamond", origin: "natural", ctw: 1, price: 3150, note: "Crisp square princess cuts held at each corner.", design: { kind: "studs", shape: "princess", carat: 0.5, head: "prong" } },
  { title: "Cushion Halo Lab Diamond Earrings", type: "earrings", metal: "rose", gem: "diamond", origin: "lab", ctw: 1.4, price: 1680, note: "Soft cushion cuts framed by a halo of pavé diamonds.", design: { kind: "studs", shape: "cushion", carat: 0.6, head: "halo" } },
  { title: "Pear Shape Diamond Earrings", type: "earrings", metal: "yellow", gem: "diamond", origin: "natural", ctw: 1, price: 2740, note: "Teardrop diamonds pointing gently upward.", design: { kind: "studs", shape: "pear", carat: 0.5, head: "prong" } },
  { title: "Sapphire & Diamond Halo Earrings", type: "earrings", metal: "white", gem: "sapphire", origin: "natural", ctw: 1.3, price: 1490, note: "Deep blue round sapphires in a diamond halo.", design: { kind: "studs", shape: "round", carat: 0.5, head: "halo" } },
  { title: "Emerald Cut Emerald Stud Earrings", type: "earrings", metal: "yellow", gem: "emerald", origin: "natural", ctw: 1.2, price: 1890, note: "Step cut Colombian-green emeralds with a polished finish.", design: { kind: "studs", shape: "emerald", carat: 0.6, head: "prong" } },
  { title: "Ruby Halo Stud Earrings", type: "earrings", metal: "rose", gem: "ruby", origin: "natural", ctw: 1.1, price: 1390, compareAt: 1650, note: "Rich red rubies ringed with sparkling diamonds.", design: { kind: "studs", shape: "round", carat: 0.45, head: "halo" } },
  { title: "Heart Shape Pink Sapphire Earrings", type: "earrings", metal: "rose", gem: "pink", origin: "natural", ctw: 1, price: 1180, note: "Playful heart shaped pink sapphires.", design: { kind: "studs", shape: "heart", carat: 0.5, head: "prong" } },

  // Necklaces
  { title: "Round Diamond Solitaire Pendant", type: "necklaces", metal: "white", gem: "diamond", origin: "natural", ctw: 0.5, price: 1290, note: "A single round diamond on an 18 inch cable chain.", design: { kind: "pendant", shape: "round", carat: 0.5, head: "prong" } },
  { title: "Lab Grown Diamond Solitaire Pendant", type: "necklaces", metal: "yellow", gem: "diamond", origin: "lab", ctw: 1, price: 980, note: "A one carat lab grown diamond on an adjustable chain.", design: { kind: "pendant", shape: "round", carat: 1, head: "prong" } },
  { title: "Oval Halo Diamond Pendant", type: "necklaces", metal: "yellow", gem: "diamond", origin: "natural", ctw: 0.9, price: 2150, note: "An oval centre stone framed by a delicate pavé halo.", design: { kind: "pendant", shape: "oval", carat: 0.7, head: "halo" } },
  { title: "Pear Shape Diamond Pendant", type: "necklaces", metal: "rose", gem: "diamond", origin: "natural", ctw: 0.75, price: 1850, compareAt: 2200, note: "A graceful teardrop diamond in rose gold.", design: { kind: "pendant", shape: "pear", carat: 0.75, head: "prong" } },
  { title: "Emerald Halo Pendant Necklace", type: "necklaces", metal: "yellow", gem: "emerald", origin: "natural", ctw: 1.1, price: 1590, note: "Emerald cut emerald with an accent diamond halo.", design: { kind: "pendant", shape: "emerald", carat: 0.8, head: "halo" } },
  { title: "Sapphire Double Halo Pendant", type: "necklaces", metal: "white", gem: "sapphire", origin: "natural", ctw: 1.25, price: 1960, note: "A round sapphire in two rows of diamonds.", design: { kind: "pendant", shape: "round", carat: 0.6, head: "doubleHalo" } },
  { title: "Heart Diamond Pendant", type: "necklaces", metal: "rose", gem: "diamond", origin: "lab", ctw: 0.75, price: 890, note: "A heart shaped lab grown diamond, perfect as a gift.", design: { kind: "pendant", shape: "heart", carat: 0.75, head: "prong" } },
  { title: "Cushion Halo Lab Diamond Pendant", type: "necklaces", metal: "platinum", gem: "diamond", origin: "lab", ctw: 1.5, price: 1450, note: "A cushion cut lab grown diamond with a pavé halo.", design: { kind: "pendant", shape: "cushion", carat: 1.2, head: "halo" } },

  // Bracelets
  { title: "Diamond Tennis Bracelet", type: "bracelets", metal: "white", gem: "diamond", origin: "natural", ctw: 3, price: 5700, note: "A seven inch line of matched round diamonds with a box clasp.", design: { kind: "bracelet", stone: 0.11 } },
  { title: "Lab Grown Diamond Tennis Bracelet", type: "bracelets", metal: "yellow", gem: "diamond", origin: "lab", ctw: 5, price: 3250, compareAt: 3900, note: "Five carats of lab grown diamonds in yellow gold.", design: { kind: "bracelet", stone: 0.13 } },
  { title: "Petite Diamond Tennis Bracelet", type: "bracelets", metal: "rose", gem: "diamond", origin: "natural", ctw: 1.5, price: 2650, note: "A slender everyday tennis bracelet.", design: { kind: "bracelet", stone: 0.085 } },
  { title: "Sapphire Tennis Bracelet", type: "bracelets", metal: "white", gem: "sapphire", origin: "natural", ctw: 4, price: 3450, note: "Round blue sapphires set edge to edge.", design: { kind: "bracelet", stone: 0.11 } },
  { title: "Emerald & Diamond Tennis Bracelet", type: "bracelets", metal: "yellow", gem: "emerald", origin: "natural", ctw: 3.5, price: 4100, note: "Alternating emeralds and diamonds.", design: { kind: "bracelet", stone: 0.11, alternate: "diamond" } },
  { title: "Ruby & Diamond Tennis Bracelet", type: "bracelets", metal: "rose", gem: "ruby", origin: "natural", ctw: 3.2, price: 3980, note: "Alternating rubies and diamonds in rose gold.", design: { kind: "bracelet", stone: 0.11, alternate: "diamond" } },

  // Wedding bands
  { title: "Classic Polished Wedding Band", type: "bands", metal: "yellow", gem: "diamond", origin: "natural", ctw: 0, price: 480, note: "A comfort fit band with a high polish finish.", design: { kind: "band", shank: "solitaire", eternity: false } },
  { title: "Knife Edge Wedding Band", type: "bands", metal: "white", gem: "diamond", origin: "natural", ctw: 0, price: 560, note: "A fine ridge along the top catches the light.", design: { kind: "band", shank: "knifeEdge", eternity: false } },
  { title: "Pavé Diamond Eternity Band", type: "bands", metal: "white", gem: "diamond", origin: "natural", ctw: 0.5, price: 1450, note: "Diamonds all the way around in a fine pavé setting.", design: { kind: "band", shank: "pave", eternity: true } },
  { title: "Double Row Diamond Band", type: "bands", metal: "yellow", gem: "diamond", origin: "natural", ctw: 0.75, price: 1890, note: "Two rows of pavé diamonds for extra sparkle.", design: { kind: "band", shank: "doubleRow", eternity: true } },
  { title: "Channel Set Diamond Band", type: "bands", metal: "platinum", gem: "diamond", origin: "natural", ctw: 1, price: 2390, note: "Round diamonds secured between two smooth walls.", design: { kind: "band", shank: "channel", eternity: true } },
  { title: "Twisted Diamond Band", type: "bands", metal: "rose", gem: "diamond", origin: "natural", ctw: 0.4, price: 1290, compareAt: 1490, note: "Polished and pavé strands twisted together.", design: { kind: "band", shank: "twist", eternity: true } },
  { title: "Marquise Vine Band", type: "bands", metal: "yellow", gem: "diamond", origin: "natural", ctw: 0.6, price: 1650, note: "Marquise diamonds scattered along a vine.", design: { kind: "band", shank: "marquiseVine", eternity: true } },
  { title: "Baguette Eternity Band", type: "bands", metal: "white", gem: "diamond", origin: "lab", ctw: 1.5, price: 1590, note: "Lab grown baguettes in an unbroken line.", design: { kind: "band", shank: "baguette", eternity: true } },
  { title: "Sapphire Eternity Band", type: "bands", metal: "white", gem: "sapphire", origin: "natural", ctw: 0.8, price: 1350, note: "Blue sapphires set all the way around.", design: { kind: "band", shank: "pave", eternity: true } },

  // Gemstone rings
  { title: "Oval Sapphire Halo Ring", type: "rings", metal: "white", gem: "sapphire", origin: "natural", ctw: 2.1, price: 2450, note: "A vivid oval sapphire in a diamond halo on a pavé band.", design: { kind: "ring", shape: "oval", carat: 1.75, head: "halo", shank: "pave" } },
  { title: "Emerald Cut Emerald Ring", type: "rings", metal: "yellow", gem: "emerald", origin: "natural", ctw: 1.6, price: 2180, note: "A step cut emerald on a slim knife edge band.", design: { kind: "ring", shape: "emerald", carat: 1.5, head: "prong", shank: "knifeEdge" } },
  { title: "Cushion Ruby Double Halo Ring", type: "rings", metal: "rose", gem: "ruby", origin: "natural", ctw: 1.8, price: 2690, compareAt: 3100, note: "A cushion ruby framed by two rows of diamonds.", design: { kind: "ring", shape: "cushion", carat: 1.25, head: "doubleHalo", shank: "pave" } },
  { title: "Pink Sapphire Pear Ring", type: "rings", metal: "rose", gem: "pink", origin: "natural", ctw: 1.3, price: 1790, note: "A soft pink pear on a twisted band.", design: { kind: "ring", shape: "pear", carat: 1.25, head: "prong", shank: "twist" } },
  { title: "Yellow Sapphire Radiant Ring", type: "rings", metal: "yellow", gem: "yellow", origin: "natural", ctw: 2, price: 1990, note: "A sunny radiant cut sapphire with a hidden halo.", design: { kind: "ring", shape: "radiant", carat: 1.75, head: "hiddenHalo", shank: "doubleRow" } },
  { title: "Marquise Sapphire Vine Ring", type: "rings", metal: "platinum", gem: "sapphire", origin: "natural", ctw: 1.4, price: 2290, note: "A marquise sapphire on a vine of diamonds.", design: { kind: "ring", shape: "marquise", carat: 1.1, head: "prong", shank: "marquiseVine" } },
];

const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

function fullName(seed: Seed) {
  const weight = seed.ctw > 0 ? ` ${seed.ctw.toFixed(2).replace(/^0/, "")}CTW` : "";
  return `${METAL_NAMES[seed.metal]}${weight} ${seed.title}`;
}

export const PRODUCTS: Product[] = SEEDS.map(({ title, note, ...seed }, i) => {
  const name = fullName({ title, note, ...seed });
  return {
    ...seed,
    name,
    slug: slugify(name),
    sku: `ML-${String(3101 + i)}`,
    description: `${note} Crafted in ${METAL_NAMES[seed.metal].toLowerCase()}${
      seed.ctw > 0 ? ` with ${seed.ctw} carats total ${seed.origin === "lab" ? "lab grown " : ""}${GEM_LABELS[seed.gem].toLowerCase()} weight` : ""
    }.`,
  };
});

export const getProduct = (slug: string) => PRODUCTS.find((p) => p.slug === slug) ?? null;

export const productImage = (p: Pick<Product, "slug">) => `/jewelry/${p.slug}.webp`;

/** DAZORA's own collection lines, shown as the "designer" of each piece. */
export const DESIGNER_LABELS = {
  signature: "DAZORA Signature",
  lab: "DAZORA Lab",
  couleur: "Couleur by DAZORA",
  bridal: "DAZORA Bridal",
} as const;
export type Designer = keyof typeof DESIGNER_LABELS;

export function productDesigner(p: Pick<Product, "type" | "gem" | "origin">): Designer {
  if (p.type === "bands") return "bridal";
  if (p.origin === "lab") return "lab";
  if (p.gem !== "diamond") return "couleur";
  return "signature";
}
