/** Main navigation: top-level items, each with an optional dropdown or mega menu. */
export type MenuLink = { label: string; href: string };
export type MenuColumn = { title: string; links: MenuLink[] };
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
    href: "/settings",
    feature: {
      image: "/home/ring-on-hand-pink.webp",
      kicker: "Designed by you",
      title: "Build Your Ring in 3D",
      href: "/settings",
    },
    columns: [
      {
        title: "Engagement",
        links: [
          { label: "Engagement Ring Settings", href: "/settings" },
          { label: "Build Your Ring", href: "/settings" },
          { label: "Start With a Diamond", href: "/diamonds?diamond_type=natural" },
          { label: "Lab Grown Engagement", href: "/diamonds?diamond_type=labgrown" },
          { label: "Gemstone Engagement Rings", href: "/collections/gemstone-rings" },
        ],
      },
      {
        title: "Wedding Bands",
        links: [
          { label: "Women's Wedding Bands", href: "/collections/wedding-bands" },
          { label: "Diamond Eternity Bands", href: "/collections/wedding-bands?gem=diamond" },
          { label: "Gemstone Bands", href: "/collections/wedding-bands?gem=sapphire" },
        ],
      },
      {
        title: "Ring Styles",
        links: [
          { label: "Solitaire", href: "/settings?style=solitaire" },
          { label: "Bezel", href: "/settings?style=bezel" },
          { label: "Halo", href: "/settings?style=halo" },
          { label: "Hidden Halo", href: "/settings?style=hidden-halo" },
          { label: "Pavé", href: "/settings?style=pave" },
          { label: "Side Stone", href: "/settings?style=side-stone" },
          { label: "Vintage", href: "/settings?style=vintage" },
        ],
      },
      {
        title: "Loose Diamonds",
        links: [
          { label: "Natural Diamond Search", href: "/diamonds?diamond_type=natural" },
          { label: "Lab Grown Diamond Search", href: "/diamonds?diamond_type=labgrown" },
          { label: "Colored Gemstones", href: "/diamonds?diamond_type=gemstone" },
        ],
      },
    ],
  },
  {
    label: "Fine Jewelry",
    href: "/collections/fine-jewelry",
    feature: {
      image: "/home/model-emerald-set.webp",
      kicker: "New season",
      title: "The Gemstone Edit",
      href: "/collections/gemstone-jewelry",
    },
    columns: [
      {
        title: "Shop by Category",
        links: [
          { label: "Shop All Jewelry", href: "/collections/fine-jewelry" },
          { label: "Earrings", href: "/collections/earrings" },
          { label: "Necklaces & Pendants", href: "/collections/necklaces" },
          { label: "Bracelets", href: "/collections/bracelets" },
          { label: "Gemstone Rings", href: "/collections/gemstone-rings" },
          { label: "Wedding Bands", href: "/collections/wedding-bands" },
        ],
      },
      {
        title: "Featured Collections",
        links: [
          { label: "Lab Grown Diamond Jewelry", href: "/collections/lab-grown-jewelry" },
          { label: "Gemstone Jewelry", href: "/collections/gemstone-jewelry" },
          { label: "Sale", href: "/collections/sale" },
        ],
      },
      {
        title: "Shop by Gemstone",
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
  { label: "Wedding Bands", href: "/collections/wedding-bands" },
  // Opens the 3D ring customiser on the plain solitaire, the simplest place to start.
  { label: "Custom Ring", href: "/settings/aurora", badge: "3D" },
  { label: "Build Your Own Ring", href: "/settings" },
];
