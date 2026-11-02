"use client";

import { useState } from "react";
import {
  CLARITIES,
  COLORS,
  CUTS,
  FANCY_COLORS,
  FANCY_TINT,
  FINISHES,
  FLUORESCENCE,
  GEM_TINT,
  GEM_VARIETIES,
  LABS,
  SHAPES,
  SHAPE_LABELS,
  STONE_TYPES,
  STONE_TYPE_LABELS,
  TINT_SWATCH,
  type Finish,
  type StoneType,
} from "@/lib/diamonds/grades";
import type { StoneQuery, StoneSearchResult } from "@/lib/diamonds/query";
import { GradeSlider, RangeSlider } from "./Sliders";
import styles from "./StoneList.module.css";

type Props = {
  query: StoneQuery;
  bounds: StoneSearchResult["bounds"];
  shapeIcons: Record<string, string>;
  onChange: (patch: Partial<StoneQuery>) => void;
  onReset: () => void;
};

const money = (v: number) => `$${Math.round(v).toLocaleString("en-US")}`;
const parseMoney = (s: string) => Number(s.replace(/[^0-9.]/g, ""));
const carats = (v: number) => `${v.toFixed(2)} ct`;
const parseCarats = (s: string) => Number(s.replace(/[^0-9.]/g, ""));

/** One line under each stone type's name. */
const TYPE_NOTES: Record<string, string> = {
  natural: "Certified, earth-mined",
  labgrown: "Same sparkle, kinder price",
  gemstone: "Sapphire, ruby, emerald & more",
};

function toggle<T>(list: T[], item: T) {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

export default function Filters({ query, bounds, shapeIcons, onChange, onReset }: Props) {
  const [advanced, setAdvanced] = useState(false);
  const isGem = query.type === "gemstone";

  return (
    <section className={styles.filters} aria-label="Filters">
      <div className={styles.typeTabs} role="tablist">
        {STONE_TYPES.map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={query.type === t}
            className={styles.typeTab}
            data-active={query.type === t}
            onClick={() => onChange({ type: t, price: null, carat: null, varieties: [], fancyColors: [], page: 1 })}
          >
            <span className={styles.typeIcon}>
              <TypeIcon type={t} />
            </span>
            <span className={styles.typeText}>
              <strong>{STONE_TYPE_LABELS[t]}</strong>
              <small>{TYPE_NOTES[t]}</small>
            </span>
          </button>
        ))}
      </div>

      <div className={styles.card}>
        <h3 className={styles.cardTitle}>Shape</h3>
        {/* One shape at a time: choosing another replaces it, choosing it again clears it. */}
        <div className={styles.shapes} role="radiogroup" aria-label="Shape">
          {SHAPES.map((s) => (
            <button
              key={s}
              className={styles.shape}
              role="radio"
              data-active={query.shapes.includes(s)}
              aria-checked={query.shapes.includes(s)}
              onClick={() => onChange({ shapes: query.shapes.includes(s) ? [] : [s], page: 1 })}
            >
              <span className={styles.shapeIcon}>
                <svg viewBox="0 0 24 24" width="36" height="36" aria-hidden>
                  <path d={shapeIcons[s]} />
                </svg>
              </span>
              {SHAPE_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Carat</h3>
          <RangeSlider
            label="Carat"
            bounds={bounds.carat}
            value={query.carat}
            onChange={(carat) => onChange({ carat, page: 1 })}
            format={carats}
            parse={parseCarats}
            scale="log"
          />
        </div>

        {isGem ? (
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Gemstone</h3>
            <div className={styles.chips}>
              {GEM_VARIETIES.map((v) => (
                <ColorChip
                  key={v}
                  label={v}
                  swatch={TINT_SWATCH[GEM_TINT[v]]}
                  active={query.varieties.includes(v)}
                  onClick={() => onChange({ varieties: toggle(query.varieties, v), page: 1 })}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.card}>
            <div className={styles.cardHead}>
              <h3 className={styles.cardTitle}>Color</h3>
              <div className={styles.segmented}>
                {(["White", "Fancy"] as const).map((c) => (
                  <button key={c} data-active={query.colorType === c} onClick={() => onChange({ colorType: c, page: 1 })}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            {query.colorType === "White" ? (
              <GradeSlider label="Color" scale={COLORS} value={query.color} onChange={(color) => onChange({ color, page: 1 })} />
            ) : (
              <div className={styles.chips}>
                {FANCY_COLORS.map((c) => (
                  <ColorChip
                    key={c}
                    label={c}
                    swatch={TINT_SWATCH[FANCY_TINT[c]]}
                    active={query.fancyColors.includes(c)}
                    onClick={() => onChange({ fancyColors: toggle(query.fancyColors, c), page: 1 })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {!isGem && (
          <>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Clarity</h3>
              <GradeSlider label="Clarity" scale={CLARITIES} value={query.clarity} onChange={(clarity) => onChange({ clarity, page: 1 })} />
            </div>
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>Cut</h3>
              <GradeSlider label="Cut" scale={CUTS} value={query.cut} onChange={(cut) => onChange({ cut, page: 1 })} />
            </div>
          </>
        )}

        <div className={styles.card}>
          <h3 className={styles.cardTitle}>Budget</h3>
          <RangeSlider
            label="Budget"
            bounds={bounds.price}
            value={query.price}
            onChange={(price) => onChange({ price, page: 1 })}
            format={money}
            parse={parseMoney}
            scale="log"
          />
        </div>

        {!isGem && (
          <div className={`${styles.card} ${styles.center}`}>
            <label className={styles.check}>
              <input type="checkbox" checked={query.heartsArrows} onChange={(e) => onChange({ heartsArrows: e.target.checked, page: 1 })} />
              <span>
                Hearts &amp; Arrows
                <small>Round, ideal-cut stones with perfect optical symmetry</small>
              </span>
            </label>
          </div>
        )}
      </div>

      <div className={styles.filterBar}>
        <button className={styles.textButton} onClick={() => setAdvanced((v) => !v)} aria-expanded={advanced}>
          Advanced Filters
          <svg viewBox="0 0 24 24" width="16" height="16" data-open={advanced} className={styles.chev} aria-hidden>
            <path d="m6 9 6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
        <button className={styles.textButton} onClick={onReset}>
          Reset Filters
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden>
            <path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4h4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {advanced && (
        <div className={styles.grid2}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Polish &amp; symmetry</h3>
            <div className={styles.selectRow}>
              <MinGrade label="Polish" value={query.polish} onChange={(polish) => onChange({ polish, page: 1 })} />
              <MinGrade label="Symmetry" value={query.symmetry} onChange={(symmetry) => onChange({ symmetry, page: 1 })} />
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Certificate</h3>
            <div className={styles.chips}>
              {LABS.map((l) => (
                <Chip key={l} label={l} active={query.labs.includes(l)} onClick={() => onChange({ labs: toggle(query.labs, l), page: 1 })} />
              ))}
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Fluorescence</h3>
            <div className={styles.chips}>
              {FLUORESCENCE.map((f) => (
                <Chip
                  key={f}
                  label={f}
                  active={query.fluorescence.includes(f)}
                  onClick={() => onChange({ fluorescence: toggle(query.fluorescence, f), page: 1 })}
                />
              ))}
            </div>
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Depth %</h3>
            <RangeSlider
              label="Depth"
              bounds={[55, 75]}
              value={query.depth}
              onChange={(depth) => onChange({ depth, page: 1 })}
              format={(v) => `${v.toFixed(1)}%`}
              parse={parseCarats}
            />
          </div>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>Table %</h3>
            <RangeSlider
              label="Table"
              bounds={[50, 72]}
              value={query.table}
              onChange={(table) => onChange({ table, page: 1 })}
              format={(v) => `${v.toFixed(1)}%`}
              parse={parseCarats}
            />
          </div>
        </div>
      )}
    </section>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button className={styles.chip} data-active={active} aria-pressed={active} onClick={onClick}>
      {label}
    </button>
  );
}

function ColorChip({ label, swatch, active, onClick }: { label: string; swatch: string; active: boolean; onClick: () => void }) {
  return (
    <button className={styles.chip} data-active={active} aria-pressed={active} onClick={onClick}>
      <span className={styles.dot} style={{ background: swatch }} />
      {label}
    </button>
  );
}

function MinGrade({ label, value, onChange }: { label: string; value: Finish | null; onChange: (v: Finish | null) => void }) {
  return (
    <label className={styles.select}>
      <span>{label}</span>
      <select value={value ?? ""} onChange={(e) => onChange((e.target.value || null) as Finish | null)}>
        <option value="">Any</option>
        {FINISHES.map((f) => (
          <option key={f} value={f}>
            {f} or better
          </option>
        ))}
      </select>
    </label>
  );
}

function TypeIcon({ type }: { type: StoneType }) {
  if (type === "labgrown") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
        <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" strokeLinejoin="round" />
        <path d="M7.5 14h9" />
      </svg>
    );
  }
  if (type === "gemstone") {
    return (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden>
        <path d="M8.5 3h7L21 8.5v7L15.5 21h-7L3 15.5v-7z" />
        <path d="M9.5 7h5l2.5 2.5v5L14.5 17h-5L7 14.5v-5zM8.5 3l1 4M15.5 3l-1 4M21 8.5l-4 1M21 15.5l-4-1M15.5 21l-1-4M8.5 21l1-4M3 15.5l4-1M3 8.5l4 1" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" aria-hidden>
      <path d="M6 4h12l4 5-10 11L2 9z" />
      <path d="M2 9h20M9 4l3 16M15 4l-3 16" />
    </svg>
  );
}

