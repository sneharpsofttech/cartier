"use client";

import { SKIN_TONES, type SkinTone } from "./hands";
import styles from "./HandTryOn.module.css";

/** The skin-tone panel in the corner of a try-on view, folding away to a single swatch. */
export default function SkinPicker({
  tone,
  onChange,
  open,
  onToggle,
}: {
  tone: SkinTone;
  onChange: (id: string) => void;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <div className={styles.skinDock}>
      {open && (
        <div className={styles.skinPanel} role="radiogroup" aria-label="Skin tone">
          <span className={styles.skinTitle}>Skin</span>
          <div className={styles.skinGrid}>
            {SKIN_TONES.map((t) => (
              <button
                key={t.id}
                role="radio"
                aria-checked={t.id === tone.id}
                aria-label={t.label}
                title={t.label}
                className={styles.skinThumb}
                data-active={t.id === tone.id}
                style={{ "--skin": t.color } as React.CSSProperties}
                onClick={() => onChange(t.id)}
              >
                <HandGlyph />
              </button>
            ))}
          </div>
        </div>
      )}
      <button className={styles.skinToggle} onClick={onToggle} aria-expanded={open} aria-label="Choose skin tone">
        <span className={styles.skinThumb} style={{ "--skin": tone.color } as React.CSSProperties}>
          <HandGlyph />
        </span>
        <svg viewBox="0 0 24 24" width="14" height="14" data-open={open} className={styles.caret} aria-hidden>
          <path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}

/** Raised hand silhouette, filled with the tone via --skin. */
function HandGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden className={styles.handGlyph}>
      <path d="M9 21c-2.6-1.3-4.6-3.9-5.4-6.8l-.5-1.9c-.2-.8.3-1.5 1.1-1.6.6-.1 1.2.2 1.4.8L6.8 14V5.6c0-.8.6-1.4 1.3-1.4.8 0 1.4.6 1.4 1.4V11V3.4c0-.8.6-1.4 1.3-1.4.8 0 1.4.6 1.4 1.4V11V4.4c0-.8.6-1.4 1.3-1.4.8 0 1.4.6 1.4 1.4V11.4V7c0-.8.6-1.4 1.3-1.4.8 0 1.4.6 1.4 1.4v7.4c0 3.6-2.4 6.6-5.7 7.4" />
    </svg>
  );
}
