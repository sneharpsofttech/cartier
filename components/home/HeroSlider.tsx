"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import styles from "@/app/home.module.css";

/** How long each slide stays before the next (the line after the slide number fills over this time). */
const SLIDE_MS = 6500;

/** A four-point sparkle, as in the logo. */
const SPARK = "M12 2c.6 4.8 2.4 8.4 10 10-7.6 1.6-9.4 5.2-10 10-.6-4.8-2.4-8.4-10-10 7.6-1.6 9.4-5.2 10-10z";

/** Where the twinkling stars sit (as shares of the hero), their size in px and when each starts. */
const SPARKLES = [
  { top: "14%", left: "31%", size: 24, delay: 0 },
  { top: "7%", left: "56%", size: 16, delay: 1.2 },
  { top: "33%", left: "96%", size: 22, delay: 0.6 },
  { top: "74%", left: "97%", size: 15, delay: 2 },
  { top: "93%", left: "53%", size: 18, delay: 1.6 },
  { top: "86%", left: "22%", size: 16, delay: 2.6 },
];

/** Marks a piece for the first-load reveal (see globals.css), starting after `delay` seconds. */
const reveal = (delay: number, kind?: "wipe") => ({
  "data-reveal": kind ?? "",
  style: { "--reveal-delay": `${delay}s` } as React.CSSProperties,
});

export type Slide = {
  kicker: string;
  title: string;
  text: string;
  href: string;
  /** The large arched photo, a smaller piece below the text, and an arched photo beside it. */
  main: string;
  small: string;
  side: string;
  alt: string;
};

/**
 * The home hero: a beige column (it runs up behind the header) holding a tall
 * outlined word and the slide thumbnails, the arched main photo straddling the
 * column's edge, the message, and a numbered navigator. Changes slide every few
 * seconds until the visitor picks one.
 */
export default function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  // False while the page loader is up, so the first slide gets its full time on screen.
  const [ready, setReady] = useState(false);
  // Set once the slide has changed: from then on each new slide animates in (the first is revealed by the loader).
  const [moved, setMoved] = useState(false);

  useEffect(() => {
    const root = document.documentElement;
    const check = () => {
      if (!root.hasAttribute("data-loading")) setReady(true);
    };
    check();
    const watch = new MutationObserver(check);
    watch.observe(root, { attributes: true, attributeFilter: ["data-loading"] });
    return () => watch.disconnect();
  }, []);

  useEffect(() => {
    if (!auto || !ready) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
      setMoved(true);
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, [auto, ready, slides.length]);

  const go = (i: number) => {
    setAuto(false);
    setIndex(i);
    setMoved(true);
  };
  const s = slides[index];

  return (
    <section className={styles.hero} aria-roledescription="carousel" aria-label="Featured">
      <span className={styles.railWord} aria-hidden="true" {...reveal(0.1)}>
        Unparalleled
      </span>

      <div className={styles.thumbs} {...reveal(0.15)}>
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            className={styles.thumb}
            data-active={i === index}
            aria-label={`Show slide ${i + 1}: ${slide.title}`}
            onClick={() => go(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={slide.main} alt="" />
          </button>
        ))}
      </div>

      <div className={styles.heroMain} key={`main-${index}`} data-anim={moved || undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={s.main} alt={s.alt} {...reveal(0.2, "wipe")} />
      </div>

      <div className={styles.heroCopy} key={`copy-${index}`} data-anim={moved || undefined}>
        <p className={styles.heroKicker} {...reveal(0.45)}>
          {s.kicker}
        </p>
        <h1 {...reveal(0.55)}>{s.title}</h1>
        <p {...reveal(0.65)}>{s.text}</p>
        {/* The button with the rings under it, and the small arched photo beside them. */}
        <div className={styles.heroRow} {...reveal(0.75)}>
          <div className={styles.heroLeft}>
            <Link href={s.href} className={`btn ${styles.heroBtn}`}>
              Know More
              <span aria-hidden="true">→</span>
            </Link>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.small} alt="" className={styles.heroRings} />
          </div>
          <span className={styles.heroSide}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.side} alt="" />
          </span>
        </div>
      </div>

      <div
        className={styles.dots}
        data-auto={(auto && ready) || undefined}
        data-reveal=""
        style={{ "--reveal-delay": "0.85s", "--slide-ms": `${SLIDE_MS}ms` } as React.CSSProperties}
      >
        {slides.map((slide, i) => (
          <button
            key={slide.title}
            data-active={i === index}
            aria-label={`Slide ${i + 1}`}
            aria-current={i === index}
            onClick={() => go(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* A round badge on the photo's lower corner: circular text turning around a pulsing star. */}
      <Link href="/settings" className={styles.badge} aria-label="Design your ring in 3D" {...reveal(0.95)}>
        <svg viewBox="0 0 120 120" className={styles.badgeText} aria-hidden="true">
          <path id="hero-badge-path" d="M60 14a46 46 0 1 1 0 92a46 46 0 1 1 0-92" fill="none" />
          <text>
            <textPath href="#hero-badge-path" textLength="286" lengthAdjust="spacing">
              Handcrafted ✦ Designed By You ✦
            </textPath>
          </text>
        </svg>
        <svg viewBox="0 0 24 24" className={styles.badgeStar} aria-hidden="true">
          <path d={SPARK} />
        </svg>
      </Link>

      {/* Small gold stars that twinkle in and out around the hero. */}
      <span className={styles.sparkles} aria-hidden="true" {...reveal(1.05)}>
        {SPARKLES.map((p) => (
          <svg
            key={`${p.top}-${p.left}`}
            viewBox="0 0 24 24"
            className={styles.sparkle}
            style={{ top: p.top, left: p.left, width: p.size, height: p.size, animationDelay: `${p.delay}s` }}
          >
            <path d={SPARK} />
          </svg>
        ))}
      </span>
    </section>
  );
}
