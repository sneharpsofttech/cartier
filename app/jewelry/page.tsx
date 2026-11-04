import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import SettingImage from "@/components/settings/SettingImage";
import shell from "../shell.module.css";
import styles from "@/components/landing/Landing.module.css";

export const metadata: Metadata = {
  title: "Fine Jewelry · DAZORA",
  description: "Diamond and gemstone earrings, necklaces, bracelets, rings and wedding bands, for her and for him.",
};

/** Every collection, each with a photo, a line and a way in. */
const CATEGORIES = [
  {
    href: "/collections/earrings",
    image: "/home/model-profile-earrings.webp",
    title: "Diamond Earrings",
    text: "From a first pair of diamond studs to halo earrings for an anniversary, there is a pair for every moment.",
  },
  {
    href: "/collections/necklaces",
    image: "/photos/rose-gold-necklace.webp",
    title: "Necklaces & Pendants",
    text: "Solitaire and halo pendants on fine chains, made to be worn every day and layered with the pieces you love.",
  },
  {
    href: "/collections/bracelets",
    image: "/photos/spiral-bracelet.webp",
    title: "Diamond Bracelets",
    text: "Tennis bracelets in diamond, sapphire, emerald and ruby, each finished with a secure box clasp.",
  },
  {
    href: "/collections/gemstone-rings",
    image: "/photos/emerald-stack-rings.webp",
    title: "Gemstone Rings",
    text: "Sapphire, emerald and ruby rings with diamond halos and pavé bands, for a ring with colour.",
  },
  {
    href: "/collections/womens-wedding-bands",
    image: "/photos/chevron-ring-hand.webp",
    title: "Women's Wedding Bands",
    text: "Polished classics, pavé and eternity bands that sit beautifully beside her engagement ring.",
  },
  {
    href: "/collections/mens-wedding-bands",
    image: "/photos/couple-rings.webp",
    title: "Men's Wedding Bands",
    text: "Comfort fit, flat edge and knife edge bands in gold and platinum, made to be worn for life.",
  },
  {
    href: "/collections/lab-grown-jewelry",
    image: "/home/pendant-set.webp",
    title: "Lab Grown Diamonds",
    text: "Real diamonds grown above ground, with the same fire and brilliance at a gentler price.",
  },
  {
    href: "/collections/gemstone-jewelry",
    image: "/photos/emerald-chandelier-earrings.webp",
    title: "Gemstone Jewelry",
    text: "Mark a milestone with sapphire, emerald, ruby or pink sapphire, set in white, yellow or rose gold.",
  },
  {
    href: "/collections/gifts-under-1000",
    image: "/photos/sapphire-necklace-rose.webp",
    title: "Anniversary Gifts",
    text: "Thoughtful pieces under $1,000 for birthdays, anniversaries and every celebration in between.",
  },
];

/** One piece in each metal, photographed on white. */
const METALS = [
  { id: "yellow", label: "Yellow Gold Jewelry", image: "/jewelry/14k-yellow-gold-1-00ctw-oval-diamond-stud-earrings.webp" },
  { id: "white", label: "White Gold Jewelry", image: "/jewelry/14k-white-gold-3-00ctw-diamond-tennis-bracelet.webp" },
  { id: "rose", label: "Rose Gold Jewelry", image: "/jewelry/14k-rose-gold-75ctw-heart-diamond-pendant.webp" },
  { id: "platinum", label: "Platinum Jewelry", image: "/jewelry/platinum-1-00ctw-princess-cut-diamond-stud-earrings.webp" },
];

/**
 * Fine Jewelry: the page the navbar item opens, introducing every collection
 * and the metals; the links inside its menu go straight to the product lists.
 */
export default function JewelryPage() {
  return (
    <div className={shell.page}>
      <SiteHeader />
      <main>
        <section className={styles.banner}>
          <div className={styles.bannerPhoto}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/model-sapphire-set.webp" alt="A model wearing a sapphire and diamond necklace and earrings" />
          </div>
          <div className={styles.bannerCopy}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/">Home</Link> / <span>Fine Jewelry</span>
            </nav>
            <h1>Shop All Jewelry Collections</h1>
            <p>Diamonds and gemstones in white, yellow and rose gold and platinum, for her and for him.</p>
            <div className={styles.heroActions}>
              <Link href="/collections/fine-jewelry" className={styles.solid}>
                Shop All Jewelry
              </Link>
            </div>
          </div>
        </section>

        <div className={styles.wrap}>
          <p className={styles.intro}>
            Whether you are looking for a wedding band for him or a special gift for the amazing woman in your life, you will
            find it here. Every piece is finely crafted in yellow, white or rose gold or platinum, with certified diamonds and
            hand-picked gemstones, from timeless classics to the newest designs.
          </p>

          <section className={styles.section}>
            <div className={styles.tiles}>
              {CATEGORIES.map((c) => (
                <article key={c.title} className={styles.tile}>
                  <Link href={c.href} className={styles.tilePhoto} tabIndex={-1} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={c.image} alt="" loading="lazy" />
                  </Link>
                  <h3>
                    <Link href={c.href}>{c.title}</Link>
                  </h3>
                  <p>{c.text}</p>
                  <Link href={c.href} className={`${styles.outline} ${styles.small}`}>
                    Shop Now
                  </Link>
                </article>
              ))}
            </div>
          </section>
        </div>

        <section className={`${styles.section} ${styles.dark}`}>
          <div className={styles.darkCopy}>
            <small>Design your own</small>
            <h2>A DAZORA Original</h2>
            <p>
              Start with a setting, choose your diamond and every detail, and see your ring in 3D before it is made. Start your
              custom adventure today.
            </p>
            <div className={styles.heroActions}>
              <Link href="/settings/aurora" className={styles.outline}>
                Learn More
              </Link>
            </div>
          </div>
          <div className={styles.darkPhoto}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero/seraphine-yellow.webp" alt="" loading="lazy" />
          </div>
        </section>

        <div className={styles.wrap}>
          <section className={styles.section}>
            <div className={styles.heading}>
              <h2>Shop by Metal</h2>
            </div>
            <div className={styles.minis}>
              {METALS.map((m) => (
                <Link key={m.id} href={`/collections/fine-jewelry?metal=${m.id}`} className={styles.mini}>
                  <span className={styles.miniPhoto}>
                    <SettingImage src={m.image} alt="" />
                  </span>
                  <span className={styles.caption}>{m.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className={styles.strip}>
          <strong>Book an Appointment</strong>
          <span>Whether you are ready to start a custom project or need help choosing the perfect gift, we are here to help.</span>
          <a href="tel:+18005550199" className={`${styles.outline} ${styles.small}`}>
            Call (800) 555-0199
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
