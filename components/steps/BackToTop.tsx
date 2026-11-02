"use client";

import { useEffect, useState } from "react";
import styles from "./SiteFooter.module.css";

/** A sparkle in the corner that scrolls back to the top, shown once the page has scrolled. */
export default function BackToTop() {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const onScroll = () => setShown(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      className={styles.toTop}
      data-shown={shown}
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2c.6 4.8 2.4 8.4 10 10-7.6 1.6-9.4 5.2-10 10-.6-4.8-2.4-8.4-10-10 7.6-1.6 9.4-5.2 10-10z" />
      </svg>
    </button>
  );
}
