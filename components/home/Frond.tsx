/**
 * A leafy frond drawn in SVG, used as soft decoration: line art behind
 * sections, or (filled and blurred) as a palm-shadow over the hero.
 */
export default function Frond({ className }: { className?: string }) {
  const leaves = Array.from({ length: 10 }, (_, i) => {
    const y = 370 - i * 34;
    const len = 78 - i * 5;
    return [-1, 1].map((side) => (
      <path
        key={`${i}${side}`}
        d={`M100 ${y} q ${side * len * 0.45} ${-len * 0.2} ${side * len} ${-len * 0.62} q ${-side * len * 0.42} ${len * 0.08} ${-side * len} ${len * 0.62}z`}
      />
    ));
  });
  return (
    <svg viewBox="0 0 200 400" className={className} aria-hidden="true">
      <path d="M100 400 C 98 290, 108 160, 96 20" fill="none" />
      {leaves}
    </svg>
  );
}
