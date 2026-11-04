/** Main navigation: top-level items, each with an optional dropdown or mega menu. */
export type MenuLink = { label: string; href: string };
/** A column of links; with `image`, a wide photo sits above its title (leading to its first link). */
export type MenuColumn = { title: string; links: MenuLink[]; image?: string; imageFocus?: string };
/** Photo card at the right of a mega menu. */
export type MenuFeature = { image: string; kicker: string; title: string; href: string };
export type MenuItem = {
  label: string;
  href: string;
  columns?: MenuColumn[];
  feature?: MenuFeature;
  /** A small tag beside the label, such as "3D". */
  badge?: string;
};

const pathOf = (href: string) => href.split("?")[0];

/**
 * Which top-level menu item a page belongs to, for highlighting it: the item
 * that links straight there, else a plain dropdown listing it, else a mega
 * menu listing it; product and detail pages go to their section.
 */
export function menuSection(path: string, productType?: string): string | null {
  // "Build Your Own Ring" is the button beside the navbar, not one of its items.
  const items = MENU.filter((m) => m.label !== "Build Your Own Ring");
  const own = items.find((m) => pathOf(m.href) === path);
  if (own) return own.label;
  const lists = (m: MenuItem) => m.columns?.some((c) => c.links.some((l) => pathOf(l.href) === path));
  const listed = items.find((m) => m.columns?.length === 1 && lists(m)) ?? items.find(lists);
  if (listed) return listed.label;
  if (path.startsWith("/diamonds")) return "Diamonds";
  if (path.startsWith("/settings") || path.startsWith("/engagement-rings") || path === "/review") return "Love & Engagement";
  if (path.startsWith("/products")) return productType === "bands" ? "Love & Engagement" : "Fine Jewelry";
  if (path.startsWith("/collections")) return "Fine Jewelry";
  return null;
}

export const MENU: MenuItem[] = [
  {
    label: "Diamonds",
    href: "/diamonds?diamond_type=natural",
    columns: [
      {
        title: "Diamonds",
        links: [
          { label: "Natural Diamond Search", href: "/diamonds?diamond_type=natural" },
          { label: "Lab Grown Diamond Search", href: "/diamonds?diamond_type=labgrown" },
          { label: "Colored Gemstone Search", href: "/diamonds?diamond_type=gemstone" },
          { label: "Shop Diamond Jewelry", href: "/collections/fine-jewelry?gem=diamond" },
          { label: "Lab Grown Diamond Jewelry", href: "/collections/lab-grown-jewelry" },
        ],
      },
    ],
  },
  {
    label: "Love & Engagement",
    // The section's landing page; the links in its menu go to the product lists.
    href: "/engagement",
    columns: [
      {
        title: "Engagement",
        image: "/photos/couple-bands.webp",
        links: [
          { label: "Diamond Engagement Rings", href: "/settings" },
          { label: "Find Your Diamond", href: "/diamonds?diamond_type=natural" },
          { label: "Custom Design", href: "/settings/aurora" },
          { label: "Build Your Ring", href: "/settings" },
          { label: "Gemstone Engagement Rings", href: "/collections/gemstone-rings" },
          { label: "Explore All Engagement", href: "/engagement" },
        ],
      },
      {
        title: "Wedding Bands",
        image: "/photos/couple-rings.webp",
        // The groom's band, low in the photo.
        imageFocus: "center 76%",
        links: [
          { label: "Women's Wedding Bands", href: "/collections/womens-wedding-bands" },
          { label: "Men's Wedding Bands", href: "/collections/mens-wedding-bands" },
          { label: "Diamond Eternity Bands", href: "/collections/eternity-bands" },
        ],
      },
      {
        title: "Bridal Collections",
        image: "/photos/bride-kundan.webp",
        links: [
          { label: "DAZORA Signature", href: "/settings?designer=signature" },
          { label: "DAZORA Atelier", href: "/settings?designer=atelier" },
          { label: "DAZORA Éclat", href: "/settings?designer=eclat" },
          { label: "DAZORA Heritage", href: "/settings?designer=heritage" },
        ],
      },
      {
        title: "Loose Diamonds",
        image: "/home/diamond-set.webp",
        links: [
          { label: "Natural Diamond Search", href: "/diamonds?diamond_type=natural" },
          { label: "Lab Grown Diamond Search", href: "/diamonds?diamond_type=labgrown" },
          { label: "Colored Gemstone Search", href: "/diamonds?diamond_type=gemstone" },
        ],
      },
    ],
  },
  {
    label: "Fine Jewelry",
    href: "/jewelry",
    columns: [
      {
        title: "Shop by Category",
        image: "/home/band-necklace.webp",
        links: [
          { label: "Shop All Jewelry", href: "/collections/fine-jewelry" },
          { label: "Earrings", href: "/collections/earrings" },
          { label: "Necklaces & Pendants", href: "/collections/necklaces" },
          { label: "Bracelets", href: "/collections/bracelets" },
          { label: "Gemstone Rings", href: "/collections/gemstone-rings" },
          { label: "Wedding Bands", href: "/collections/wedding-bands" },
          { label: "Men's Wedding Bands", href: "/collections/mens-wedding-bands" },
        ],
      },
      {
        title: "Featured Collections",
        image: "/home/model-emerald-choker.webp",
        links: [
          { label: "Lab Grown Diamond Jewelry", href: "/collections/lab-grown-jewelry" },
          { label: "Gemstone Jewelry", href: "/collections/gemstone-jewelry" },
          { label: "Sale", href: "/collections/sale" },
        ],
      },
      {
        title: "Shop by Gemstone",
        image: "/photos/emerald-chandelier-earrings.webp",
        links: [
          { label: "Diamond", href: "/collections/fine-jewelry?gem=diamond" },
          { label: "Sapphire", href: "/collections/fine-jewelry?gem=sapphire" },
          { label: "Emerald", href: "/collections/fine-jewelry?gem=emerald" },
          { label: "Ruby", href: "/collections/fine-jewelry?gem=ruby" },
          { label: "Pink Sapphire", href: "/collections/fine-jewelry?gem=pink" },
        ],
      },
      {
        title: "Shop by Metal",
        image: "/photos/cuff-bangles.webp",
        links: [
          { label: "White Gold", href: "/collections/fine-jewelry?metal=white" },
          { label: "Yellow Gold", href: "/collections/fine-jewelry?metal=yellow" },
          { label: "Rose Gold", href: "/collections/fine-jewelry?metal=rose" },
          { label: "Platinum", href: "/collections/fine-jewelry?metal=platinum" },
        ],
      },
    ],
  },
  {
    label: "Gifts",
    href: "/collections/gifts-under-1000",
    columns: [
      {
        title: "Gifts by Price",
        links: [
          { label: "Gifts Under $1,000", href: "/collections/gifts-under-1000" },
          { label: "Gifts Under $2,000", href: "/collections/gifts-under-2000" },
          { label: "Sale", href: "/collections/sale" },
          { label: "Shop All Gifts", href: "/collections/fine-jewelry" },
        ],
      },
    ],
  },
  // Opens the 3D ring customiser on the plain solitaire, the simplest place to start.
  { label: "Custom Ring", href: "/settings/aurora", badge: "3D" },
  { label: "Build Your Own Ring", href: "/settings" },
];
