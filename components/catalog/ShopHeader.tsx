import Link from "next/link";
import styles from "./ShopHeader.module.css";

/** Categories in the scrolling band, each with a round photo. */
const BAND = [
  { label: "Engagement Rings", href: "/settings", image: "/rings/delphine-yellow.webp" },
  {
    label: "Diamond Earrings",
    href: "/collections/earrings",
    image: "/jewelry/14k-white-gold-2-00ctw-round-lab-grown-diamond-stud-earrings.webp",
  },
  {
    label: "Necklaces",
    href: "/collections/necklaces",
    image: "/jewelry/14k-yellow-gold-90ctw-oval-halo-diamond-pendant.webp",
  },
  {
    label: "Tennis Bracelets",
    href: "/collections/bracelets",
    image: "/jewelry/14k-white-gold-3-00ctw-diamond-tennis-bracelet.webp",
  },
  {
    label: "Wedding Bands",
    href: "/collections/wedding-bands",
    image: "/jewelry/14k-yellow-gold-75ctw-double-row-diamond-band.webp",
  },
  {
    label: "Gemstone Jewellery",
    href: "/collections/gemstone-jewelry",
    image: "/jewelry/14k-white-gold-1-30ctw-sapphire-and-diamond-halo-earrings.webp",
  },
  {
    label: "Lab Grown",
    href: "/collections/lab-grown-jewelry",
    image: "/jewelry/14k-yellow-gold-5-00ctw-lab-grown-diamond-tennis-bracelet.webp",
  },
];

/**
 * The shop page's header: title, a line about the collection, breadcrumbs and
 * the number of pieces on warm sand, beside a photo that fades into it; then a
 * brown band of categories that scrolls on its own.
 */
export default function ShopHeader({
  title,
  crumb,
  intro,
  image = "/home/diamond-set.webp",
  count,
}: {
  title: string;
  crumb?: { label: string; href: string };
  intro?: string;
  image?: string;
  count?: number;
}) {
  return (
    <>
      <header className={styles.head}>
        <div className={styles.copy}>
          <nav aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            {crumb && (
              <>
                <Link href={crumb.href}>{crumb.label}</Link>
                <span aria-hidden="true">/</span>
              </>
            )}
            <span aria-current="page">{title}</span>
          </nav>
          <h1>{title}</h1>
          {intro && <p className={styles.intro}>{intro}</p>}
          {count !== undefined && (
            <p className={styles.count}>
              <strong>{count}</strong> {count === 1 ? "piece" : "pieces"} · Handcrafted to order
            </p>
          )}
        </div>
        <div className={styles.photo}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" />
        </div>
      </header>
      <div className={styles.band}>
        {/* Two copies side by side, so the loop is seamless; the second is hidden from screen readers. */}
        <div className={styles.track}>
          {[0, 1].map((copy) => (
            <ul key={copy} aria-hidden={copy === 1 || undefined}>
              {BAND.map((b) => (
                <li key={b.label}>
                  <Link href={b.href} tabIndex={copy === 1 ? -1 : undefined}>
                    <span className={styles.circle}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.image} alt="" loading="lazy" />
                    </span>
                    {b.label}
                  </Link>
                </li>
              ))}
            </ul>
          ))}
        </div>
      </div>
    </>
  );
}
