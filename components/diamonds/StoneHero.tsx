import Link from "next/link";
import styles from "./StoneHero.module.css";

/**
 * The stone search's own header: a dark panel with the title, a line of text,
 * breadcrumbs and the size of each collection, beside a close-up photo of
 * diamond rings that fades into the dark panel, with a small certificate card.
 */
export default function StoneHero({ counts }: { counts: { natural: number; labgrown: number; gemstone: number } }) {
  const facts = [
    { n: counts.natural, label: "Natural diamonds" },
    { n: counts.labgrown, label: "Lab-grown diamonds" },
    { n: counts.gemstone, label: "Coloured gemstones" },
  ];

  return (
    <section className={styles.hero}>
      <div className={styles.copy}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">Diamonds</span>
        </nav>
        <p className={styles.kicker}>Step 1 of 3 · The stone</p>
        <h1>Choose Your Stone</h1>
        <p className={styles.lead}>
          Every diamond and gemstone here is certified by GIA or IGI. Filter by shape and the 4Cs, then see your stone
          set in 3D before it is made.
        </p>
        <ul className={styles.facts}>
          {facts.map((f) => (
            <li key={f.label}>
              <strong>{f.n.toLocaleString("en-US")}</strong>
              <span>{f.label}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.stage}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/home/rings-on-hand.webp" alt="Two diamond rings worn on a hand" className={styles.photo} />
        <div className={styles.cert}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="9" r="6" />
            <path d="m9.5 9 1.7 1.7L14.6 7.4M8.5 14l-1.5 7 5-2.5 5 2.5-1.5-7" />
          </svg>
          <p>
            <strong>Certified, every one</strong>
            <span>Graded by GIA or IGI, with the report to keep</span>
          </p>
        </div>
      </div>
    </section>
  );
}
