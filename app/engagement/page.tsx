import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import SettingImage from "@/components/settings/SettingImage";
import { ProductCard } from "@/components/catalog/parts";
import { lifestyleFor } from "@/lib/catalog/collections";
import {
  SETTINGS,
  SETTING_STYLES,
  SETTING_STYLE_LABELS,
  settingDetailUrl,
  settingImage,
  settingTitle,
} from "@/lib/settings/catalog";
import shell from "../shell.module.css";
import styles from "@/components/landing/Landing.module.css";

export const metadata: Metadata = {
  title: "Love & Engagement · DAZORA",
  description: "Engagement rings, wedding bands and rings designed by you in 3D, with certified natural and lab grown diamonds.",
};

/** The three ways in: a ring we made, a band to match, or one designed from scratch. */
const PATHS = [
  {
    href: "/settings",
    image: "/photos/couple-bands.webp",
    title: "Engagement Rings",
    text: "Solitaires, halos, pavé and vintage settings, ready for the diamond you choose.",
    cta: "Shop Now",
  },
  {
    href: "/collections/wedding-bands",
    image: "/photos/couple-rings.webp",
    title: "Wedding Bands",
    text: "Polished classics and eternity bands for her and for him, made to pair perfectly.",
    cta: "Shop Now",
  },
  {
    href: "/settings/aurora",
    image: "/photos/emerald-stack-rings.webp",
    title: "Customise Your Ring",
    text: "Choose every detail, from the head to the band, and watch your ring turn in 3D.",
    cta: "Design in 3D",
  },
];

/** One setting of each style, to show what the style looks like. */
const STYLES = SETTING_STYLES.map((style) => ({
  style,
  setting: SETTINGS.find((s) => s.style === style && s.featured) ?? SETTINGS.find((s) => s.style === style)!,
})).slice(0, 6);

const FEATURED = SETTINGS.filter((s) => s.featured).slice(0, 4);

/**
 * Love & Engagement: the page the navbar item opens. It introduces the bridal
 * range and leads on to the ring list, the bands and the 3D designer; the
 * links inside its menu go straight to the product lists.
 */
export default function EngagementPage() {
  return (
    <div className={shell.page}>
      <SiteHeader />
      <main>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/">Home</Link> / <span>Love &amp; Engagement</span>
            </nav>
            <h1>DAZORA Bridal</h1>
            <p>
              When you know, you just know. Find the engagement ring that tells your story: choose a setting, pair it with a
              certified diamond, and see it on your hand in 3D before it is made.
            </p>
            <div className={styles.heroActions}>
              <Link href="/settings" className={styles.solid}>
                Shop Engagement Rings
              </Link>
              <Link href="/diamonds?diamond_type=natural" className={styles.outline}>
                Find Your Diamond
              </Link>
            </div>
          </div>
          <div className={styles.heroPhoto}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/home/bride-veil.webp" alt="A bride wearing a diamond engagement ring" />
          </div>
        </section>

        <div className={styles.wrap}>
          <section className={styles.section}>
            <div className={styles.tiles}>
              {PATHS.map((p) => (
                <article key={p.title} className={styles.tile}>
                  <Link href={p.href} className={styles.tilePhoto} tabIndex={-1} aria-hidden="true">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" loading="lazy" />
                  </Link>
                  <h3>
                    <Link href={p.href}>{p.title}</Link>
                  </h3>
                  <p>{p.text}</p>
                  <Link href={p.href} className={`${styles.outline} ${styles.small}`}>
                    {p.cta}
                  </Link>
                </article>
              ))}
            </div>
          </section>

          <section className={`${styles.section} ${styles.prose}`}>
            <span className="kicker">Made to order for you</span>
            <h2>Engagement Rings in Every Shape and Style</h2>
            <p>
              Whether you are dreaming of a classic round solitaire or a one-of-a-kind design, every DAZORA setting is made to
              order in your ring size and fits any centre stone shape, from oval and pear to emerald and marquise.
            </p>
            <p>
              From the clean lines of a bezel to the sparkle of a pavé band and the romance of a vintage halo, our collections
              bring your love story to life. Choose a natural diamond, or a lab grown diamond with the same brilliance at a
              gentler price, or a coloured gemstone for a ring with a story of its own.
            </p>
          </section>

          <section className={styles.section}>
            <div className={styles.heading}>
              <span className="kicker">Find your style</span>
              <h2>Shop by Style</h2>
            </div>
            <div className={styles.minis} data-count="6">
              {STYLES.map(({ style, setting }) => (
                <Link key={style} href={`/settings?style=${style}`} className={styles.mini}>
                  <span className={styles.miniPhoto}>
                    <SettingImage src={settingImage(setting, "yellow")} alt="" />
                  </span>
                  <span className={styles.caption}>{SETTING_STYLE_LABELS[style]}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <section className={`${styles.section} ${styles.dark}`}>
          <div className={styles.darkCopy}>
            <small>Create your dream ring</small>
            <h2>DAZORA Custom Originals</h2>
            <p>
              Pick the head, the band, the metal and the centre stone, and watch your ring come together in 3D. Try it on a hand,
              share it, and we will make it just for you.
            </p>
            <div className={styles.heroActions}>
              <Link href="/settings/aurora" className={styles.solid}>
                Start Designing
              </Link>
              <Link href="/diamonds?diamond_type=natural" className={styles.outline}>
                Choose a Diamond
              </Link>
            </div>
          </div>
          <div className={styles.darkPhoto}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/hero/delphine-yellow.webp" alt="" loading="lazy" />
          </div>
        </section>

        <div className={styles.wrap}>
          <section className={styles.section}>
            <div className={styles.heading}>
              <span className="kicker">Most loved</span>
              <h2>Shop Engagement Rings</h2>
            </div>
            <div className={styles.products}>
              {FEATURED.map((s) => (
                <ProductCard
                  key={s.slug}
                  item={{
                    href: settingDetailUrl(s.slug),
                    image: settingImage(s, "yellow"),
                    title: settingTitle(s, "yellow"),
                    price: s.prices.yellow,
                    facets: {},
                    hoverImage: lifestyleFor("rings", s.slug),
                  }}
                />
              ))}
            </div>
            <div className={styles.viewAll}>
              <Link href="/settings" className={`${styles.outline} ${styles.small}`}>
                View All
              </Link>
            </div>
          </section>
        </div>

        <div className={styles.strip}>
          <strong>Book a Viewing</strong>
          <span>See our settings in person, or on a video call with one of our jewellers.</span>
          <a href="tel:+18005550199" className={`${styles.outline} ${styles.small}`}>
            Call (800) 555-0199
          </a>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
