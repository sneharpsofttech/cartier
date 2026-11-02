"use client";

import { useEffect, useState } from "react";
import styles from "./PageLoader.module.css";

/** The loader stays at least this long, so the ring makes a full turn around the D. */
const MIN_MS = 1800;
/** …and never longer than this, even if a slow image is still loading. */
const MAX_MS = 3500;

/**
 * The first-load screen: the DAZORA mark, with a gold ring circling the D.
 * The `data-loading` flag on <html> is set before the page paints (see the
 * layout); clearing it fades this screen out and lets the page's marked
 * pieces come in from a soft blur (see `[data-reveal]` in globals.css).
 */
export default function PageLoader() {
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const start = performance.now();
    let finished = false;
    let removeTimer: number | undefined;

    const finish = () => {
      if (finished) return;
      finished = true;
      root.removeAttribute("data-loading");
      // Unmount once the fade-out has played.
      removeTimer = window.setTimeout(() => setGone(true), 900);
    };
    const whenLoaded = () => window.setTimeout(finish, Math.max(0, MIN_MS - (performance.now() - start)));

    if (document.readyState === "complete") whenLoaded();
    else window.addEventListener("load", whenLoaded, { once: true });
    const cap = window.setTimeout(finish, MAX_MS);

    return () => {
      window.removeEventListener("load", whenLoaded);
      window.clearTimeout(cap);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (gone) return null;

  return (
    <div className={styles.loader} role="status" aria-label="Loading DAZORA">
      <div className={styles.mark}>
        <svg viewBox="0 0 200 200" className={styles.ring} aria-hidden="true">
          <defs>
            <linearGradient id="loader-ring" x1="0.1" y1="0.9" x2="0.85" y2="0.1">
              <stop offset="0" stopColor="#c99a62" stopOpacity="0" />
              <stop offset="0.45" stopColor="#c99a62" stopOpacity="0.55" />
              <stop offset="1" stopColor="#f1cf93" />
            </linearGradient>
            <radialGradient id="loader-glint">
              <stop offset="0" stopColor="#fff6e0" />
              <stop offset="0.35" stopColor="#f3cf8e" stopOpacity="0.8" />
              <stop offset="1" stopColor="#f3cf8e" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* An open arc that fades out at its tail; the bright head carries a glint. */}
          <circle
            cx="100"
            cy="100"
            r="88"
            fill="none"
            stroke="url(#loader-ring)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="440 113"
            transform="rotate(-205 100 100)"
          />
          <circle cx="162" cy="38" r="14" fill="url(#loader-glint)" />
          <path
            d="M162 28c.5 4.6 2.2 7.6 7.8 10-5.6 2.4-7.3 5.4-7.8 10-.5-4.6-2.2-7.6-7.8-10 5.6-2.4 7.3-5.4 7.8-10z"
            fill="#fffaf0"
          />
        </svg>
        <span className={styles.letter} aria-hidden="true">
          D
          <svg viewBox="0 0 24 24" className={styles.spark}>
            <path d="M12 2c.6 4.8 2.4 8.4 10 10-7.6 1.6-9.4 5.2-10 10-.6-4.8-2.4-8.4-10-10 7.6-1.6 9.4-5.2 10-10z" />
          </svg>
        </span>
      </div>
      <p className={styles.word}>DAZORA</p>
      <p className={styles.tag}>Crafted for forever</p>
    </div>
  );
}
