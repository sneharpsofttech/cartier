"use client";

import Link from "next/link";
import { useState } from "react";
import styles from "@/app/home.module.css";

export type Panel = {
  title: string;
  href: string;
  image: string;
  /** CSS object-position for the photo, so the jewelry stays in view when it fills the band. */
  position?: string;
  text: string;
  count: number;
};

/**
 * A full-width band split into equal columns. The column under the pointer
 * shows its story, and the photo behind the whole band crossfades to match.
 */
export default function CategoryPanels({ panels }: { panels: Panel[] }) {
  const [active, setActive] = useState(0);
  return (
    <section className={styles.panels} aria-label="Shop by category">
      {panels.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.title}
          src={p.image}
          alt=""
          loading="lazy"
          className={styles.panelBg}
          data-active={i === active}
          style={{ objectPosition: p.position }}
        />
      ))}
      <div className={styles.panelCols}>
        {panels.map((p, i) => (
          <Link
            key={p.title}
            href={p.href}
            className={styles.panel}
            data-active={i === active}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
          >
            <span className={styles.panelInfo}>
              <span className={styles.panelOval}>* {p.title} *</span>
              <span className={styles.panelText}>{p.text}</span>
              <span className={styles.panelCount}>( Explore {p.count} items )</span>
            </span>
            <span className={styles.panelLabel}>{p.title}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
