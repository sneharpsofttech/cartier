import * as THREE from "three";

export type ShapeId =
  | "round"
  | "oval"
  | "cushion"
  | "emerald"
  | "pear"
  | "princess"
  | "asscher"
  | "marquise"
  | "heart"
  | "radiant";

type Cut = "brilliant" | "step";

/**
 * A stone is described by its girdle outline in the (u, v) plane: u runs
 * east-west across the finger (world X), v runs along the finger (world Z).
 * Outlines are normalised so the half-width along u is about 1.
 */
export type ShapeDef = {
  id: ShapeId;
  label: string;
  cut: Cut;
  /** Facets around the girdle for curved outlines. Ignored by polygons. */
  segments: number;
  /** Sample `n` girdle points, rotated by `offset` (0..1) of a step. */
  sample: (n: number, offset: number) => THREE.Vector2[];
  /** Prong directions in radians, measured in the (u, v) plane. */
  prongs: number[];
};

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;
const FOUR_CORNERS = [45, 135, 225, 315].map((d) => d * DEG);

export function parametric(fn: (t: number) => [number, number]) {
  return (n: number, offset: number) =>
    Array.from({ length: n }, (_, i) => new THREE.Vector2(...fn(((i + offset) / n) * TAU)));
}

/** Rectangle with cut corners, listed anticlockwise. */
/**
 * A fixed polygon outline. A half-step `offset` (used by brilliant cuts for
 * their star and chevron facets) samples part-way along each edge instead, so
 * the tiers are rotated against each other rather than stacked as flat copies.
 */
export function polygon(corners: [number, number][]) {
  const pts = corners.map(([u, v]) => new THREE.Vector2(u, v));
  return (_n: number, offset: number) =>
    pts.map((p, i) => (offset ? p.clone().lerp(pts[(i + 1) % pts.length], offset) : p.clone()));
}

function chamferedRect(halfW: number, halfL: number, cut: number) {
  const pts: [number, number][] = [
    [halfW, -halfL + cut],
    [halfW, halfL - cut],
    [halfW - cut, halfL],
    [-halfW + cut, halfL],
    [-halfW, halfL - cut],
    [-halfW, -halfL + cut],
    [-halfW + cut, -halfL],
    [halfW - cut, -halfL],
  ];
  return polygon(pts);
}

const pow = (x: number, e: number) => Math.sign(x) * Math.abs(x) ** e;

export const SHAPES: ShapeDef[] = [
  {
    id: "round",
    label: "Round",
    cut: "brilliant",
    segments: 16,
    sample: parametric((t) => [Math.cos(t), Math.sin(t)]),
    prongs: FOUR_CORNERS,
  },
  {
    id: "oval",
    label: "Oval",
    cut: "brilliant",
    segments: 24,
    sample: parametric((t) => [Math.cos(t), 1.4 * Math.sin(t)]),
    prongs: [35, 145, 215, 325].map((d) => d * DEG),
  },
  {
    id: "cushion",
    label: "Cushion",
    cut: "brilliant",
    segments: 24,
    sample: parametric((t) => [pow(Math.cos(t), 0.6), 1.06 * pow(Math.sin(t), 0.6)]),
    prongs: FOUR_CORNERS,
  },
  {
    id: "emerald",
    label: "Emerald",
    cut: "step",
    segments: 8,
    sample: chamferedRect(1, 1.42, 0.3),
    prongs: [50, 130, 230, 310].map((d) => d * DEG),
  },
  {
    id: "pear",
    label: "Pear",
    cut: "brilliant",
    segments: 28,
    // Rounded at -v, drawn to a point at +v.
    sample: parametric((t) => {
      const s = Math.sin(t);
      return [s * Math.abs(s) ** ((1 + Math.cos(t)) / 2), 1.55 * Math.cos(t) - 0.25 * s * s];
    }),
    prongs: [90, 205, 335].map((d) => d * DEG),
  },
  {
    id: "princess",
    label: "Princess",
    cut: "brilliant",
    segments: 8,
    sample: polygon([
      [0.9, 0],
      [0.9, 0.9],
      [0, 0.9],
      [-0.9, 0.9],
      [-0.9, 0],
      [-0.9, -0.9],
      [0, -0.9],
      [0.9, -0.9],
    ]),
    prongs: FOUR_CORNERS,
  },
  {
    id: "asscher",
    label: "Asscher",
    cut: "step",
    segments: 8,
    sample: chamferedRect(0.92, 0.92, 0.34),
    prongs: FOUR_CORNERS,
  },
  {
    id: "marquise",
    label: "Marquise",
    cut: "brilliant",
    segments: 28,
    sample: parametric((t) => {
      const s = Math.sin(t);
      return [s * Math.abs(s) ** 0.75, 2 * Math.cos(t)];
    }),
    prongs: [90, 270, 25, 155].map((d) => d * DEG),
  },
  {
    id: "heart",
    label: "Heart",
    cut: "brilliant",
    segments: 32,
    // Classic heart curve; lobes at +v, point at -v.
    sample: parametric((t) => [
      Math.sin(t) ** 3 * 1.05,
      (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) / 15 + 0.12,
    ]),
    prongs: [270, 40, 140].map((d) => d * DEG),
  },
  {
    id: "radiant",
    label: "Radiant",
    cut: "brilliant",
    segments: 8,
    sample: chamferedRect(1, 1.25, 0.22),
    prongs: [50, 130, 230, 310].map((d) => d * DEG),
  },
];

export const shapeById = (id: string) => SHAPES.find((s) => s.id === id) ?? SHAPES[0];

function signedArea(pts: THREE.Vector2[]) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i];
    const q = pts[(i + 1) % pts.length];
    a += p.x * q.y - q.x * p.y;
  }
  return a / 2;
}

/** Girdle points, always anticlockwise so faces wind outwards. */
export function outline(def: ShapeDef, n = def.segments, offset = 0) {
  const pts = def.sample(n, offset);
  return signedArea(pts) < 0 ? pts.reverse() : pts;
}

/** A finely sampled outline for paths (halos, galleries) and measurements. */
export function denseOutline(def: ShapeDef) {
  // Curved outlines honour the requested count; polygons always return their corners.
  const isPolygon = def.sample(64, 0).length !== 64;
  if (!isPolygon) return outline(def, 128);
  // Subdivide polygon edges so path offsets stay smooth.
  const corners = outline(def);
  const pts: THREE.Vector2[] = [];
  corners.forEach((c, i) => {
    const next = corners[(i + 1) % corners.length];
    for (let k = 0; k < 12; k++) pts.push(c.clone().lerp(next, k / 12));
  });
  return pts;
}

/** Area relative to a unit circle, used to keep carat weight honest across shapes. */
export function areaFactor(def: ShapeDef) {
  return Math.abs(signedArea(denseOutline(def))) / Math.PI;
}

/** Distance from the centre to the outline in direction `angle`. */
export function radiusAt(pts: THREE.Vector2[], angle: number) {
  const dir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
  let best = 0;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    const e = b.clone().sub(a);
    const denom = dir.x * e.y - dir.y * e.x;
    if (Math.abs(denom) < 1e-9) continue;
    const t = (a.x * e.y - a.y * e.x) / denom; // distance along the ray
    const s = (a.x * dir.y - a.y * dir.x) / denom; // position along the edge
    if (t > 0 && s >= 0 && s <= 1) best = Math.max(best, t);
  }
  return best;
}

/** Offset a closed outline outward by `distance`, keeping its shape. */
export function offsetOutline(pts: THREE.Vector2[], distance: number) {
  return pts.map((p, i) => {
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const next = pts[(i + 1) % pts.length];
    const tangent = next.clone().sub(prev).normalize();
    // Anticlockwise outline: outward normal is the tangent turned clockwise.
    const normal = new THREE.Vector2(tangent.y, -tangent.x);
    return p.clone().add(normal.multiplyScalar(distance));
  });
}

/** Evenly spaced points along a closed polyline, with their tangents. */
export function spacedAlong(pts: THREE.Vector2[], spacing: number) {
  const lengths: number[] = [0];
  for (let i = 0; i < pts.length; i++) {
    lengths.push(lengths[i] + pts[i].distanceTo(pts[(i + 1) % pts.length]));
  }
  const total = lengths[lengths.length - 1];
  const count = Math.max(3, Math.round(total / spacing));
  const out: { point: THREE.Vector2; tangent: THREE.Vector2 }[] = [];
  let seg = 0;
  for (let k = 0; k < count; k++) {
    const d = (k / count) * total;
    while (lengths[seg + 1] < d) seg++;
    const a = pts[seg];
    const b = pts[(seg + 1) % pts.length];
    const f = (d - lengths[seg]) / (lengths[seg + 1] - lengths[seg] || 1);
    out.push({ point: a.clone().lerp(b, f), tangent: b.clone().sub(a).normalize() });
  }
  return out;
}

type Tier = { scale: number; height: number; offset: number };

const TIERS: Record<Cut, { crown: Tier[]; table: number; pavilion: Tier[]; culet: number }> = {
  brilliant: {
    crown: [
      { scale: 1, height: 0.03, offset: 0 },
      { scale: 0.84, height: 0.17, offset: 0.5 },
      { scale: 0.58, height: 0.32, offset: 0 },
    ],
    table: 0.32,
    pavilion: [
      { scale: 1, height: -0.03, offset: 0 },
      { scale: 0.5, height: -0.43, offset: 0.5 },
    ],
    culet: -0.86,
  },
  step: {
    crown: [
      { scale: 1, height: 0.03, offset: 0 },
      { scale: 0.9, height: 0.12, offset: 0 },
      { scale: 0.79, height: 0.2, offset: 0 },
      { scale: 0.68, height: 0.26, offset: 0 },
    ],
    table: 0.26,
    pavilion: [
      { scale: 1, height: -0.03, offset: 0 },
      { scale: 0.78, height: -0.22, offset: 0 },
      { scale: 0.56, height: -0.4, offset: 0 },
      { scale: 0.32, height: -0.55, offset: 0 },
      { scale: 0.1, height: -0.66, offset: 0 },
    ],
    culet: -0.7,
  },
};

export const crownHeight = (def: ShapeDef) => TIERS[def.cut].table;
export const pavilionDepth = (def: ShapeDef) => -TIERS[def.cut].culet;

/**
 * Faceted stone: stacked rings of the girdle outline (scaled, sometimes
 * rotated half a facet) joined into flat faces. Table faces +Y, girdle at y = 0.
 */
export function createCutGeometry(def: ShapeDef) {
  const tiers = TIERS[def.cut];
  const ring = (t: Tier) =>
    outline(def, def.segments, t.offset).map((p) => new THREE.Vector3(p.x * t.scale, t.height, p.y * t.scale));

  // Bottom to top: pavilion rings reversed, then crown rings.
  const rings = [...tiers.pavilion].reverse().map(ring).concat(tiers.crown.map(ring));
  const positions: number[] = [];
  const push = (...vs: THREE.Vector3[]) => vs.forEach((v) => positions.push(v.x, v.y, v.z));

  for (let r = 0; r < rings.length - 1; r++) {
    const lo = rings[r];
    const hi = rings[r + 1];
    for (let j = 0; j < lo.length; j++) {
      const j1 = (j + 1) % lo.length;
      push(lo[j], hi[j], lo[j1]);
      push(lo[j1], hi[j], hi[j1]);
    }
  }

  const top = rings[rings.length - 1];
  const bottom = rings[0];
  const table = new THREE.Vector3(0, tiers.table, 0);
  const culet = new THREE.Vector3(0, tiers.culet, 0);
  for (let j = 0; j < top.length; j++) push(table, top[(j + 1) % top.length], top[j]);
  for (let j = 0; j < bottom.length; j++) push(culet, bottom[j], bottom[(j + 1) % bottom.length]);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** SVG path of the outline for UI thumbnails, fitted to a 24×24 box. */
export function shapePath(def: ShapeDef) {
  const pts = denseOutline(def);
  const maxExtent = Math.max(...pts.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))));
  const k = 10 / maxExtent;
  return (
    pts
      .map((p, i) => `${i ? "L" : "M"}${(12 + p.x * k).toFixed(2)} ${(12 - p.y * k).toFixed(2)}`)
      .join(" ") + "Z"
  );
}

/**
 * Face-up facet diagram for icons (24 x 24 viewBox, like shapePath): the girdle,
 * each crown tier, and the facet edges between tiers, as seen from above.
 */
export function shapeFacetPath(def: ShapeDef) {
  const dense = denseOutline(def);
  const maxExtent = Math.max(...dense.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))));
  const k = 10 / maxExtent;
  const xy = (p: THREE.Vector2) => `${(12 + p.x * k).toFixed(2)} ${(12 - p.y * k).toFixed(2)}`;
  const loop = (pts: THREE.Vector2[]) => pts.map((p, i) => `${i ? "L" : "M"}${xy(p)}`).join(" ") + "Z";

  // An eight-fold facet pattern (like a classic brilliant diagram) keeps small icons legible.
  const n = Math.min(def.segments, 8);
  const tiers = TIERS[def.cut].crown;
  const rings = tiers.map((t) => outline(def, n, t.offset).map((p) => p.clone().multiplyScalar(t.scale)));

  const parts = [loop(dense), ...rings.slice(1).map(loop)];
  for (let r = 0; r < rings.length - 1; r++) {
    const lo = rings[r];
    const hi = rings[r + 1];
    for (let j = 0; j < lo.length; j++) {
      parts.push(`M${xy(lo[j])} L${xy(hi[j])}`);
      // Brilliant cuts also show the kite and star edges; step cuts only the corner lines.
      if (def.cut === "brilliant") parts.push(`M${xy(hi[j])} L${xy(lo[(j + 1) % lo.length])}`);
    }
  }
  return parts.join(" ");
}
