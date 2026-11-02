"use client";

import { useEffect, useState } from "react";
import styles from "./Sliders.module.css";

const STEPS = 1000;

type Scale = "linear" | "log";

const toPos = (v: number, [lo, hi]: [number, number], scale: Scale) =>
  scale === "log" ? (Math.log(v / lo) / Math.log(hi / lo)) * STEPS : ((v - lo) / (hi - lo)) * STEPS;

const fromPos = (p: number, [lo, hi]: [number, number], scale: Scale) =>
  scale === "log" ? lo * Math.pow(hi / lo, p / STEPS) : lo + ((hi - lo) * p) / STEPS;

/**
 * Two-handle slider over a number range, with typed inputs underneath.
 * Prices use a log scale so the cheap end isn't squashed into a few pixels.
 */
export function RangeSlider({
  bounds,
  value,
  onChange,
  scale = "linear",
  format,
  parse,
  label,
  compact = false,
}: {
  bounds: [number, number];
  value: [number, number] | null;
  onChange: (next: [number, number] | null) => void;
  scale?: Scale;
  format: (v: number) => string;
  parse: (s: string) => number;
  label: string;
  /** Sidebar style: tick marks and the two values as short labels, no typed inputs. */
  compact?: boolean;
}) {
  const current = value ?? bounds;
  const [lo, hi] = [Math.max(bounds[0], current[0]), Math.min(bounds[1], current[1])];
  // Dragging updates locally; the search runs when the handle is released.
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const shown = drag ?? [lo, hi];
  const [text, setText] = useState([format(shown[0]), format(shown[1])]);
  useEffect(() => setText([format(shown[0]), format(shown[1])]), [shown[0], shown[1]]); // eslint-disable-line react-hooks/exhaustive-deps

  const commit = (next: [number, number]) => {
    setDrag(null);
    const isFull = Math.abs(next[0] - bounds[0]) < 1e-9 && Math.abs(next[1] - bounds[1]) < 1e-9;
    onChange(isFull ? null : next);
  };

  const p0 = toPos(shown[0], bounds, scale);
  const p1 = toPos(shown[1], bounds, scale);

  const typed = (i: 0 | 1) => {
    const v = parse(text[i]);
    if (!Number.isFinite(v)) return setText([format(lo), format(hi)]);
    const next: [number, number] =
      i === 0 ? [Math.min(Math.max(v, bounds[0]), hi), hi] : [lo, Math.max(Math.min(v, bounds[1]), lo)];
    commit(next);
  };

  return (
    <div className={styles.range} data-compact={compact || undefined}>
      <div
        className={styles.track}
        style={{ "--a": `${(p0 / STEPS) * 100}%`, "--b": `${(p1 / STEPS) * 100}%` } as React.CSSProperties}
      >
        {compact && (
          <span className={styles.ticks} aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <i key={i} style={{ left: `${i * 20}%` }} />
            ))}
          </span>
        )}
        {[0, 1].map((i) => (
          <input
            key={i}
            type="range"
            min={0}
            max={STEPS}
            value={i === 0 ? p0 : p1}
            aria-label={`${label} ${i === 0 ? "minimum" : "maximum"}`}
            onChange={(e) => {
              const v = fromPos(Number(e.target.value), bounds, scale);
              setDrag(i === 0 ? [Math.min(v, shown[1]), shown[1]] : [shown[0], Math.max(v, shown[0])]);
            }}
            onPointerUp={() => drag && commit(drag)}
            onKeyUp={() => drag && commit(drag)}
            onBlur={() => drag && commit(drag)}
          />
        ))}
      </div>
      {compact ? (
        <div className={styles.ends}>
          <span>{format(shown[0])}</span>
          <span>{format(shown[1])}</span>
        </div>
      ) : (
        <div className={styles.inputs}>
          {[0, 1].map((i) => (
            <label key={i} className={styles.field}>
              <span>{i === 0 ? "Min" : "Max"}</span>
              <input
                className={styles.box}
                value={text[i]}
                aria-label={`${label} ${i === 0 ? "from" : "to"}`}
                onChange={(e) => setText(i === 0 ? [e.target.value, text[1]] : [text[0], e.target.value])}
                onBlur={() => typed(i as 0 | 1)}
                onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
              />
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

/** Two-handle slider over a grading scale (colour D–J, clarity FL–I1, cut). */
export function GradeSlider({
  scale,
  value,
  onChange,
  label,
}: {
  scale: readonly string[];
  value: [number, number];
  onChange: (next: [number, number]) => void;
  label: string;
}) {
  const last = scale.length - 1;
  const [drag, setDrag] = useState<[number, number] | null>(null);
  const shown = drag ?? value;
  const commit = (next: [number, number]) => {
    setDrag(null);
    if (next[0] !== value[0] || next[1] !== value[1]) onChange(next);
  };

  return (
    <div className={styles.grade}>
      <div
        className={styles.track}
        style={
          {
            "--a": `${(shown[0] / last) * 100}%`,
            "--b": `${(shown[1] / last) * 100}%`,
            "--steps": last,
          } as React.CSSProperties
        }
        data-stepped
      >
        {[0, 1].map((i) => (
          <input
            key={i}
            type="range"
            min={0}
            max={last}
            step={1}
            value={shown[i]}
            aria-label={`${label} ${i === 0 ? "best" : "lowest"}`}
            aria-valuetext={scale[shown[i]]}
            onChange={(e) => {
              const v = Number(e.target.value);
              const next: [number, number] =
                i === 0 ? [Math.min(v, shown[1]), shown[1]] : [shown[0], Math.max(v, shown[0])];
              // Pointer drags and key presses commit when released.
              setDrag(next);
            }}
            onPointerUp={() => drag && commit(drag)}
            onKeyUp={() => drag && commit(drag)}
            onBlur={() => drag && commit(drag)}
          />
        ))}
      </div>
      <div className={styles.labels}>
        {scale.map((s, i) => (
          <button
            key={s}
            type="button"
            className={styles.tick}
            data-in={i >= shown[0] && i <= shown[1]}
            onClick={() => commit(i < shown[0] ? [i, shown[1]] : i > shown[1] ? [shown[0], i] : [i, i])}
            title={`Only ${s}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
