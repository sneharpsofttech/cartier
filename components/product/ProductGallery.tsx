"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import SettingImage from "@/components/settings/SettingImage";
import styles from "./Product.module.css";

const PieceViewer = dynamic(() => import("./PieceViewer"), {
  ssr: false,
  loading: () => <p className={styles.loading3d}>Loading 3D view…</p>,
});

/** Thumbnails down the left, the large view on the right: the photo or the 3D piece. */
export default function ProductGallery({ slug, image, title }: { slug: string; image: string; title: string }) {
  const [view, setView] = useState<"photo" | "3d">("photo");
  return (
    <div className={styles.gallery}>
      <div className={styles.thumbs}>
        <button data-active={view === "photo"} onClick={() => setView("photo")} aria-label="Photo">
          <SettingImage src={image} alt="" />
        </button>
        <button data-active={view === "3d"} onClick={() => setView("3d")} aria-label="3D view" className={styles.thumb3d}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9" />
          </svg>
          <span>3D</span>
        </button>
      </div>
      <div className={styles.stage}>
        {view === "photo" ? (
          <SettingImage src={image} alt={title} priority />
        ) : (
          <>
            <PieceViewer slug={slug} />
            <p className={styles.hint}>Drag to turn · scroll to zoom</p>
          </>
        )}
      </div>
    </div>
  );
}
