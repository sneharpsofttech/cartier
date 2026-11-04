import Link from "next/link";
import BackToTop from "./BackToTop";
import styles from "./SiteFooter.module.css";

/** Styled photos for the gallery tiles, each leading to the collection it shows. */
const GALLERY = [
  { image: "/home/model-emerald-choker.webp", href: "/collections/necklaces", label: "Necklaces" },
  { image: "/photos/emerald-stack-rings.webp", href: "/collections/gemstone-rings", label: "Gemstone rings" },
  { image: "/photos/rose-gold-necklace.webp", href: "/collections/necklaces", label: "Pendants" },
  { image: "/home/bride-veil.webp", href: "/settings", label: "Engagement rings" },
  { image: "/photos/spiral-bracelet.webp", href: "/collections/bracelets", label: "Bracelets" },
  { image: "/home/pendant-set.webp", href: "/collections/earrings", label: "Earrings" },
];

/**
 * Site footer: a gallery of styled photos, two columns of links and the
 * brand with contact details. `flush` drops the space above it, for pages
 * that end in a full-width band of their own (the home page's newsletter).
 */
export default function SiteFooter({ flush = false }: { flush?: boolean }) {
  return (
    <footer className={styles.footer} data-flush={flush || undefined}>
      <div className={styles.cols}>
        <div>
          <h4>@Dazora_Gallery</h4>
          <div className={styles.tiles}>
            {GALLERY.map((g) => (
              <Link key={g.image} href={g.href} aria-label={g.label}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.image} alt="" loading="lazy" />
              </Link>
            ))}
          </div>
        </div>
        <nav aria-label="Pages">
          <h4>Pages</h4>
          <Link href="/settings">Shop Engagement Rings</Link>
          <Link href="/settings">Build Your Ring</Link>
          <Link href="/diamonds?diamond_type=natural">Find Your Diamond</Link>
          <Link href="/diamonds?diamond_type=labgrown">Lab Grown Diamonds</Link>
          <Link href="/collections/wedding-bands">Shop Wedding Bands</Link>
          <Link href="/collections/fine-jewelry">Shop Fine Jewelry</Link>
        </nav>
        <nav aria-label="Collections">
          <h4>Useful Links</h4>
          <Link href="/collections/earrings">Earrings</Link>
          <Link href="/collections/necklaces">Necklaces &amp; Pendants</Link>
          <Link href="/collections/bracelets">Bracelets</Link>
          <Link href="/collections/gemstone-rings">Gemstone Rings</Link>
          <Link href="/collections/gifts-under-1000">Gifts Under $1,000</Link>
          <Link href="/collections/sale">Sale</Link>
        </nav>
        <div className={styles.brand}>
          <Link href="/" className={styles.logo} aria-label="DAZORA home">
            <span>DAZORA</span>
            <small aria-hidden="true">Crafted for forever</small>
          </Link>
          <p>
            Engagement rings you can design in 3D, loose diamonds, wedding bands and fine jewelry, made by hand and
            seen before they are made.
          </p>
          <p className={styles.contact}>
            <a href="tel:+18005550199">(800) 555-0199</a>
            <span>Monday – Friday: 10AM to 6PM</span>
            <span>Saturday: 10AM to 4PM · Sunday: Closed</span>
          </p>
        </div>
      </div>
      <div className={styles.bottom}>
        <p>© {new Date().getFullYear()} DAZORA. All Rights Reserved.</p>
        <p>Due to changing gold prices, prices are subject to change. Prices shown are demo prices.</p>
      </div>
      <BackToTop />
    </footer>
  );
}
