"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ProductCard } from "@/components/catalog/parts";
import type { GridItem } from "@/lib/catalog/collections";
import styles from "@/app/home.module.css";

/** How far (in ms of travel) a flick keeps the row moving after the mouse lets go. */
const MOMENTUM_MS = 320;

/**
 * A row of products that scrolls sideways. It can be dragged with the mouse
 * (or swiped), and the thin progress line underneath follows along and can be
 * dragged too. Letting go glides the row on and settles it on the nearest card.
 *
 * `centered` rows settle each card in the middle and open on the middle card,
 * with neighbours peeking in at both edges.
 */
export default function ArrivalsCarousel({
  items,
  label = "New arrivals",
  className = styles.carousel,
  bar = true,
  centered = false,
}: {
  items: GridItem[];
  label?: string;
  className?: string;
  bar?: boolean;
  centered?: boolean;
}) {
  const trackId = useId();
  const track = useRef<HTMLDivElement>(null);
  const rail = useRef<HTMLDivElement>(null);
  // How far along the row is, from 0 (start) to 1 (end).
  const [share, setShare] = useState(0);
  const [dragging, setDragging] = useState(false);
  // Snapping is switched off while the row is held or gliding, so it can't fight the motion.
  const [free, setFree] = useState(false);
  // Pointer drag state; `moved` stops a drag from also opening the card it started on.
  const drag = useRef({ x: 0, scroll: 0, moved: false, active: false, lastX: 0, lastT: 0, v: 0 });
  const settleTimer = useRef<number | undefined>(undefined);
  // Where a press on the progress line began, so a click's tiny wobble isn't taken for a drag.
  const railStart = useRef<number | null>(null);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const update = () => {
      const max = el.scrollWidth - el.clientWidth;
      setShare(max > 0 ? Math.min(Math.max(el.scrollLeft / max, 0), 1) : 0);
    };
    if (centered) {
      // Open on the middle card.
      const mid = el.children[Math.floor(el.children.length / 2)];
      if (mid) {
        const r = mid.getBoundingClientRect();
        el.scrollLeft += r.left - el.getBoundingClientRect().left - (el.clientWidth - r.width) / 2;
      }
    }
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      window.clearTimeout(settleTimer.current);
    };
  }, [centered]);

  /** The scroll position that rests the card closest to `x` (at its start, or its middle for centred rows). */
  const nearestCard = (el: HTMLDivElement, x: number) => {
    const max = el.scrollWidth - el.clientWidth;
    const origin = el.getBoundingClientRect().left - el.scrollLeft;
    let best = Infinity;
    for (const child of Array.from(el.children)) {
      const r = child.getBoundingClientRect();
      const rest = r.left - origin - (centered ? (el.clientWidth - r.width) / 2 : 0);
      const at = Math.min(Math.max(rest, 0), max);
      if (Math.abs(at - x) < Math.abs(best - x)) best = at;
    }
    return Number.isFinite(best) ? best : 0;
  };

  /** Glide the row to the card nearest `x`, then let snapping take over again. */
  const glideTo = (x: number) => {
    const el = track.current;
    if (!el) return;
    const target = nearestCard(el, x);
    window.clearTimeout(settleTimer.current);
    setFree(true);
    if (Math.abs(target - el.scrollLeft) < 1) {
      setFree(false);
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ left: target, behavior: reduce ? "auto" : "smooth" });
    const done = () => {
      window.clearTimeout(settleTimer.current);
      el.removeEventListener("scrollend", done);
      setFree(false);
    };
    if ("onscrollend" in window) el.addEventListener("scrollend", done);
    // A fallback for browsers without `scrollend`, and in case the glide is cut short.
    settleTimer.current = window.setTimeout(done, 1200);
  };

  // Mouse drag on the row (touch already scrolls natively, with its own momentum).
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || !track.current) return;
    const now = performance.now();
    drag.current = {
      x: e.clientX,
      scroll: track.current.scrollLeft,
      moved: false,
      active: true,
      lastX: e.clientX,
      lastT: now,
      v: 0,
    };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    const el = track.current;
    if (!d.active || !el) return;
    const dx = e.clientX - d.x;
    if (!d.moved && Math.abs(dx) > 5) {
      d.moved = true;
      window.clearTimeout(settleTimer.current);
      setDragging(true);
      setFree(true);
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // Capture is only a nicety; the drag works without it.
      }
    }
    if (!d.moved) return;
    el.scrollLeft = d.scroll - dx;
    // Track the pointer's speed (px per ms), smoothed so one jittery frame doesn't decide the flick.
    const now = performance.now();
    const dt = now - d.lastT;
    if (dt > 0) d.v = 0.7 * ((e.clientX - d.lastX) / dt) + 0.3 * d.v;
    d.lastX = e.clientX;
    d.lastT = now;
  };

  const endDrag = () => {
    const d = drag.current;
    const el = track.current;
    if (!d.active) return;
    d.active = false;
    setDragging(false);
    if (!d.moved || !el) return;
    // A pause before letting go means no flick.
    const v = performance.now() - d.lastT > 80 ? 0 : d.v;
    glideTo(el.scrollLeft - v * MOMENTUM_MS);
  };

  // Clicking along the progress line glides the row there; dragging it follows the pointer.
  const railTarget = (clientX: number) => {
    const el = track.current;
    const r = rail.current?.getBoundingClientRect();
    if (!el || !r) return null;
    const at = Math.min(Math.max((clientX - r.left) / r.width, 0), 1);
    return at * (el.scrollWidth - el.clientWidth);
  };

  return (
    <>
      <div
        className={className}
        ref={track}
        id={trackId}
        tabIndex={0}
        aria-label={label}
        data-dragging={dragging || undefined}
        data-free={free || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (drag.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            drag.current.moved = false;
          }
        }}
      >
        {items.map((item) => (
          <ProductCard key={item.href} item={item} />
        ))}
      </div>
      {bar && (
        <div
          className={styles.progress}
          ref={rail}
          role="scrollbar"
          aria-controls={trackId}
          aria-orientation="horizontal"
          aria-valuenow={Math.round(share * 100)}
          aria-label={`Scroll ${label.toLowerCase()}`}
          onPointerDown={(e) => {
            railStart.current = e.clientX;
            const x = railTarget(e.clientX);
            if (x !== null) glideTo(x);
            // Keep following the pointer if it leaves the thin line while dragging.
            try {
              e.currentTarget.setPointerCapture(e.pointerId);
            } catch {
              // Not a live pointer (e.g. synthetic events): the click alone still scrolls.
            }
          }}
          onPointerMove={(e) => {
            const el = track.current;
            const x = railTarget(e.clientX);
            const start = railStart.current;
            if (e.buttons !== 1 || !el || x === null || start === null) return;
            if (Math.abs(e.clientX - start) < 4) return;
            window.clearTimeout(settleTimer.current);
            setFree(true);
            el.scrollTo({ left: x, behavior: "auto" });
          }}
          onPointerUp={(e) => {
            const start = railStart.current;
            railStart.current = null;
            // After a drag along the line, settle on the nearest card.
            const x = railTarget(e.clientX);
            if (start !== null && Math.abs(e.clientX - start) >= 4 && x !== null) glideTo(x);
          }}
        >
          {/* The thumb is a fixed short dash that travels the length of the line. */}
          <span style={{ left: `calc((100% - var(--thumb)) * ${share})` }} />
        </div>
      )}
    </>
  );
}
