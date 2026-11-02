import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import Countdown from "@/components/home/Countdown";
import Frond from "@/components/home/Frond";
import HeroSlider, { type Slide } from "@/components/home/HeroSlider";
import CategoryPanels, { type Panel } from "@/components/home/CategoryPanels";
import ArrivalsCarousel from "@/components/home/ArrivalsCarousel";
import HomeNewsletter from "@/components/home/HomeNewsletter";
import { lifestyleFor, productItem, type GridItem } from "@/lib/catalog/collections";
import { PRODUCTS, productImage, type ProductType } from "@/lib/catalog/products";
import { SETTINGS, settingDetailUrl, settingImage, settingTitle } from "@/lib/settings/catalog";
import styles from "./home.module.css";

export const metadata: Metadata = {
  title: "DAZORA · Engagement Rings & Fine Jewelry",
  description: "Engagement rings you can design in 3D, loose diamonds, wedding bands and fine jewelry.",
};

const pick = (slug: string) => PRODUCTS.find((p) => p.slug === slug)!;
const ring = (slug: string) => SETTINGS.find((s) => s.slug === slug)!;
const ringPhoto = (slug: string, metal = "yellow") => settingImage(ring(slug), metal);
const photo = (slug: string) => productImage(pick(slug));

const ringItem = (slug: string): GridItem => {
  const s = ring(slug);
  return {
    href: settingDetailUrl(s.slug),
    image: settingImage(s, "yellow"),
    title: settingTitle(s, "yellow"),
    price: s.prices.yellow,
    facets: {},
    hoverImage: lifestyleFor("rings", s.slug),
  };
};

const count = (type: ProductType) => PRODUCTS.filter((p) => p.type === type).length;

const SLIDES: Slide[] = [
  {
    kicker: "Glamorous Life",
    title: "Redefining Elegance With Unique Charms",
    text: "Fine jewelry designed to be worn every day and handed down. Earrings, necklaces and engagement rings, made by hand and seen in 3D before they are made.",
    href: "/collections/fine-jewelry",
    main: "/home/model-profile-earrings.webp",
    small: photo("14k-yellow-gold-75ctw-double-row-diamond-band"),
    side: "/home/model-emerald-set.webp",
    alt: "A model wearing drop earrings and a layered gold necklace",
  },
  {
    kicker: "Evening Brilliance",
    title: "A Sparkle For Every Celebration",
    text: "Diamond and sapphire pieces that catch the light from every angle, from a first pair of studs to an anniversary statement.",
    href: "/collections/necklaces",
    main: "/home/model-sapphire-set.webp",
    small: "/home/wedding-bands-pair.webp",
    side: "/home/bracelet-flowers.webp",
    alt: "A model wearing a diamond and sapphire necklace and earrings",
  },
  {
    kicker: "Made For Forever",
    title: "Rings That Tell Your Story",
    text: "Engagement rings designed by you and made by hand. Choose a setting, pair it with your diamond, and see the finished ring in 3D before it is made.",
    href: "/settings",
    main: "/home/rings-on-hand.webp",
    small: photo("14k-white-gold-3-00ctw-diamond-tennis-bracelet"),
    side: "/home/emerald-pendant.webp",
    alt: "Diamond engagement rings worn on a hand",
  },
];

/** The statement line, with small jewelry pictures set between its phrases. */
const STATEMENT: (string | { img: string })[] = [
  "Elegance is timeless, and so is our jewelry",
  { img: ringPhoto("lumen") },
  "designed with care. Each piece",
  { img: photo("14k-white-gold-1-30ctw-sapphire-and-diamond-halo-earrings") },
  "reflects your unique story",
  { img: photo("14k-yellow-gold-75ctw-double-row-diamond-band") },
  "making every moment",
  { img: photo("14k-white-gold-3-00ctw-diamond-tennis-bracelet") },
  "unforgettable and every look.",
];

const FEATURES = [
  { label: "Reward Program", icon: "M4 10h16v10H4zM2 7h20v3H2zM12 7v13M12 7c-2-3-6-3-6 0M12 7c2-3 6-3 6 0" },
  {
    label: "Special Discounts",
    icon: "M12 3l2.5 2 3.2-.4.8 3.1 2.8 1.6-1.2 3 1.2 3-2.8 1.6-.8 3.1-3.2-.4L12 21l-2.5-2-3.2.4-.8-3.1L2.7 14.7l1.2-3-1.2-3 2.8-1.6.8-3.1 3.2.4zM9 15l6-6M9.5 9.5h.01M14.5 14.5h.01",
  },
  { label: "Unique Designs", icon: "M6 4h12l3 5-9 11L3 9zM3 9h18M9 4l3 16M15 4l-3 16" },
  {
    label: "Fast Shipping",
    icon: "M3 7h11v9H3zM14 10h4l3 3v3h-7M6.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM17.5 19a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z",
  },
  { label: "Great Prices", icon: "M12 3v18M16 7c0-1.7-1.8-3-4-3s-4 1.3-4 3 1.8 2.6 4 3 4 1.3 4 3-1.8 3-4 3-4-1.3-4-3" },
];

const PANELS: Panel[] = [
  {
    title: "Earrings",
    href: "/collections/earrings",
    image: "/home/band-earrings.webp",
    position: "center 42%",
    count: count("earrings"),
    text: "Diamond studs and gemstone halos, from a first pair to an anniversary statement.",
  },
  {
    title: "Rings",
    href: "/settings",
    image: "/home/band-rings.webp",
    position: "center 22%",
    count: SETTINGS.length,
    text: "Engagement settings you can turn, zoom and try on a hand in 3D before they are made.",
  },
  {
    title: "Bracelets",
    href: "/collections/bracelets",
    image: "/home/band-bracelet.webp",
    position: "center 56%",
    count: count("bracelets"),
    text: "Tennis bracelets in diamond, sapphire, emerald and ruby, with a secure box clasp.",
  },
  {
    title: "Pendants",
    href: "/collections/necklaces",
    image: "/home/pendant-teardrop.webp",
    position: "center 78%",
    count: count("necklaces"),
    text: "Solitaire and halo pendants on fine chains, in every shape and gold colour.",
  },
];

const ARRIVALS: GridItem[] = [
  ringItem("beatrix"),
  productItem(pick("14k-yellow-gold-1-00ctw-oval-diamond-stud-earrings")),
  productItem(pick("14k-rose-gold-75ctw-pear-shape-diamond-pendant")),
  productItem(pick("14k-white-gold-3-00ctw-diamond-tennis-bracelet")),
  ringItem("ondine"),
  productItem(pick("14k-rose-gold-1-10ctw-ruby-halo-stud-earrings")),
  productItem(pick("14k-yellow-gold-90ctw-oval-halo-diamond-pendant")),
  productItem(pick("14k-rose-gold-40ctw-twisted-diamond-band")),
];

const NECKLACE = pick("14k-yellow-gold-90ctw-oval-halo-diamond-pendant");
/** Styled photos under the bracelets text, each leading to its collection. */
const PAIR = [
  { href: "/collections/necklaces", image: "/home/heart-pendant.webp", title: "Gold Heart Pendant", note: "Necklaces" },
  { href: "/settings", image: "/home/solitaire-ring.webp", title: "Engraved Solitaire Ring", note: "Engagement Rings" },
];

/** Pieces on sale first, then featured rings. */
const COLLECTION: GridItem[] = [
  ...PRODUCTS.filter((p) => p.compareAt).map(productItem),
  ...["delphine", "leonie"].map(ringItem),
].slice(0, 8);

export default function Home() {
  return (
    <div className={styles.page}>
      <SiteHeader home />

      <main>
        <HeroSlider slides={SLIDES} />

        {/* ---------- Statement ---------- */}
        <section className={styles.statement}>
          <Frond className={styles.leafLeft} />
          <Frond className={styles.leafRight} />
          <p className="kicker">Jewels as unique as you are</p>
          <p className={styles.statementText}>
            {STATEMENT.map((part, i) =>
              typeof part === "string" ? (
                <span key={i}>{part} </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={part.img} alt="" className={styles.inlineGem} />
              ),
            )}
          </p>
          <ul className={styles.features}>
            {FEATURES.map((f) => (
              <li key={f.label}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d={f.icon} />
                </svg>
                {f.label}
              </li>
            ))}
          </ul>
        </section>

        <CategoryPanels panels={PANELS} />

        {/* ---------- New arrivals ---------- */}
        <section className={styles.section}>
          <header className={styles.head}>
            <p className="kicker">Fresh arrivals, just for you</p>
            <h2>New Arrivals, Endless Choices</h2>
          </header>
          <ArrivalsCarousel items={ARRIVALS} />
        </section>

        {/* ---------- Deal banner ---------- */}
        <section className={styles.section}>
          <div className={styles.deal}>
            <div>
              <p className={styles.dealKicker}>Shop now, save big</p>
              <h2>Hurry, Deals Ends Soon</h2>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/deal-bust.webp" alt="" className={styles.dealPiece} loading="lazy" />
            <Countdown />
          </div>
        </section>

        {/* ---------- Necklace feature ---------- */}
        <section className={styles.necklace}>
          {/* Three pictures stacked: the necklace worn, a close-up, and a pendant set. */}
          <Link href="/collections/necklaces" className={styles.necklaceMedia} aria-label="Shop necklaces">
            <span className={styles.stackFrame} aria-hidden="true" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/model-emerald-choker.webp" alt="" className={styles.stackMain} loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/emerald-pendant.webp" alt="" className={styles.stackSide} loading="lazy" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/pendant-set.webp" alt="" className={styles.stackPiece} loading="lazy" />
          </Link>
          <div className={styles.necklaceText}>
            <p className="kicker">Radiate beauty with necklaces</p>
            <h2>A Symbol Of Love, Beauty, And Sophistication, Beautifully Showcased Around Your Neck</h2>
            <p>
              Diamond and gemstone necklaces that frame the face and catch the light with every turn. Open our pendants
              in 3D to see every facet from every angle.
            </p>
            <Link href={`/products/${NECKLACE.slug}`} className={`btn ${styles.brownBtn} ${styles.arrowBtn}`}>
              Know More <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        {/* ---------- Bracelets ---------- */}
        <section className={styles.bracelets}>
          <Frond className={styles.leafRight} />
          <Link href="/settings" className={styles.archCard}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/ring-on-hand-pink.webp" alt="A pink heart ring worn on a hand" loading="lazy" />
            <svg viewBox="0 0 300 160" className={styles.arcText} aria-hidden="true">
              <path id="arc" d="M24 150 A 126 126 0 0 1 276 150" fill="none" />
              <text>
                <textPath href="#arc" startOffset="50%" textAnchor="middle">
                  Where Beauty And Love Intertwine Perfectly
                </textPath>
              </text>
            </svg>
            <span className={styles.shopCircle}>Shop Now</span>
          </Link>
          <div className={styles.braceletText}>
            <p className="kicker">Timeless wrist treasures</p>
            <h2>Unleash Your Style With Our Unique Bracelets</h2>
            <p>
              Tennis bracelets set edge to edge with matched stones, finished with a secure box clasp. Wear one alone or
              stack them in white, yellow and rose gold.
            </p>
            <Link href="/collections/bracelets" className={`btn ${styles.arrowBtn}`}>
              Shop Now <span aria-hidden="true">→</span>
            </Link>
          </div>
          <span className={styles.ringBox}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/ring-box.webp" alt="" loading="lazy" />
          </span>
          <div className={styles.pair}>
            {PAIR.map((p) => (
              <Link key={p.href} href={p.href} className={styles.pairTile}>
                <span className={styles.pairPhoto}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt="" loading="lazy" />
                </span>
                <span className={styles.pairNote}>{p.note}</span>
                <span className={styles.pairTitle}>{p.title}</span>
              </Link>
            ))}
          </div>
          <Link href="/settings" className={`${styles.archCard} ${styles.archTall}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/bride-veil.webp" alt="A bride wearing diamond earrings, a necklace and an engagement ring" loading="lazy" />
            <span className={styles.shopCircle}>Shop Now</span>
          </Link>
        </section>

        {/* ---------- Collection ---------- */}
        <section className={styles.collection}>
          <header className={`${styles.head} ${styles.center}`}>
            <p className="kicker">Elegance in every piece</p>
            <h2>Your Style, Our Collection</h2>
          </header>
          <ArrivalsCarousel
            items={COLLECTION}
            label="Our collection"
            className={styles.centerRow}
            bar={false}
            centered
          />
        </section>

        {/* ---------- Two banners ---------- */}
        <section className={styles.banners}>
          <Link href="/settings" className={`${styles.bannerCard} ${styles.bannerLight} ${styles.bannerSet}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/diamond-set.webp" alt="" loading="lazy" />
            <div className={styles.bannerText}>
              <span className={styles.bannerKicker}>Circle of elegance</span>
              <h2>Celebrate Life, One Ring at a Time.</h2>
              <span className={`${styles.bannerBtn} ${styles.arrowBtn}`}>
                Shop Now <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
          <Link href="/collections/necklaces" className={`${styles.bannerCard} ${styles.bannerLight}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/band-necklace.webp" alt="" loading="lazy" />
            <div className={styles.bannerText}>
              <span className={styles.bannerKicker}>Illuminate your look</span>
              <h2>Every Jewellery Has Its Own Story</h2>
              <span className={`${styles.bannerBtn} ${styles.arrowBtn}`}>
                Shop Now <span aria-hidden="true">→</span>
              </span>
            </div>
          </Link>
        </section>

        <HomeNewsletter />
      </main>

      <SiteFooter flush />
    </div>
  );
}
