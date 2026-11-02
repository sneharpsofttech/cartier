import Link from "next/link";
import HeaderBar from "./HeaderBar";
import styles from "./SiteHeader.module.css";

/** Site header: a slim black announcement strip, then the logo bar and navigation, which stay pinned on scroll. */
export default function SiteHeader({ home = false }: { home?: boolean }) {
  return (
    <>
      {/* Both fade in first when the page loader lifts (see [data-reveal] in globals.css). */}
      <div className={`noir ${styles.promo}`} data-reveal="">
        <span className={styles.promoSide}>
          <a href="tel:+18005550199">(800) 555-0199</a>
        </span>
        <p>
          ✦ Exclusive Engagement Rings, Designed by You in 3D ✦ <Link href="/settings">Start Now</Link>
        </p>
        <span className={`${styles.promoSide} ${styles.promoRight}`}>
          USD $
        </span>
      </div>
      <header className={styles.header} data-home={home || undefined} data-reveal="">
        <HeaderBar />
      </header>
    </>
  );
}
