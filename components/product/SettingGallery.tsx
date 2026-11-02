"use client";

import { useState } from "react";
import SettingImage from "@/components/settings/SettingImage";
import styles from "./Product.module.css";

/** Thumbnails down the left, the large photo on the right: the ring in each gold, then a styled photo. */
export default function SettingGallery({ images, title }: { images: { src: string; label: string }[]; title: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];
  return (
    <div className={styles.gallery}>
      <div className={styles.thumbs}>
        {images.map((img, i) => (
          <button key={img.src} data-active={i === active} onClick={() => setActive(i)} aria-label={img.label}>
            <SettingImage src={img.src} alt="" />
          </button>
        ))}
      </div>
      <div className={styles.stage}>
        <SettingImage src={current.src} alt={`${title}, ${current.label}`} priority />
      </div>
    </div>
  );
}
