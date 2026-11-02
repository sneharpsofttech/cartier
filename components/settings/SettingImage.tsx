"use client";

import { useState } from "react";
import styles from "./SettingImage.module.css";

/** A ring product photo with a quiet placeholder if the render is missing. */
export default function SettingImage({ src, alt, priority = false }: { src: string; alt: string; priority?: boolean }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={styles.frame}>
      {failed ? (
        <svg viewBox="0 0 48 48" width="40%" height="40%" aria-hidden className={styles.placeholder}>
          <circle cx="24" cy="30" r="12" />
          <path d="M19 14h10l-5 6z" />
        </svg>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} loading={priority ? "eager" : "lazy"} onError={() => setFailed(true)} />
      )}
    </span>
  );
}
