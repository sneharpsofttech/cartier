/**
 * Collections (`/collections/{handle}`) and the filters on a collection page.
 * The same grid and filter sidebar also list the engagement ring settings.
 */
import {
  DESIGNER_LABELS,
  GEM_LABELS,
  METAL_LABELS,
  PRODUCTS,
  PRODUCT_TYPE_LABELS,
  productDesigner,
  productImage,
  type Gem,
  type Product,
} from "./products";

export type Collection = {
  handle: string;
  title: string;
  intro: string;
  /** Photo for the page header; the shop's default when left out. */
  banner?: string;
  includes: (p: Product) => boolean;
};

export const COLLECTIONS: Collection[] = [
  {
    handle: "fine-jewelry",
    title: "Fine Jewelry Collection",
    intro:
      "Timeless. Elegant. Always in style. Diamond studs, tennis bracelets, solitaire pendants and gemstone rings: the pieces every jewelry box is built on, made to be worn every day and handed down.",
    includes: () => true,
  },
  {
    handle: "earrings",
    title: "Earrings",
    intro: "Diamond and gemstone studs and halo earrings, from a first pair of studs to an anniversary statement.",
    banner: "/home/band-earrings.webp",
    includes: (p) => p.type === "earrings",
  },
  {
    handle: "necklaces",
    title: "Necklaces & Pendants",
    intro: "Solitaire and halo pendants on fine chains, in every shape and in white, yellow and rose gold.",
    banner: "/home/model-profile-earrings.webp",
    includes: (p) => p.type === "necklaces",
  },
  {
    handle: "bracelets",
    title: "Bracelets",
    intro: "Tennis bracelets in diamond, sapphire, emerald and ruby, finished with a secure box clasp.",
    includes: (p) => p.type === "bracelets",
  },
  {
    handle: "wedding-bands",
    title: "Wedding Bands",
    intro: "Polished classics and diamond eternity bands, made to sit beautifully beside your engagement ring.",
    banner: "/home/band-rings.webp",
    includes: (p) => p.type === "bands",
  },
  {
    handle: "gemstone-rings",
    title: "Gemstone Rings",
    intro: "Sapphire, emerald, ruby and more, set with diamond halos and pavé bands for a ring with colour.",
    banner: "/home/band-rings.webp",
    includes: (p) => p.type === "rings",
  },
  {
    handle: "lab-grown-jewelry",
    title: "Lab Grown Diamond Jewelry",
    intro: "Real diamonds, grown above ground: the same fire and brilliance at a gentler price.",
    includes: (p) => p.origin === "lab",
  },
  {
    handle: "gemstone-jewelry",
    title: "Gemstone Jewelry",
    intro: "Earrings, pendants, bracelets and rings set with coloured gemstones.",
    banner: "/home/band-necklace.webp",
    includes: (p) => p.gem !== "diamond",
  },
  {
    handle: "sale",
    title: "Sale",
    intro: "Selected pieces at a special price, while they last.",
    includes: (p) => p.compareAt !== undefined,
  },
  {
    handle: "gifts-under-1000",
    title: "Gifts Under $1,000",
    intro: "Thoughtful gifts for birthdays, anniversaries and every celebration in between.",
    includes: (p) => p.price < 1000,
  },
  {
    handle: "gifts-under-2000",
    title: "Gifts Under $2,000",
    intro: "Diamond studs, pendants and bands to mark a moment that matters.",
    includes: (p) => p.price < 2000,
  },
];

export const getCollection = (handle: string) => COLLECTIONS.find((c) => c.handle === handle) ?? null;

/** One card in a collection grid: a product or a ring setting. */
export type GridItem = {
  href: string;
  image: string;
  title: string;
  price: number;
  compareAt?: number;
  /** "from" prices, for settings that vary with the metal. */
  from?: boolean;
  /** Filter values by group id, e.g. { type: "earrings", metal: "white" }. */
  facets: Record<string, string[]>;
  /** Set for pieces that can go straight into the bag (rings need options chosen first). */
  cartId?: string;
  /** A styled photo of jewelry being worn, shown when the card is hovered. */
  hoverImage?: string;
};

/** Styled photos of each kind of piece being worn, for the cards' hover view. */
export const LIFESTYLE: Record<string, string[]> = {
  earrings: ["/home/model-profile-earrings.webp", "/home/band-earrings.webp"],
  necklaces: ["/home/model-sapphire-set.webp", "/home/emerald-pendant.webp"],
  bracelets: ["/home/band-bracelet.webp"],
  bands: ["/home/rings-on-hand.webp", "/home/band-rings.webp"],
  rings: ["/home/band-rings.webp", "/home/rings-on-hand.webp"],
};

/** Pick one of a kind's styled photos, the same one every time for a given piece. */
export function lifestyleFor(kind: string, key: string) {
  const options = LIFESTYLE[kind];
  if (!options?.length) return undefined;
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return options[hash % options.length];
}

const WEIGHT_LABELS: Record<string, string> = {
  "under-050": "Under 0.50 ct",
  "050-099": "0.50 – 0.99 ct",
  "100-199": "1.00 – 1.99 ct",
  "200-plus": "2.00 ct & Over",
};

/** Total gem weight bucket, for the "Filter By Weight" list. */
function weightBucket(ctw: number) {
  if (ctw <= 0) return null;
  if (ctw < 0.5) return "under-050";
  if (ctw < 1) return "050-099";
  if (ctw < 2) return "100-199";
  return "200-plus";
}

export type FilterGroup = {
  id: string;
  label: string;
  options: { id: string; label: string }[];
  /** Starts folded away in the sidebar. */
  collapsed?: boolean;
  /** Listed below the price slider. */
  afterPrice?: boolean;
};

/** Colour names for side stones. */
const ACCENT_COLOR: Record<Gem, string> = {
  diamond: "white",
  ruby: "red",
  pink: "pink",
  sapphire: "blue",
  emerald: "green",
  yellow: "yellow",
};

const ACCENT_LABELS: Record<string, string> = {
  white: "White",
  blue: "Blue",
  green: "Green",
  red: "Red",
  pink: "Pink",
  yellow: "Yellow",
};

/** Shanks that carry small stones (everything except plain polished bands). */
const PLAIN_SHANKS = new Set(["solitaire", "knifeEdge"]);

/** The colour of a piece's smaller side stones (halo, pavé, alternating links), if it has any. */
function productAccent(p: Product): string | null {
  const d = p.design;
  switch (d.kind) {
    case "studs":
    case "pendant":
      return d.head === "prong" ? null : ACCENT_COLOR.diamond;
    case "ring":
      return d.head === "prong" && PLAIN_SHANKS.has(d.shank) ? null : ACCENT_COLOR.diamond;
    case "bracelet":
      return d.alternate ? ACCENT_COLOR[d.alternate] : null;
    case "band":
      return d.eternity ? ACCENT_COLOR[p.gem] : null;
  }
}

/** Shape names in the order the sidebar lists them. */
export const SHAPE_FACET_LABELS: Record<string, string> = {
  round: "Round",
  oval: "Oval",
  emerald: "Emerald Cut",
  pear: "Pear",
  princess: "Princess",
  cushion: "Cushion",
  radiant: "Radiant",
  marquise: "Marquise",
  asscher: "Asscher",
  heart: "Heart",
  baguette: "Baguette",
};

const STYLE_LABELS: Record<string, string> = {
  solitaire: "Solitaire",
  bezel: "Bezel",
  halo: "Halo",
  "double-halo": "Double Halo",
  "hidden-halo": "Hidden Halo",
  tennis: "Tennis",
  eternity: "Eternity",
  classic: "Classic Band",
  "knife-edge": "Knife Edge",
  twist: "Twist",
  vine: "Vine",
};

const HEAD_STYLE: Record<string, string> = {
  prong: "solitaire",
  bezel: "bezel",
  halo: "halo",
  doubleHalo: "double-halo",
  hiddenHalo: "hidden-halo",
};

const BAND_STYLE: Record<string, string> = { solitaire: "classic", knifeEdge: "knife-edge", twist: "twist", marquiseVine: "vine" };

/** The main stone's shape, if the piece has stones. */
function productShape(p: Product): string | null {
  const d = p.design;
  if ("shape" in d) return d.shape;
  if (d.kind === "bracelet") return "round";
  if (!d.eternity) return null;
  return d.shank === "baguette" ? "baguette" : d.shank === "marquiseVine" ? "marquise" : "round";
}

function productStyle(p: Product): string {
  const d = p.design;
  if ("head" in d) return HEAD_STYLE[d.head];
  if (d.kind === "bracelet") return "tennis";
  return BAND_STYLE[d.shank] ?? "eternity";
}

export function productItem(p: Product): GridItem {
  const shape = productShape(p);
  const accent = productAccent(p);
  return {
    href: `/products/${p.slug}`,
    image: productImage(p),
    title: p.name,
    price: p.price,
    compareAt: p.compareAt,
    cartId: p.slug,
    hoverImage: lifestyleFor(p.type, p.slug),
    facets: {
      weight: weightBucket(p.ctw) ? [weightBucket(p.ctw)!] : [],
      type: [p.type],
      origin: [p.origin],
      metal: [p.metal],
      shape: shape ? [shape] : [],
      gem: [p.gem],
      style: [productStyle(p)],
      accent: accent ? [accent] : [],
      designer: [productDesigner(p)],
    },
  };
}

/** Filter groups for a set of products, offering only values that occur, in sidebar order. */
export function productFilters(products: Product[]): FilterGroup[] {
  const items = products.map(productItem);
  const group = (
    id: string,
    label: string,
    labels: Record<string, string>,
    { collapsed = false, afterPrice = false } = {},
  ): FilterGroup => {
    const present = new Set(items.flatMap((i) => i.facets[id]));
    return {
      id,
      label,
      collapsed,
      afterPrice,
      options: Object.entries(labels)
        .filter(([value]) => present.has(value))
        .map(([value, text]) => ({ id: value, label: text })),
    };
  };
  // Sidebar order: product type, weight and price first (as on the shop page), then the finer filters.
  return [
    group("type", "Product Type", PRODUCT_TYPE_LABELS),
    group("weight", "Filter By Weight", WEIGHT_LABELS),
    group("origin", "Diamond Type", { natural: "Diamond", lab: "Lab Diamond" }, { afterPrice: true }),
    group("metal", "Metal Color", METAL_LABELS, { afterPrice: true }),
    group("shape", "Diamond Shape", SHAPE_FACET_LABELS, { afterPrice: true }),
    group("gem", "Gemstone", GEM_LABELS, { afterPrice: true, collapsed: true }),
    group("style", "Style", STYLE_LABELS, { afterPrice: true, collapsed: true }),
    group("accent", "Accent Gemstone Color", ACCENT_LABELS, { afterPrice: true, collapsed: true }),
    group("designer", "Designer", DESIGNER_LABELS, { afterPrice: true, collapsed: true }),
  ].filter((g) => g.options.length > 1);
}

export function collectionProducts(collection: Collection) {
  return PRODUCTS.filter(collection.includes);
}
