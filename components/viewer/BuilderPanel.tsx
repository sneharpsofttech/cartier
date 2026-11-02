"use client";

import { useMemo, useState } from "react";
import {
  BAND_STYLES,
  CARATS,
  GEM_OPTIONS,
  HEAD_TYPES,
  METAL_OPTIONS,
  SHANK_STYLES,
  buildCode,
  describe,
  type HeadType,
  type RingConfig,
} from "./ring/config";
import { SHAPES, shapeById, shapePath } from "./ring/shapes";
import { formatPrice, stoneTitle, type Stone } from "@/lib/diamonds/types";
import { quoteSetting } from "@/lib/pricing";
import { RING_SIZES } from "./ring/config";
import type { ProductInfo } from "./RingViewer";
import styles from "./BuilderPanel.module.css";

type Props = {
  config: RingConfig;
  onChange: (patch: Partial<RingConfig>) => void;
  onReset: () => void;
  /** A loaded GLB fixes the geometry, so only colours stay editable. */
  coloursOnly?: boolean;
  /** The centre stone chosen in step 1; it fixes the shape, size and colour. */
  stone?: Stone | null;
  /** Where to pick or change the centre stone (step 1). */
  stoneHref: string;
  /** Step 3: review the complete ring. */
  reviewHref: string;
  product: ProductInfo;
};

export default function BuilderPanel({
  config,
  onChange,
  onReset,
  coloursOnly = false,
  stone = null,
  stoneHref,
  reviewHref,
  product,
}: Props) {
  const quote = quoteSetting(config);
  const [linkMetals, setLinkMetals] = useState(true);
  const [copied, setCopied] = useState(false);
  const shapeIcons = useMemo(() => Object.fromEntries(SHAPES.map((s) => [s.id, shapePath(s)])), []);

  const setMetal = (key: "headMetal" | "shankMetal" | "bandMetal", id: string) =>
    onChange(linkMetals ? { headMetal: id, shankMetal: id, bandMetal: id } : { [key]: id });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be blocked (e.g. insecure context); the URL bar still has the link.
    }
  };

  return (
    <aside className={styles.panel} aria-label="Ring builder">
      <header className={styles.head}>
        <div>
          <p className={styles.kicker}>{product.styleLabel}</p>
          <h2 className={styles.title}>The {product.name}</h2>
          <p className={styles.code}>
            {product.stock} · {buildCode(config)}
          </p>
          <p className={styles.price}>
            {formatPrice(quote.total)}
            <small>{quote.band ? "setting & band" : "setting"}</small>
          </p>
          {stone && (
            <p className={styles.total}>
              Ring total <strong>{formatPrice(quote.total + stone.price)}</strong>
            </p>
          )}
        </div>
        <div className={styles.headActions}>
          <button className={styles.ghost} onClick={onReset}>
            Reset
          </button>
          <button className={styles.ghost} onClick={copyLink}>
            {copied ? "Copied" : "Share"}
          </button>
        </div>
      </header>

      <div className={styles.scroll}>
        <div className={styles.sizeRow}>
          <label htmlFor="ring-size">Ring size (US)</label>
          <select
            id="ring-size"
            value={config.ringSize}
            onChange={(e) => onChange({ ringSize: Number(e.target.value) })}
          >
            {RING_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <Section title="Head">
          {stone && (
            <div className={styles.stone}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stone.image} alt="" />
              <div>
                <span className={styles.summaryLabel}>Your centre stone</span>
                <p className={styles.stoneName}>{stoneTitle(stone)}</p>
                <p className={styles.stonePrice}>{formatPrice(stone.price)}</p>
              </div>
              <a href={stoneHref} className={styles.ghost}>
                Change
              </a>
            </div>
          )}

          {!coloursOnly && (
            <>
              <Field label="Type" value={HEAD_TYPES.find((h) => h.id === config.head)?.label}>
                <div className={styles.grid4}>
                  {HEAD_TYPES.map((h) => (
                    <Tile
                      key={h.id}
                      label={h.label}
                      active={config.head === h.id}
                      onClick={() => onChange({ head: h.id })}
                    >
                      <HeadIcon type={h.id} />
                    </Tile>
                  ))}
                </div>
              </Field>

              {!stone && (
                <>
                  <Field label="Shape" value={shapeById(config.shape).label}>
                    <div className={styles.grid5}>
                      {SHAPES.map((s) => (
                        <Tile
                          key={s.id}
                          label={s.label}
                          active={config.shape === s.id}
                          onClick={() => onChange({ shape: s.id })}
                        >
                          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden>
                            <path d={shapeIcons[s.id]} className={styles.shapePath} />
                          </svg>
                        </Tile>
                      ))}
                    </div>
                  </Field>

                  <Field label="Size" value={`${config.carat.toFixed(2)} ct`}>
                    <div className={styles.chips}>
                      {CARATS.map((c) => (
                        <button
                          key={c}
                          className={styles.chip}
                          data-active={config.carat === c}
                          onClick={() => onChange({ carat: c })}
                        >
                          {c} ct
                        </button>
                      ))}
                    </div>
                  </Field>
                </>
              )}
            </>
          )}

          {!stone && (
            <Field label="Center gem" value={GEM_OPTIONS.find((g) => g.id === config.centerGem)?.label}>
              <Swatches
                options={GEM_OPTIONS}
                value={config.centerGem}
                onPick={(id) => onChange({ centerGem: id })}
              />
            </Field>
          )}

          <Field label="Head metal" value={METAL_OPTIONS.find((m) => m.id === config.headMetal)?.label}>
            <Swatches
              options={METAL_OPTIONS}
              value={config.headMetal}
              onPick={(id) => setMetal("headMetal", id)}
            />
          </Field>
        </Section>

        <Section title="Shank">
          {!coloursOnly && (
            <Field label="Shank style" value={SHANK_STYLES.find((s) => s.id === config.shank)?.label}>
              <div className={styles.shankGrid}>
                {SHANK_STYLES.map((s) => (
                  <ImageTile
                    key={s.id}
                    label={s.label}
                    src={`/thumbs/shank-${s.id}.webp`}
                    active={config.shank === s.id}
                    onClick={() => onChange({ shank: s.id })}
                    caption
                  />
                ))}
              </div>
            </Field>
          )}

          <Field label="Accent gems" value={GEM_OPTIONS.find((g) => g.id === config.accentGem)?.label}>
            <Swatches
              options={GEM_OPTIONS}
              value={config.accentGem}
              onPick={(id) => onChange({ accentGem: id })}
            />
          </Field>

          <Field label="Shank metal" value={METAL_OPTIONS.find((m) => m.id === config.shankMetal)?.label}>
            <Swatches
              options={METAL_OPTIONS}
              value={config.shankMetal}
              onPick={(id) => setMetal("shankMetal", id)}
            />
          </Field>
        </Section>

        {!coloursOnly && (
          <Section title="Band">
            <Field label="Band style" value={BAND_STYLES.find((b) => b.id === config.band)?.label}>
              <div className={styles.grid3}>
                {BAND_STYLES.map((b) => (
                  <ImageTile
                    key={b.id}
                    label={b.label}
                    src={b.id === "none" ? undefined : `/thumbs/band-${b.id}.webp`}
                    active={config.band === b.id}
                    onClick={() => onChange({ band: b.id })}
                  />
                ))}
              </div>
            </Field>

            {config.band !== "none" && (
              <Field label="Band metal" value={METAL_OPTIONS.find((m) => m.id === config.bandMetal)?.label}>
                <Swatches
                  options={METAL_OPTIONS}
                  value={config.bandMetal}
                  onPick={(id) => setMetal("bandMetal", id)}
                />
              </Field>
            )}
          </Section>
        )}

        <label className={styles.link}>
          <input type="checkbox" checked={linkMetals} onChange={(e) => setLinkMetals(e.target.checked)} />
          <span>Use one metal for the whole ring</span>
        </label>

        <div className={styles.summary}>
          <span className={styles.summaryLabel}>Configuration</span>
          <p>{describe(config, shapeById(config.shape).label)}</p>
        </div>
      </div>

      <footer className={styles.foot}>
        {stone ? (
          <a href={reviewHref} className={styles.next}>
            Select setting · Review ring
          </a>
        ) : (
          <>
            <a href={stoneHref} className={styles.next}>
              Select this setting
            </a>
            <a href={reviewHref} className={styles.skip}>
              Next you&apos;ll choose a stone · or review the setting alone
            </a>
          </>
        )}
      </footer>
    </aside>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <section className={styles.section}>
      <button className={styles.sectionHead} onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        <span>{title}</span>
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          data-open={open}
          className={styles.chevron}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </section>
  );
}

function Field({ label, value, children }: { label: string; value?: string; children: React.ReactNode }) {
  return (
    <div className={styles.field}>
      <div className={styles.fieldHead}>
        <span className={styles.fieldLabel}>{label}</span>
        {value && <span className={styles.fieldValue}>{value}</span>}
      </div>
      {children}
    </div>
  );
}

function Tile({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={styles.tile} data-active={active} onClick={onClick} title={label}>
      <span className={styles.tileIcon}>{children}</span>
      <span className={styles.tileLabel}>{label}</span>
    </button>
  );
}

/** A rendered thumbnail of a style; the name shows on hover and in the field header. */
function ImageTile({
  label,
  src,
  active,
  onClick,
  caption = false,
}: {
  label: string;
  /** No image means "none": shown as an empty ring with a slash. */
  src?: string;
  active: boolean;
  onClick: () => void;
  /** Print the name under the picture (long grids where pictures alone are hard to tell apart). */
  caption?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const picture =
    src && !failed ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" loading="lazy" draggable={false} onError={() => setFailed(true)} />
    ) : src ? (
      // A picture that hasn't been rendered yet: a plain ring outline rather than a broken image.
      <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden>
        <ellipse cx="12" cy="13" rx="8" ry="5" fill="none" stroke="currentColor" strokeWidth="1.3" />
        <path d="M10 8.5 12 5.5l2 3" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      </svg>
    ) : null;

  if (caption) {
    return (
      <button className={styles.captionTile} data-active={active} onClick={onClick} title={label}>
        <span className={styles.imageTile}>{picture}</span>
        <span className={styles.caption}>{label}</span>
      </button>
    );
  }

  return (
    <button
      className={styles.imageTile}
      data-active={active}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {picture ?? (
        <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden>
          <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.5 17.5 17.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

function Swatches({
  options,
  value,
  onPick,
}: {
  options: { id: string; label: string; preview: string }[];
  value: string;
  onPick: (id: string) => void;
}) {
  return (
    <div className={styles.swatches}>
      {options.map((o) => (
        <button
          key={o.id}
          className={styles.swatch}
          data-active={value === o.id}
          style={{ background: o.preview }}
          onClick={() => onPick(o.id)}
          title={o.label}
          aria-label={o.label}
        />
      ))}
    </div>
  );
}

/** Top-down sketch of each head: centre stone plus its halo rings. */
function HeadIcon({ type }: { type: HeadType }) {
  const dots = (r: number, n: number, size: number, opacity = 1) =>
    Array.from({ length: n }, (_, i) => {
      const a = (i / n) * Math.PI * 2;
      return (
        <circle
          key={`${r}-${i}`}
          cx={12 + r * Math.cos(a)}
          cy={12 + r * Math.sin(a)}
          r={size}
          opacity={opacity}
        />
      );
    });

  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden className={styles.headIcon}>
      <g fill="currentColor" stroke="none">
        {type === "prong" && dots(6.6, 4, 1.3)}
        {type === "bezel" && <circle cx="12" cy="12" r="7.2" fill="none" stroke="currentColor" strokeWidth="2.2" />}
        {type === "hiddenHalo" && dots(5.2, 14, 0.75, 0.45)}
        {(type === "halo" || type === "doubleHalo") && dots(7.4, 16, 0.95)}
        {type === "doubleHalo" && dots(10, 22, 0.8)}
      </g>
      <circle cx="12" cy="12" r="5.4" className={styles.headStone} />
    </svg>
  );
}
