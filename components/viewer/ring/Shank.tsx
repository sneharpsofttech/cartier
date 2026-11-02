"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { MetalMaterial } from "../materials";
import { VineCurve, surfaceMatrix } from "../geometry";
import type { ShankStyle } from "./config";
import { createCutGeometry, parametric, polygon, shapeById, type ShapeDef } from "./shapes";
import { BAND_RADIUS, BAND_TUBE, InstancedGems, InstancedMetal, UNIT_SPHERE, sphereMatrix } from "./parts";

const R = BAND_RADIUS;
const T = BAND_TUBE;
/** Outer surface of the standard band, where most side stones sit. */
const S = R + T;

/** Side-stone outlines the centre-stone list doesn't offer; the flat edge or wide end is at -v. */
const HALF_MOON: ShapeDef = {
  ...shapeById("round"),
  segments: 24,
  sample: parametric((t) =>
    t < Math.PI ? [Math.cos(t), 0.95 * Math.sin(t) - 0.4] : [-1 + (2 * (t - Math.PI)) / Math.PI, -0.4],
  ),
};
const TRAPEZOID: ShapeDef = {
  ...shapeById("emerald"),
  sample: polygon([
    [1, -0.75],
    [0.6, 0.75],
    [-0.6, 0.75],
    [-1, -0.75],
  ]),
};

const cut = (id: string) => createCutGeometry(shapeById(id));

/**
 * Unit stones. Local X runs along the band and Z across it: "along" stones are
 * turned so their length (or point, or bulge) runs along +X.
 */
const STONES = {
  round: cut("round"),
  princess: cut("princess"),
  radiant: cut("radiant"),
  marquise: cut("marquise").rotateY(Math.PI / 2),
  marquiseAcross: cut("marquise"),
  baguette: cut("emerald").rotateY(Math.PI / 2),
  emeraldAcross: cut("emerald"),
  pear: cut("pear").rotateY(Math.PI / 2),
  pearAcross: cut("pear"),
  halfMoon: createCutGeometry(HALF_MOON).rotateY(Math.PI / 2),
  trapezoid: createCutGeometry(TRAPEZOID).rotateY(Math.PI / 2),
};

/** A metal cup that wraps a stone's girdle, open at the top (unit stone radius 1). */
const BEZEL_CUP = new THREE.LatheGeometry(
  [
    [0, -0.85],
    [1.12, -0.85],
    [1.22, 0.16],
    [1.04, 0.16],
    [1, -0.3],
    [0, -0.3],
  ].map(([x, y]) => new THREE.Vector2(x, y)),
  32,
);
/** A thin round plate that clustered stones sit on. */
const DISC = new THREE.CylinderGeometry(1, 1, 0.3, 32);

/** Half the shank width, so a stacked band can sit right beside it. */
export const SHANK_HALF_WIDTH: Record<ShankStyle, number> = {
  solitaire: 0.145,
  knifeEdge: 0.11,
  pave: 0.11,
  graduated: 0.145,
  doubleRow: 0.19,
  channel: 0.17,
  splitPave: 0.22,
  twist: 0.09,
  marquiseVine: 0.24,
  marquiseSide: 0.12,
  baguette: 0.12,
  floatingMarquise: 0.09,
  radiantDemi: 0.17,
  diamondArch: 0.11,
  frenchPave1: 0.11,
  frenchPave2: 0.11,
  frenchPave3: 0.12,
  frenchPave4: 0.12,
  pave1: 0.19,
  taperedPave: 0.13,
  miniTaperedPave: 0.09,
  splitProng: 0.115,
  bloom: 0.12,
  collar: 0.2,
  ropeScarf: 0.08,
  tripleRow: 0.24,
  modernSplit: 0.22,
  stepEmerald: 0.16,
  tripleWave: 0.09,
  frameTrapezoid: 0.12,
  halfMoonSide: 0.12,
  chloe: 0.07,
  emerald: 0.13,
  dotDash: 0.11,
  flowerPetal: 0.12,
  intertwined: 0.11,
  ribbon: 0.11,
  paveBow: 0.13,
  station: 0.1,
  doubleBaguette: 0.21,
  doubleRowSide: 0.19,
  pearSide: 0.115,
  splitCathedral: 0.2,
  trapezoidSide: 0.12,
  trio: 0.14,
  sofia: 0.13,
  traditional12: 0.11,
  roundSide: 0.12,
  zhuri: 0.12,
  marquiseHalfEternity: 0.115,
};

/**
 * Plain bands that keep the head's cathedral shoulders. On every other style
 * the shoulders would sit over the design near the head (pavé, side stones,
 * wires, split arms), so the head stands on its prongs and seat alone.
 */
export const CATHEDRAL_SHANKS: ReadonlySet<ShankStyle> = new Set<ShankStyle>(["solitaire", "knifeEdge", "traditional12"]);

/** Stone layout on the outer surface: angle `a` around the band, offset `z` across it, optional radius `r`. */
type Spot = { a: number; z: number; size: number; spin?: number; r?: number };

const radial = (a: number) => new THREE.Vector3(Math.cos(a), Math.sin(a), 0);
const tangentAt = (a: number) => new THREE.Vector3(-Math.sin(a), Math.cos(a), 0);
/** Angle down from the top of the ring, 0 under the head to PI at the palm. */
const fromTop = (a: number) => Math.abs(Math.atan2(Math.cos(a), Math.sin(a)));

function spotMatrix({ a, z, size, spin = 0, r }: Spot, surface: number) {
  const n = radial(a);
  const pos = n.clone().multiplyScalar(r ?? surface).setZ(z);
  return surfaceMatrix(pos, n, tangentAt(a), spin, size);
}

/** Angles stepping down both shoulders from the head, symmetric about the top. */
function shoulders(from: number, to: number, step: (phi: number) => number) {
  const out: { a: number; phi: number }[] = [];
  for (let phi = from; phi <= to; phi += step(phi)) {
    out.push({ a: Math.PI / 2 + phi, phi }, { a: Math.PI / 2 - phi, phi });
  }
  return out;
}

function fullCircle(step: number) {
  const count = Math.round((Math.PI * 2) / step);
  return Array.from({ length: count }, (_, i) => ({ a: (i / count) * Math.PI * 2, phi: 0 }));
}

/**
 * The same stone on both shoulders, `phi` down from the head. The far side is
 * the mirror image; `pointed` stones (pear, half moon, trapezoid) are turned so
 * that both point away from the head.
 */
function pair(phi: number, spot: Omit<Spot, "a">, pointed = false): Spot[] {
  const spin = spot.spin ?? 0;
  return [
    { ...spot, a: Math.PI / 2 + phi, spin },
    { ...spot, a: Math.PI / 2 - phi, spin: pointed ? Math.PI - spin : -spin },
  ];
}

/** A row down both shoulders; each stone's size (fixed or by angle) times `pitch` sets the spacing. */
function row(from: number, to: number, size: number | ((phi: number) => number), pitch: number, z = 0) {
  const sizeAt = typeof size === "number" ? () => size : size;
  const out: Spot[] = [];
  for (let phi = from; phi <= to; phi += (sizeAt(phi) * pitch) / S) out.push(...pair(phi, { z, size: sizeAt(phi) }));
  return out;
}

/** Stones of two kinds taking turns down the shoulders; `lengths` are their sizes along the band. */
function alternating(from: number, to: number, kinds: { size: number; length: number }[], gap: number) {
  const out: Spot[][] = kinds.map(() => []);
  for (let phi = from, k = 0; ; k++) {
    const kind = kinds[k % kinds.length];
    phi += kind.length / 2 / S;
    if (phi > to) break;
    out[k % kinds.length].push(...pair(phi, { z: 0, size: kind.size }));
    phi += kind.length / 2 / S + gap;
  }
  return out;
}

const gemsOf = (geometry: THREE.BufferGeometry, spots: Spot[], surface: number) => ({
  geometry,
  matrices: spots.map((s) => spotMatrix(s, surface)),
});

/**
 * Where shared claws go along rows of stones: the middle of each gap between
 * neighbouring stones, and just past the outer end of each row. Neighbours are
 * stones in the same row (about the same `z`) within a stone's length or so,
 * which also follows rows that curve, as on split arms.
 */
function clawSpots(spots: Spot[], surface: number) {
  const out: Spot[] = [];
  const neighbour = (p: Spot, dir: number) => {
    let best: Spot | undefined;
    let gap = Infinity;
    for (const q of spots) {
      if (Math.abs(q.z - p.z) > p.size * 0.6) continue;
      let d = (q.a - p.a) * dir;
      if (d <= 0) d += Math.PI * 2; // round the back of an eternity band (and rules out p itself)
      if (d < gap && d < (1.4 * (p.size + q.size)) / surface) [best, gap] = [q, d];
    }
    return best;
  };
  for (const p of spots) {
    const r = p.r ?? surface;
    const next = neighbour(p, 1);
    if (next) {
      const delta = ((next.a - p.a + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
      out.push({ a: p.a + delta / 2, z: (p.z + next.z) / 2, size: (p.size + next.size) / 2, r: (r + (next.r ?? surface)) / 2 });
    } else {
      out.push({ a: p.a + (p.size * 1.02) / r, z: p.z, size: p.size, r });
    }
    if (!neighbour(p, -1)) out.push({ a: p.a - (p.size * 1.02) / r, z: p.z, size: p.size, r });
  }
  return out;
}

/** Shared claws, as in a pav\u00e9 setting: a pair of beads (one each side of the row) at every claw spot. */
function paveBeads(spots: Spot[], surface: number) {
  return clawSpots(spots, surface).flatMap(({ a, z, size, r }) =>
    [-1, 1].map((side) =>
      sphereMatrix(radial(a).multiplyScalar((r ?? surface) + size * 0.2).setZ(z + side * size * 0.76), size * 0.24),
    ),
  );
}

/** A unit cylinder standing on its base, for posts and seats. */
const POST = new THREE.CylinderGeometry(1, 1, 1, 18).translate(0, 0.5, 0);

/** An upright metal piece at angle `a`: from radius `from` outwards to `to`, `rx` along the band and `rz` across it. */
function uprightMatrix(a: number, z: number, from: number, to: number, rx: number, rz = rx) {
  const m = new THREE.Matrix4().makeBasis(tangentAt(a), radial(a), new THREE.Vector3(0, 0, 1));
  m.scale(new THREE.Vector3(rx, to - from, rz));
  return m.setPosition(radial(a).multiplyScalar(from).setZ(z));
}

/**
 * A shared-prong setting: each stone raised on its own seat, with a metal post
 * rising between neighbours on each side of the row and ending in a rounded
 * claw over both stones' edges. From the side the shoulder reads as a
 * scalloped row of posts and stones.
 */
function sharedProngs(spots: Spot[], surface: number) {
  const lift = (s: Spot) => s.size * 0.55;
  const raised = spots.map((s) => ({ ...s, r: surface + lift(s) }));
  const seats = spots.map((s) => uprightMatrix(s.a, s.z, surface - 0.01, surface + lift(s) - s.size * 0.3, s.size * 0.72, s.size * 0.8));
  const posts: THREE.Matrix4[] = [];
  const claws: THREE.Matrix4[] = [];
  for (const c of clawSpots(raised, surface)) {
    const top = (c.r ?? surface) + c.size * 0.16;
    for (const side of [-1, 1]) {
      const z = c.z + side * c.size * 0.7;
      posts.push(uprightMatrix(c.a, z, surface - 0.01, top, c.size * 0.3, c.size * 0.22));
      claws.push(new THREE.Matrix4().compose(
        radial(c.a).multiplyScalar(top).setZ(z),
        new THREE.Quaternion(),
        new THREE.Vector3(c.size * 0.32, c.size * 0.24, c.size * 0.26),
      ));
    }
  }
  return { stones: raised, metal: [{ geometry: POST, matrices: [...seats, ...posts] }], claws };
}

/** French pavé: each stone sits in a V notch, held by a bead at each of its four corners. */
function frenchBeads(spots: Spot[], surface: number) {
  return spots.flatMap((s) => {
    const r = (s.r ?? surface) + s.size * 0.12;
    return [-1, 1].flatMap((da) =>
      [-1, 1].map((dz) =>
        sphereMatrix(radial(s.a + (da * s.size * 0.95) / r).multiplyScalar(r).setZ(s.z + dz * s.size * 0.8), s.size * 0.26),
      ),
    );
  });
}

const ROUND_PRONGS: [number, number][] = [
  [0.7, 0.7],
  [-0.7, 0.7],
  [0.7, -0.7],
  [-0.7, -0.7],
];

/** Claws at points given in each stone's own units (x along the band, z across). */
function prongs(stones: THREE.Matrix4[], at: [number, number][], radius: number, y = 0.12) {
  return stones.flatMap((m) => at.map(([x, z]) => sphereMatrix(new THREE.Vector3(x, y, z).applyMatrix4(m), radius)));
}

/** Low metal rails either side of a row, as in a channel setting. */
const rails = (z: number) =>
  [-1, 1].map((side) => ({ geometry: new THREE.TorusGeometry(S - 0.012, 0.02, 12, 240).translate(0, 0, side * z) }));

/**
 * The two arms of a split shank: flat-topped like the plain band, joined into
 * one band under the finger and parting as they rise, so each tucks under the
 * head's seat (it spans about 0.19 either side). `rise` lifts them into the
 * head like a cathedral; `top` is each arm's outer surface at angle `phi`.
 */
function splitArms(spread: number, rise: number, halfWidth = 0.05) {
  const part = (phi: number) => Math.exp(-((phi / 0.85) ** 2));
  const height = T * 0.9;
  const arms = [-1, 1].map((side) => {
    // A small constant offset keeps the arms overlapping (not coincident) where they meet.
    const zAt = (phi: number) => side * (0.032 + spread * part(phi));
    const geometry = shapedBand({
      width: () => halfWidth,
      height: () => height,
      lift: (phi) => rise * part(phi),
      shift: zAt,
      square: 0.6,
    });
    return { geometry, zAt };
  });
  return { arms, top: (phi: number) => R + rise * part(phi) + height };
}

/** Pavé down one split arm: the stones follow the arm as it parts and rises. */
function armPave(arm: { zAt: (phi: number) => number }, top: (phi: number) => number, size: number) {
  return shoulders(0.3, 1.3, () => (size * 2.3) / S).map(({ a, phi }) => ({
    a,
    z: arm.zAt(phi),
    size,
    r: top(phi) - 0.004,
  }));
}

class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private amplitude: number, private waves: number, private phase: number) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2;
    const w = this.waves * a + this.phase;
    const r = R + this.amplitude * Math.cos(w);
    return target.set(r * Math.cos(a), r * Math.sin(a), this.amplitude * Math.sin(w));
  }
}

/** A wire that snakes from side to side across the band. */
class WaveCurve extends THREE.Curve<THREE.Vector3> {
  constructor(private amplitude: number, private waves: number, private phase: number) {
    super();
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const a = t * Math.PI * 2;
    return target.set(R * Math.cos(a), R * Math.sin(a), this.amplitude * Math.sin(this.waves * a + this.phase));
  }
}

const tube = (curve: THREE.Curve<THREE.Vector3>, radius: number, segments = 900) =>
  new THREE.TubeGeometry(curve, segments, radius, 12, true);

/**
 * A band whose cross-section changes around the ring: `width` and `height` are
 * half extents across the finger and outwards, `lift` pushes it out from the
 * finger, `shift` moves it across the finger (one arm of a split shank),
 * `twist` turns the section (a ribbon) and `square` below 1 flattens the oval
 * profile towards a rectangle.
 */
function shapedBand({
  width,
  height = () => T,
  lift = () => 0,
  shift = () => 0,
  twist = () => 0,
  square = 1,
}: {
  width: (phi: number) => number;
  height?: (phi: number) => number;
  lift?: (phi: number) => number;
  shift?: (phi: number) => number;
  twist?: (a: number) => number;
  square?: number;
}) {
  const SEGMENTS = 260;
  const SIDES = 32;
  const positions: number[] = [];
  const index: number[] = [];
  const curve = (x: number) => Math.sign(x) * Math.abs(x) ** square;
  for (let i = 0; i <= SEGMENTS; i++) {
    const a = (i / SEGMENTS) * Math.PI * 2;
    const phi = fromTop(a);
    const n = radial(a);
    const [hw, hh, centre, dz, tw] = [width(phi), height(phi), R + lift(phi), shift(phi), twist(a)];
    for (let j = 0; j <= SIDES; j++) {
      const th = (j / SIDES) * Math.PI * 2;
      const u = curve(Math.cos(th)) * hh;
      const v = curve(Math.sin(th)) * hw;
      const out = centre + u * Math.cos(tw) - v * Math.sin(tw);
      positions.push(n.x * out, n.y * out, dz + u * Math.sin(tw) + v * Math.cos(tw));
    }
  }
  for (let i = 0; i < SEGMENTS; i++) {
    for (let j = 0; j < SIDES; j++) {
      const p = i * (SIDES + 1) + j;
      const q = p + SIDES + 1;
      index.push(p, q, p + 1, p + 1, q, q + 1);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  // Weld the seams so the polished surface shades without a line.
  const welded = mergeVertices(geometry, 1e-5);
  welded.computeVertexNormals();
  return welded;
}

type Layout = {
  bands: { geometry: THREE.BufferGeometry; scaleZ?: number }[];
  gems: { geometry: THREE.BufferGeometry; matrices: THREE.Matrix4[] }[];
  beads: THREE.Matrix4[];
  /** Other metal pieces in bulk: bezel cups, frames, plates. */
  metal?: { geometry: THREE.BufferGeometry; matrices: THREE.Matrix4[] }[];
};

const torus = (tube = T, radial = 32) => new THREE.TorusGeometry(R, tube, radial, 240);

/**
 * The everyday band: a flat top with softly rounded edges (a D-shaped section)
 * rather than a round wire, `scale` times as wide as it is deep, narrowing a
 * little towards the palm as a hand-finished shank does.
 */
const flatBand = (scale: number) =>
  shapedBand({ width: (phi) => T * scale * (1 - 0.16 * (phi / Math.PI) ** 1.5), square: 0.6 });

function faceted(geometry: THREE.BufferGeometry) {
  const flat = geometry.toNonIndexed();
  flat.computeVertexNormals();
  return flat;
}

function marquiseVine(): Layout {
  const VINE_R = 1.07;
  const AMP = 0.16;
  const WAVES = 5;
  const LEAF = 0.17;
  const vines = [0, Math.PI].map((phase) => new VineCurve(VINE_R, AMP, WAVES, phase));
  const onUpperArc = (a: number) => {
    const fromTop = Math.abs(Math.atan2(Math.cos(a), Math.sin(a)));
    return Math.sin(a) > -0.45 && fromTop > 0.32;
  };

  const leaves: THREE.Matrix4[] = [];
  const settings: THREE.Matrix4[] = [];
  const beads: THREE.Matrix4[] = [];
  const melee: THREE.Matrix4[] = [];
  const p = new THREE.Vector3();
  const tangent = new THREE.Vector3();

  vines.forEach((vine, vi) => {
    const phase = vi * Math.PI;
    // Leaves sit where the vine swings furthest out.
    for (let n = 0; n < WAVES * 2; n++) {
      const angle = (Math.PI / 2 - phase + n * Math.PI) / WAVES;
      if (!onUpperArc(angle)) continue;
      const t = (((angle / (Math.PI * 2)) % 1) + 1) % 1;
      vine.getPoint(t, p);
      vine.getTangent(t, tangent);
      const normal = new THREE.Vector3(p.x, p.y, 0).normalize();
      normal.z += Math.sign(p.z) * 0.55;
      normal.normalize();
      const spin = (n % 2 ? 1 : -1) * 0.5;
      const pos = p.clone().add(normal.clone().multiplyScalar(0.035));
      // Marquise unit stone is 4 long and 2 wide, so halve the leaf size.
      const leaf = surfaceMatrix(pos, normal, tangent, spin, LEAF / 2);
      leaves.push(leaf);
      settings.push(surfaceMatrix(pos.clone().sub(normal.clone().multiplyScalar(0.04)), normal, tangent, spin, 1));
      for (const side of [-1, 1]) {
        beads.push(sphereMatrix(new THREE.Vector3(side * 2.05, 0.02, 0).applyMatrix4(leaf), 0.018));
      }
    }
  });

  // Round stones where the two vines cross.
  for (let n = 0; n < WAVES * 2; n++) {
    const angle = (n * Math.PI) / WAVES;
    if (!onUpperArc(angle)) continue;
    const t = angle / (Math.PI * 2);
    vines[0].getPoint(t, p);
    vines[0].getTangent(t, tangent);
    const normal = new THREE.Vector3(p.x, p.y, 0).normalize();
    melee.push(surfaceMatrix(p.clone().add(normal.clone().multiplyScalar(0.05)), normal, tangent, 0, 0.065));
  }

  const setting = new THREE.SphereGeometry(1, 20, 12).scale(LEAF * 1.15, 0.03, LEAF * 0.5);
  return {
    bands: [
      { geometry: flatBand(1.7) },
      ...vines.map((v) => ({ geometry: new THREE.TubeGeometry(v, 500, 0.034, 12, true) })),
      ...settings.map((m) => ({ geometry: setting.clone().applyMatrix4(m) })),
    ],
    gems: [
      { geometry: STONES.marquise, matrices: leaves },
      { geometry: STONES.round, matrices: melee },
    ],
    beads,
  };
}

function buildShank(style: ShankStyle, eternity: boolean): Layout {
  const surface = S;
  const arcOrCircle = (from: number, to: number, step: number) =>
    eternity ? fullCircle(step) : shoulders(from, to, () => step);
  const map = THREE.MathUtils.mapLinear;

  switch (style) {
    case "solitaire":
      // A wider, comfort-fit style band.
      return { bands: [{ geometry: flatBand(1.9) }], gems: [], beads: [] };

    case "knifeEdge":
      // Four radial segments turn the tube's cross-section into a diamond with a sharp outer ridge.
      return { bands: [{ geometry: faceted(torus(0.088, 4)), scaleZ: 1.25 }], gems: [], beads: [] };

    case "traditional12":
      // A flat-topped court band with crisp edges.
      return {
        bands: [{ geometry: shapedBand({ width: () => 0.1, height: () => 0.06, square: 0.35 }) }],
        gems: [],
        beads: [],
      };

    case "pave": {
      const m = 0.085;
      const spots = arcOrCircle(0.34, 1.75, (m * 2.2) / surface).map(({ a }) => ({ a, z: 0, size: m }));
      return {
        bands: [{ geometry: flatBand(1.55) }],
        gems: [{ geometry: STONES.round, matrices: spots.map((s) => spotMatrix(s, surface - 0.004)) }],
        beads: paveBeads(spots, surface),
      };
    }

    case "graduated": {
      const size = (phi: number) => map(Math.min(phi, 1.55), 0.38, 1.55, 0.122, 0.075);
      // Large rounds stepping down the shoulders, raised in a shared-prong setting.
      const spots = shoulders(0.38, 1.55, (phi) => (size(phi) * 2.3) / surface).map(({ a, phi }) => ({
        a,
        z: 0,
        size: size(phi),
      }));
      const { stones, metal, claws } = sharedProngs(spots, surface);
      return {
        bands: [{ geometry: flatBand(1.9) }],
        gems: [gemsOf(STONES.round, stones, surface)],
        beads: claws,
        metal,
      };
    }

    case "pave1": {
      // Three rows of tiny stones, beads between the rows.
      const m = 0.042;
      const spots = row(0.32, 1.6, m, 2.25).flatMap((s) => [-0.088, 0, 0.088].map((z) => ({ ...s, z })));
      return {
        bands: [{ geometry: flatBand(2.5) }],
        gems: [gemsOf(STONES.round, spots, S - 0.006)],
        beads: paveBeads(spots, S),
      };
    }

    case "taperedPave": {
      const width = (phi: number) => map(Math.min(phi, 1.7), 0, 1.7, 0.135, 0.075);
      const spots = row(0.34, 1.5, (phi) => map(Math.min(phi, 1.5), 0.34, 1.5, 0.095, 0.055), 2.15);
      return {
        bands: [{ geometry: shapedBand({ width }) }],
        gems: [gemsOf(STONES.round, spots, S - 0.006)],
        beads: paveBeads(spots, S),
      };
    }

    case "miniTaperedPave": {
      const width = (phi: number) => map(Math.min(phi, 1.5), 0, 1.5, 0.095, 0.06);
      const top = R + 0.06;
      const spots = row(0.3, 1.1, (phi) => map(Math.min(phi, 1.1), 0.3, 1.1, 0.07, 0.045), 2.15);
      return {
        bands: [{ geometry: shapedBand({ width, height: () => 0.06 }) }],
        gems: [gemsOf(STONES.round, spots, top - 0.004)],
        beads: paveBeads(spots, top),
      };
    }

    case "frenchPave1":
    case "frenchPave2":
    case "frenchPave3": {
      const spots = {
        frenchPave1: () => row(0.34, 1.45, 0.085, 2.1),
        frenchPave2: () => row(0.33, 2.2, 0.07, 2.1),
        frenchPave3: () => row(0.34, 1.5, (phi) => map(Math.min(phi, 1.5), 0.34, 1.5, 0.095, 0.06), 2.1),
      }[style]();
      return {
        bands: [{ geometry: flatBand(style === "frenchPave2" ? 1.45 : 1.6) }],
        gems: [gemsOf(STONES.round, spots, S - 0.004)],
        beads: frenchBeads(spots, S),
      };
    }

    case "frenchPave4": {
      // French pavé along the ridge of a knife-edge band.
      const ridge = R + 0.088;
      const spots = row(0.33, 1.5, 0.068, 2.1);
      return {
        bands: [{ geometry: faceted(torus(0.088, 4)), scaleZ: 1.35 }],
        gems: [gemsOf(STONES.round, spots, ridge - 0.004)],
        beads: frenchBeads(spots, ridge),
      };
    }

    case "diamondArch": {
      // The pavé band swells outwards as it rises to the head.
      const lift = (phi: number) => 0.075 * Math.exp(-((phi / 0.55) ** 2));
      const spots = row(0.34, 1.45, 0.08, 2.2).map((s) => ({ ...s, r: R + lift(fromTop(s.a)) + T - 0.004 }));
      return {
        bands: [{ geometry: shapedBand({ width: () => 0.11, lift, square: 0.6 }) }],
        gems: [gemsOf(STONES.round, spots, S)],
        beads: paveBeads(spots, S),
      };
    }

    case "collar": {
      // The band widens under the head into a collar paved edge to edge.
      const width = (phi: number) => 0.085 + 0.11 * Math.exp(-((phi / 0.45) ** 2));
      const spots: Spot[] = [];
      for (const s of row(0.3, 0.85, 0.045, 2.2)) {
        const count = Math.max(1, Math.floor((2 * (width(fromTop(s.a)) - 0.05)) / 0.1) + 1);
        for (let i = 0; i < count; i++) spots.push({ ...s, z: (i - (count - 1) / 2) * 0.1 });
      }
      return {
        bands: [{ geometry: shapedBand({ width, square: 0.55 }) }],
        gems: [gemsOf(STONES.round, spots, S - 0.006)],
        beads: [],
      };
    }

    case "doubleRow": {
      const m = 0.066;
      const spots = arcOrCircle(0.34, 1.7, (m * 2.2) / surface).flatMap(({ a }) => [
        { a, z: -0.075, size: m },
        { a, z: 0.075, size: m },
      ]);
      return {
        bands: [{ geometry: flatBand(2.5) }],
        gems: [{ geometry: STONES.round, matrices: spots.map((s) => spotMatrix(s, surface - 0.006)) }],
        beads: paveBeads(spots, surface),
      };
    }

    case "doubleRowSide": {
      // Two rows of larger stones on the upper shoulders only.
      const m = 0.066;
      const spots = row(0.34, 0.98, m, 2.2).flatMap((s) => [-0.075, 0.075].map((z) => ({ ...s, z })));
      return {
        bands: [{ geometry: flatBand(2.5) }],
        gems: [gemsOf(STONES.round, spots, S - 0.006)],
        beads: paveBeads(spots, S),
      };
    }

    case "tripleRow": {
      const m = 0.05;
      const spots = row(0.33, 1.6, m, 2.2).flatMap((s) => [-0.105, 0, 0.105].map((z) => ({ ...s, z })));
      return {
        bands: [{ geometry: flatBand(3.2) }],
        gems: [gemsOf(STONES.round, spots, S - 0.006)],
        beads: paveBeads(spots, S),
      };
    }

    case "channel": {
      const m = 0.072;
      // Princess unit stone is 1.8 across, so scale to sit edge to edge.
      const spots = arcOrCircle(0.3, 1.6, (m * 2.05) / surface).map(({ a }) => ({ a, z: 0, size: m / 0.9 }));
      return {
        bands: [
          { geometry: flatBand(2) },
          ...[-1, 1].map((side) => ({
            geometry: new THREE.TorusGeometry(R + T - 0.012, 0.022, 12, 240).translate(0, 0, side * (m + 0.016)),
          })),
        ],
        gems: [{ geometry: STONES.princess, matrices: spots.map((s) => spotMatrix(s, surface - 0.004)) }],
        beads: [],
      };
    }

    case "radiantDemi": {
      // Radiant cuts edge to edge across the top half, between low rails.
      const m = 0.066;
      return {
        bands: [{ geometry: flatBand(2.3) }, ...rails(m * 1.25 + 0.014)],
        gems: [gemsOf(STONES.radiant, row(0.34, 1.95, m, 2.1), S - 0.006)],
        beads: [],
      };
    }

    case "splitPave": {
      // Both arms lined with pavé as they part to cradle the head.
      const { arms, top } = splitArms(0.1, 0.03);
      const spots = arms.flatMap((arm) => armPave(arm, top, 0.044));
      return {
        bands: arms.map(({ geometry }) => ({ geometry })),
        gems: [gemsOf(STONES.round, spots, S)],
        beads: paveBeads(spots, S),
      };
    }

    case "modernSplit": {
      // One arm polished, the other lined with stones.
      const { arms, top } = splitArms(0.11, 0.03);
      const spots = armPave(arms[1], top, 0.044);
      return {
        bands: arms.map(({ geometry }) => ({ geometry })),
        gems: [gemsOf(STONES.round, spots, S)],
        beads: paveBeads(spots, S),
      };
    }

    case "splitCathedral":
      // Polished arms that part and climb high into the head, like a cathedral's arches.
      return { bands: splitArms(0.1, 0.085, 0.046).arms.map(({ geometry }) => ({ geometry })), gems: [], beads: [] };

    case "twist":
      return {
        bands: [0, Math.PI].map((phase) => ({
          geometry: new THREE.TubeGeometry(new HelixCurve(0.04, 22, phase), 1200, 0.046, 12, true),
        })),
        gems: [],
        beads: [],
      };

    case "ropeScarf": {
      // Three strands laid like rope, with a short run of stones over the top.
      const spots = row(0.32, 1.0, 0.05, 2.6);
      return {
        bands: [0, 1, 2].map((k) => ({ geometry: tube(new HelixCurve(0.036, 26, (k * Math.PI * 2) / 3), 0.04, 1400) })),
        gems: [gemsOf(STONES.round, spots, R + 0.074)],
        beads: paveBeads(spots, R + 0.07),
      };
    }

    case "intertwined": {
      // Two strands winding loosely round each other; stones ride one where it passes over the top.
      const strands = [0, Math.PI].map((phase) => new HelixCurve(0.055, 3, phase));
      const p = new THREE.Vector3();
      const stones = shoulders(0.3, 1.5, () => 0.06)
        .filter(({ a }) => Math.cos(3 * a) > 0.2)
        .map(({ a }) => {
          strands[0].getPoint((((a / (Math.PI * 2)) % 1) + 1) % 1, p);
          return surfaceMatrix(p.clone().add(radial(a).multiplyScalar(0.046)), radial(a), tangentAt(a), 0, 0.046);
        });
      return {
        bands: strands.map((c) => ({ geometry: tube(c, 0.05, 900) })),
        gems: [{ geometry: STONES.round, matrices: stones }],
        beads: [],
      };
    }

    case "tripleWave":
      return {
        bands: [0, 1, 2].map((k) => ({ geometry: tube(new WaveCurve(0.058, 9, (k * Math.PI * 2) / 3), 0.036, 1200) })),
        gems: [],
        beads: [],
      };

    case "ribbon":
      // A flat ribbon that turns over three times on its way round.
      return {
        bands: [{ geometry: shapedBand({ width: () => 0.11, height: () => 0.028, twist: (a) => 3 * a }) }],
        gems: [],
        beads: [],
      };

    case "marquiseVine":
      return marquiseVine();

    case "marquiseSide": {
      const length = 0.088;
      const spots = shoulders(0.36, 0.95, () => 0.2).map(({ a }) => ({ a, z: 0, size: length / 2 }));
      const matrices = spots.map((s) => spotMatrix(s, surface + 0.01));
      return {
        bands: [{ geometry: flatBand(1.5) }],
        gems: [{ geometry: STONES.marquise, matrices }],
        beads: matrices.flatMap((m) =>
          [-1, 1].map((side) => sphereMatrix(new THREE.Vector3(side * 2.05, 0.05, 0).applyMatrix4(m), 0.016)),
        ),
      };
    }

    case "floatingMarquise": {
      // Large marquise stones end to end down each shoulder, about as wide as the
      // band. Each sits in a polished collet (a slightly larger marquise of metal
      // just below its girdle) with a round claw at either tip.
      const size = 0.104;
      const spots = [0.5, 0.92, 1.34].flatMap((phi) => pair(phi, { z: 0, size }));
      const girdle = S + 0.05;
      const stones = spots.map((s) => spotMatrix(s, girdle));
      return {
        bands: [{ geometry: flatBand(1.5) }],
        gems: [{ geometry: STONES.marquise, matrices: stones }],
        beads: prongs(stones, [[2.02, 0], [-2.02, 0]], 0.03, 0.12),
        metal: [gemsOf(STONES.marquise, spots.map((s) => ({ ...s, size: size * 1.22 })), girdle - 0.036)],
      };
    }

    case "marquiseHalfEternity": {
      // Marquise stones tip to tip over the top half, a bead where each pair meets.
      const stones = row(0.34, 2.25, 0.045, 4.25).map((s) => spotMatrix(s, S + 0.004));
      return {
        bands: [{ geometry: flatBand(1.5) }],
        gems: [{ geometry: STONES.marquise, matrices: stones }],
        beads: prongs(stones, [[2.1, 0], [-2.1, 0]], 0.013, 0.05),
      };
    }

    case "zhuri": {
      // Small marquise stones set on the slant, alternating direction.
      const spots = row(0.34, 1.5, 0.045, 2.9).map((s, i) => ({
        ...s,
        spin: (Math.floor(i / 2) % 2 ? 0.75 : -0.75) * (i % 2 ? -1 : 1),
      }));
      return {
        bands: [{ geometry: flatBand(1.6) }],
        gems: [gemsOf(STONES.marquise, spots, S - 0.002)],
        beads: [],
      };
    }

    case "flowerPetal": {
      // Pairs of marquise petals opening in a V, a small round stone at the base of each.
      const petals = [0.46, 0.76, 1.06].flatMap((phi) =>
        [-1, 1].flatMap((side) => pair(phi, { z: side * 0.058, size: 0.038, spin: side * 0.75 })),
      );
      const buds = [0.46, 0.76, 1.06].flatMap((phi) => pair(phi - 0.07, { z: 0, size: 0.03 }));
      return {
        bands: [{ geometry: flatBand(1.45) }],
        gems: [gemsOf(STONES.marquise, petals, S + 0.002), gemsOf(STONES.round, buds, S + 0.002)],
        beads: [],
      };
    }

    case "sofia": {
      // Marquise stones laid across the band, taking turns with round ones.
      const [marquise, round] = alternating(0.3, 1.45, [{ size: 0.05, length: 0.1 }, { size: 0.048, length: 0.096 }], 0.012);
      return {
        bands: [{ geometry: flatBand(1.7) }],
        gems: [gemsOf(STONES.marquiseAcross, marquise, S - 0.002), gemsOf(STONES.round, round, S - 0.004)],
        beads: [],
      };
    }

    case "dotDash": {
      // Round stones and baguettes taking turns, like Morse code.
      const [dots, dashes] = alternating(0.32, 1.55, [{ size: 0.055, length: 0.11 }, { size: 0.048, length: 0.136 }], 0.012);
      return {
        bands: [{ geometry: flatBand(1.5) }],
        gems: [gemsOf(STONES.round, dots, S - 0.004), gemsOf(STONES.baguette, dashes, S - 0.006)],
        beads: [],
      };
    }

    case "baguette": {
      // Three stones per shoulder, tapering away from the head.
      const sizes = [0.052, 0.045, 0.038];
      const spots: Spot[] = [];
      let phi = 0.33;
      for (const s of sizes) {
        const half = (s * 1.42) / surface; // emerald unit is 1.42 long
        phi += half;
        spots.push({ a: Math.PI / 2 + phi, z: 0, size: s }, { a: Math.PI / 2 - phi, z: 0, size: s });
        phi += half + 0.012;
      }
      return {
        bands: [{ geometry: flatBand(1.6) }],
        gems: [{ geometry: STONES.baguette, matrices: spots.map((s) => spotMatrix(s, surface - 0.008)) }],
        beads: [],
      };
    }

    case "doubleBaguette": {
      const centre = row(0.34, 1.45, 0.046, 3.05);
      return {
        bands: [{ geometry: flatBand(2.8) }],
        gems: [gemsOf(STONES.baguette, centre.flatMap((s) => [-0.056, 0.056].map((z) => ({ ...s, z }))), S - 0.006)],
        beads: [],
      };
    }

    case "emerald": {
      // Emerald cuts end to end along the shoulders, held at their corners.
      const stones = row(0.38, 1.05, 0.062, 3.05).map((s) => spotMatrix(s, S + 0.006));
      return {
        bands: [{ geometry: flatBand(1.7) }],
        gems: [{ geometry: STONES.baguette, matrices: stones }],
        beads: prongs(stones, [[1.3, 0.9], [-1.3, 0.9], [1.3, -0.9], [-1.3, -0.9]], 0.012, 0.05),
      };
    }

    case "stepEmerald": {
      // Step-cut emeralds set east to west, shrinking down each shoulder.
      const spots: Spot[] = [];
      let phi = 0.33;
      for (const s of [0.072, 0.062, 0.052]) {
        phi += s / S;
        spots.push(...pair(phi, { z: 0, size: s }));
        phi += s / S + 0.014;
      }
      return {
        bands: [{ geometry: flatBand(2) }],
        gems: [gemsOf(STONES.emeraldAcross, spots, S + 0.004)],
        beads: [],
      };
    }

    case "splitProng": {
      // Each stone held by four pairs of fine claws.
      const stones = row(0.36, 1.25, 0.075, 2.45).map((s) => spotMatrix(s, S + 0.008));
      const corners = [45, 135, 225, 315].flatMap((d) =>
        [-14, 14].map((o): [number, number] => {
          const t = ((d + o) * Math.PI) / 180;
          return [1.02 * Math.cos(t), 1.02 * Math.sin(t)];
        }),
      );
      return {
        bands: [{ geometry: flatBand(1.5) }],
        gems: [{ geometry: STONES.round, matrices: stones }],
        beads: prongs(stones, corners, 0.009),
      };
    }

    case "station": {
      // Larger stones set at intervals, with plain metal between.
      const stones = [0.5, 0.92, 1.34].flatMap((phi) => pair(phi, { z: 0, size: 0.055 })).map((s) => spotMatrix(s, S + 0.016));
      return {
        bands: [{ geometry: flatBand(1.35) }],
        gems: [{ geometry: STONES.round, matrices: stones }],
        beads: prongs(stones, ROUND_PRONGS, 0.013),
      };
    }

    case "chloe": {
      // A fine band with small stones in bezel cups at intervals.
      const top = R + 0.05;
      const stones = [0.47, 0.84, 1.22].flatMap((phi) => pair(phi, { z: 0, size: 0.042 })).map((s) => spotMatrix(s, top + 0.022));
      return {
        bands: [{ geometry: torus(0.05), scaleZ: 1.3 }],
        gems: [{ geometry: STONES.round, matrices: stones }],
        beads: [],
        metal: [{ geometry: BEZEL_CUP, matrices: stones }],
      };
    }

    case "bloom": {
      // Little flowers on each shoulder: a centre stone ringed by six petals on a round plate.
      const centres = [0.52, 0.95].flatMap((phi) => pair(phi, { z: 0, size: 0.042 }));
      const petals = centres.flatMap((c) =>
        Array.from({ length: 6 }, (_, k) => {
          const t = (k / 6) * Math.PI * 2;
          return { a: c.a + (0.082 * Math.cos(t)) / S, z: 0.082 * Math.sin(t), size: 0.03 };
        }),
      );
      return {
        bands: [{ geometry: flatBand(1.3) }],
        gems: [gemsOf(STONES.round, centres, S + 0.03), gemsOf(STONES.round, petals, S + 0.026)],
        beads: [],
        metal: [{ geometry: DISC, matrices: centres.map((c) => spotMatrix({ ...c, size: 0.125 }, S + 0.012)) }],
      };
    }

    case "paveBow": {
      // A bow on each shoulder (two pears pointing in to a round knot) above a pavé band.
      const knots = pair(0.48, { z: 0, size: 0.024 });
      const loops = knots.flatMap((k) => [
        { ...k, z: 0.058, spin: 0, size: 0.034 },
        { ...k, z: -0.058, spin: Math.PI, size: 0.034 },
      ]);
      const pave = row(0.66, 1.55, 0.07, 2.2);
      return {
        bands: [{ geometry: flatBand(1.6) }],
        gems: [
          gemsOf(STONES.pearAcross, loops, S + 0.006),
          gemsOf(STONES.round, knots, S + 0.008),
          gemsOf(STONES.round, pave, S - 0.004),
        ],
        beads: paveBeads(pave, S),
      };
    }

    case "trio": {
      // One large round stone each side of the centre: a three-stone ring.
      const stones = pair(0.5, { z: 0, size: 0.13 }).map((s) => spotMatrix(s, S + 0.035));
      return {
        bands: [{ geometry: flatBand(1.6) }],
        gems: [{ geometry: STONES.round, matrices: stones }],
        beads: prongs(stones, ROUND_PRONGS, 0.02),
      };
    }

    case "roundSide": {
      const stones = [...pair(0.44, { z: 0, size: 0.1 }), ...pair(0.62, { z: 0, size: 0.08 })].map((s) =>
        spotMatrix(s, S + 0.025),
      );
      return {
        bands: [{ geometry: flatBand(1.5) }],
        gems: [{ geometry: STONES.round, matrices: stones }],
        beads: prongs(stones, ROUND_PRONGS, 0.016),
      };
    }

    case "pearSide": {
      const stones = pair(0.5, { z: 0, size: 0.075 }, true).map((s) => spotMatrix(s, S + 0.02));
      return {
        bands: [{ geometry: flatBand(1.5) }],
        gems: [{ geometry: STONES.pear, matrices: stones }],
        beads: prongs(stones, [[1.62, 0], [-0.95, 0.72], [-0.95, -0.72]], 0.016),
      };
    }

    case "halfMoonSide": {
      // Half moons with their straight edge facing the centre stone.
      const stones = pair(0.43, { z: 0, size: 0.11 }, true).map((s) => spotMatrix(s, S + 0.02));
      return {
        bands: [{ geometry: flatBand(1.6) }],
        gems: [{ geometry: STONES.halfMoon, matrices: stones }],
        beads: prongs(stones, [[-0.42, 0.95], [-0.42, -0.95], [0.56, 0]], 0.017),
      };
    }

    case "trapezoidSide": {
      // Trapezoids with their wide end against the centre stone.
      const stones = pair(0.44, { z: 0, size: 0.1 }, true).map((s) => spotMatrix(s, S + 0.02));
      return {
        bands: [{ geometry: flatBand(1.6) }],
        gems: [{ geometry: STONES.trapezoid, matrices: stones }],
        beads: prongs(stones, [[-0.75, 1], [-0.75, -1], [0.75, 0.6], [0.75, -0.6]], 0.016, 0.05),
      };
    }

    case "frameTrapezoid": {
      // Trapezoids framed in a border of polished metal.
      const spots = pair(0.45, { z: 0, size: 0.1 }, true);
      return {
        bands: [{ geometry: flatBand(1.6) }],
        gems: [gemsOf(STONES.trapezoid, spots, S + 0.02)],
        beads: [],
        metal: [gemsOf(STONES.trapezoid, spots.map((s) => ({ ...s, size: s.size * 1.2 })), S + 0.002)],
      };
    }
  }
}

type ShankProps = {
  style: ShankStyle;
  metal: string;
  accent: string;
  /** Stones all the way round (wedding bands) instead of on the shoulders only. */
  eternity?: boolean;
  z?: number;
};

export default function Shank({ style, metal, accent, eternity = false, z = 0 }: ShankProps) {
  const layout = useMemo(() => buildShank(style, eternity), [style, eternity]);

  return (
    <group position-z={z}>
      {layout.bands.map(({ geometry, scaleZ = 1 }, i) => (
        <mesh key={i} geometry={geometry} scale={[1, 1, scaleZ]} castShadow>
          <MetalMaterial color={metal} />
        </mesh>
      ))}
      {layout.gems.map(({ geometry, matrices }, i) => (
        <InstancedGems key={i} geometry={geometry} matrices={matrices} color={accent} />
      ))}
      <InstancedMetal geometry={UNIT_SPHERE} matrices={layout.beads} color={metal} />
      {layout.metal?.map(({ geometry, matrices }, i) => (
        <InstancedMetal key={i} geometry={geometry} matrices={matrices} color={metal} />
      ))}
    </group>
  );
}
