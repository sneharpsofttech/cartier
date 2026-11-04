"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import SettingImage from "@/components/settings/SettingImage";
import styles from "./Product.module.css";

const loading = () => <p className={styles.loading3d}>Loading 3D view…</p>;
const PieceViewer = dynamic(() => import("./PieceViewer"), { ssr: false, loading });
const SettingViewer = dynamic(() => import("./SettingViewer"), { ssr: false, loading });
const TryOn = dynamic(() => import("./TryOn"), { ssr: false, loading });

type View = { kind: "photo"; src: string; label: string } | { kind: "3d"; label: string };

/**
 * The large view, with a strip of thumbnails under it: the studio photos from
 * each angle (or in each metal), the piece being worn, and the piece in 3D.
 * Every product page, jewellery and engagement-ring settings alike, uses it.
 */
export default function ProductGallery({
  slug,
  setting,
  photos,
  title,
  worn,
  tryOn,
}: {
  slug: string;
  /** For an engagement-ring setting: the metal its 3D view shows (otherwise a jewellery piece). */
  setting?: { metal: string };
  /** Studio photos, the main one first, with an optional label each (e.g. the metal). */
  photos: (string | { src: string; label: string })[];
  title: string;
  /** A styled photo of this kind of piece being worn. */
  worn?: string;
  /** The 3D view can also show the piece worn: on the 3D hand (rings, bands, bracelets) or head (earrings). */
  tryOn?: "hand" | "head";
}) {
  const views: View[] = [
    ...photos.map((p, i) =>
      typeof p === "string"
        ? { kind: "photo" as const, src: p, label: i ? `View ${i + 1}` : "Photo" }
        : { kind: "photo" as const, ...p },
    ),
    ...(worn ? [{ kind: "photo" as const, src: worn, label: "Worn" }] : []),
    { kind: "3d", label: "3D view" },
  ];
  const [active, setActive] = useState(0);
  const [hand, setHand] = useState(false);
  const view = views[active] ?? views[0];

  return (
    <div className={styles.showcase}>
      <div className={styles.stage} data-worn={(view.kind === "photo" && view.src === worn) || undefined}>
        {view.kind === "photo" ? (
          <SettingImage key={view.src} src={view.src} alt={`${title}, ${view.label.toLowerCase()}`} priority={active === 0} />
        ) : (
          <>
            {hand ? (
              <TryOn slug={slug} setting={setting} />
            ) : setting ? (
              <SettingViewer slug={slug} metal={setting.metal} />
            ) : (
              <PieceViewer slug={slug} />
            )}
            {!hand && <p className={styles.hint}>Drag to turn · scroll to zoom</p>}
            {tryOn && (
              <button className={styles.handToggle} onClick={() => setHand((v) => !v)} aria-pressed={hand}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  {hand ? (
                    <path d="M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9" />
                  ) : (
                    <path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V12m0-1V4a1.5 1.5 0 0 1 3 0v7m0-.5V6a1.5 1.5 0 0 1 3 0v8c0 4-2.7 7-6.5 7-2.6 0-4.4-1.3-5.6-3.4L3.6 14a1.5 1.5 0 0 1 2.6-1.5L8 15" />
                  )}
                </svg>
                {hand ? "Back to 3D" : tryOn === "hand" ? "Try on hand" : "Try it on"}
              </button>
            )}
          </>
        )}
      </div>
      <div className={styles.strip}>
        {views.map((v, i) => (
          <button
            key={v.kind === "photo" ? v.src : "3d"}
            data-active={i === active}
            data-worn={(v.kind === "photo" && v.src === worn) || undefined}
            onClick={() => setActive(i)}
            aria-label={v.label}
            className={v.kind === "3d" ? styles.strip3d : undefined}
          >
            {v.kind === "photo" ? (
              <SettingImage src={v.src} alt="" />
            ) : (
              <>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9" />
                </svg>
                <span>3D</span>
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
