import * as THREE from "three";
import { HAIR } from "./heads";

/**
 * Real hair as individual strands: thousands of fine fibres, each running from a
 * root on the scalp over the head and back into the bun, plus coiled strands
 * wound round the bun. Built once from the head's shape, as line segments with,
 * per point: the strand direction, how far along it is (root 0, tip 1), how deep
 * in the hair it lies, and the strand's own shade.
 */

/** Deterministic random numbers, so the hair is the same on every load. */
function random(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The scalp's radius seen from a point inside the head, by direction: a grid
 * over azimuth and polar angle, filled from points sampled across the head's
 * triangles (the ears left out, so strands pass behind them), then gaps filled
 * and smoothed. Lets a strand be laid on the scalp with a quick lookup.
 */
function scalpField(head: THREE.BufferGeometry, onEar: (x: number, y: number, z: number) => number) {
  const W = 192;
  const H = 96;
  const centre = new THREE.Vector3(HAIR.centre[0], HAIR.fieldY, HAIR.centre[1]);
  const rad = new Float32Array(W * H);
  const pos = head.getAttribute("position");
  const index = head.getIndex()!.array;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const p = new THREE.Vector3();
  const bin = (q: THREE.Vector3) => {
    const d = q.clone().sub(centre);
    const r = d.length();
    const theta = Math.atan2(d.x, d.z);
    const phi = Math.acos(THREE.MathUtils.clamp(d.y / r, -1, 1));
    const i = Math.floor(((theta + Math.PI) / (Math.PI * 2)) * W) % W;
    const j = Math.min(H - 1, Math.floor((phi / Math.PI) * H));
    rad[j * W + i] = Math.max(rad[j * W + i], r);
  };
  // Points across each triangle; a fine mesh is dense enough with its corners alone.
  const steps = index.length > 300000 ? 1 : 4;
  for (let t = 0; t < index.length; t += 3) {
    a.fromBufferAttribute(pos, index[t]);
    b.fromBufferAttribute(pos, index[t + 1]);
    c.fromBufferAttribute(pos, index[t + 2]);
    for (let u = 0; u <= steps; u++) {
      for (let v = 0; v <= steps - u; v++) {
        p.copy(a)
          .multiplyScalar(1 - (u + v) / steps)
          .addScaledVector(b, u / steps)
          .addScaledVector(c, v / steps);
        if (onEar(p.x, p.y, p.z) > 0.3) continue;
        bin(p);
      }
    }
  }
  // Fill the gaps (over the ears, and between samples) from their neighbours.
  for (let pass = 0; pass < 80; pass++) {
    let empty = 0;
    const next = rad.slice();
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        if (rad[j * W + i] > 0) continue;
        let sum = 0;
        let n = 0;
        for (const [di, dj] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const jj = j + dj;
          if (jj < 0 || jj >= H) continue;
          const v = rad[jj * W + ((i + di + W) % W)];
          if (v > 0) {
            sum += v;
            n++;
          }
        }
        if (n) next[j * W + i] = sum / n;
        else empty++;
      }
    }
    rad.set(next);
    if (!empty) break;
  }
  // Smooth out the scan's small bumps, as hair lies over them.
  for (let pass = 0; pass < 2; pass++) {
    const next = rad.slice();
    for (let j = 1; j < H - 1; j++) {
      for (let i = 0; i < W; i++) {
        let sum = 0;
        for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) sum += rad[(j + dj) * W + ((i + di + W) % W)];
        next[j * W + i] = sum / 9;
      }
    }
    rad.set(next);
  }

  /** The scalp's radius in direction `d` (from the centre; normalised). */
  const radius = (d: THREE.Vector3) => {
    const theta = Math.atan2(d.x, d.z);
    const phi = Math.acos(THREE.MathUtils.clamp(d.y, -1, 1));
    const x = ((theta + Math.PI) / (Math.PI * 2)) * W - 0.5;
    const y = THREE.MathUtils.clamp((phi / Math.PI) * H - 0.5, 0, H - 1.001);
    const i0 = Math.floor(x);
    const j0 = Math.floor(y);
    const fx = x - i0;
    const fy = y - j0;
    const at = (i: number, j: number) => rad[j * W + ((i + W) % W)];
    return (
      (at(i0, j0) * (1 - fx) + at(i0 + 1, j0) * fx) * (1 - fy) +
      (at(i0, j0 + 1) * (1 - fx) + at(i0 + 1, j0 + 1) * fx) * fy
    );
  };
  return { centre, radius };
}

type Builder = {
  positions: number[];
  tangents: number[];
  normals: number[];
  along: number[];
  depth: number[];
  tone: number[];
  index: number[];
};

function addStrand(out: Builder, points: THREE.Vector3[], normals: THREE.Vector3[], depths: number[], tone: number) {
  if (points.length < 2) return;
  const start = out.positions.length / 3;
  const t = new THREE.Vector3();
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    t.subVectors(points[Math.min(i + 1, points.length - 1)], points[Math.max(i - 1, 0)]).normalize();
    out.positions.push(p.x, p.y, p.z);
    out.tangents.push(t.x, t.y, t.z);
    out.normals.push(normals[i].x, normals[i].y, normals[i].z);
    out.along.push(i / (points.length - 1));
    out.depth.push(depths[i]);
    out.tone.push(tone);
    if (i) out.index.push(start + i - 1, start + i);
  }
}

export function buildHairStrands(
  head: THREE.BufferGeometry,
  aboveHairline: (x: number, y: number, z: number) => number,
  onEar: (x: number, y: number, z: number) => number,
) {
  const rnd = random(20261104);
  const { centre, radius } = scalpField(head, onEar);
  const s = HAIR.strands;
  const bunC = new THREE.Vector3(...HAIR.bun.centre);
  const bunR = new THREE.Vector3(...HAIR.bun.scale).multiplyScalar(HAIR.bun.radius);
  // The bun's frame: across it (e1, e2) and out of the head along its axis.
  const bunAxis = new THREE.Vector3(...HAIR.bun.axis).normalize();
  const bunE1 = new THREE.Vector3(1, 0, 0).addScaledVector(bunAxis, -bunAxis.x).normalize();
  const bunE2 = new THREE.Vector3().crossVectors(bunAxis, bunE1);
  const rel = new THREE.Vector3();
  const insideBun = (p: THREE.Vector3, k = 1) => {
    rel.subVectors(p, bunC);
    return Math.hypot(rel.dot(bunE1) / bunR.x, rel.dot(bunE2) / bunR.y, rel.dot(bunAxis) / bunR.z) < k;
  };
  const out: Builder = { positions: [], tangents: [], normals: [], along: [], depth: [], tone: [], index: [] };
  /** No hair below a little under the lowest point of the hairline (the nape). */
  const lowest = Math.min(...HAIR.hairline.map(([, h]) => h)) - HAIR.feather * 4;

  // Roots: random points on the head's triangles, more likely the further above the hairline.
  const pos = head.getAttribute("position");
  const index = head.getIndex()!.array;
  const tris: number[] = [];
  const areas: number[] = [];
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let total = 0;
  for (let t = 0; t < index.length; t += 3) {
    a.fromBufferAttribute(pos, index[t]);
    b.fromBufferAttribute(pos, index[t + 1]);
    c.fromBufferAttribute(pos, index[t + 2]);
    const m = a.clone().add(b).add(c).divideScalar(3);
    if (aboveHairline(m.x, m.y, m.z) < -HAIR.feather * 2 || onEar(m.x, m.y, m.z) > 0.9) continue;
    const area = b.clone().sub(a).cross(c.clone().sub(a)).length() / 2;
    total += area;
    tris.push(t);
    areas.push(total);
  }

  const p = new THREE.Vector3();
  const d = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const prev = new THREE.Vector3();
  const side = new THREE.Vector3();
  const sweepDir = new THREE.Vector3();
  const sw = new THREE.Vector3();
  let made = 0;

  /**
   * Face-framing locks: on each side, a few loose locks fall from the temple in
   * front of the ear, past the cheek to about the jaw. Each is a ribbon of
   * strands that share one soft wave (opening out towards the end), standing a
   * little off the face, with each strand a touch apart from the others.
   */
  const addCurls = () => {
    const c = s.curls;
    for (const sign of [1, -1]) {
      for (let l = 0; l < c.locks; l++) {
        const around = THREE.MathUtils.lerp(c.around[0], c.around[1], (l + rnd()) / c.locks);
        const flat = new THREE.Vector3(
          HAIR.centre[0] + sign * Math.sin(around) * 1.5,
          0,
          HAIR.centre[1] + Math.cos(around) * 1.5,
        );
        const height = -aboveHairline(flat.x, 0, flat.z) + 0.05;
        const toward = new THREE.Vector3(flat.x, height, flat.z).sub(centre).normalize();
        const root = centre.clone().addScaledVector(toward, radius(toward) + 0.03);
        const outward = new THREE.Vector3(sign, 0, 0.5).normalize();
        const length = c.length * (0.7 + rnd() * 0.5);
        const turns = c.turns * (0.7 + rnd() * 0.6);
        const spin = rnd() * Math.PI * 2;
        const swing = (rnd() - 0.2) * 0.4;
        const ampl = c.radius * (0.7 + rnd() * 0.6);
        const tone = (rnd() - 0.5) * 0.5;
        for (let k = 0; k < c.strands; k++) {
          // Where this strand lies in the lock, and how much it strays from it towards the end.
          const jx = (rnd() - 0.5) * c.width;
          const jz = (rnd() - 0.5) * c.width;
          const stray = rnd() * c.stray;
          const own = 0.75 + rnd() * 0.5;
          const pts: THREE.Vector3[] = [];
          const nrm: THREE.Vector3[] = [];
          const dep: number[] = [];
          const n = 40;
          for (let i = 0; i < n; i++) {
            const f = i / (n - 1);
            const ang = spin + own * 0.6 + f * turns * own * Math.PI * 2;
            const r = ampl * (0.25 + f) * own;
            pts.push(
              root
                .clone()
                .add(new THREE.Vector3(0, -length * own * f, swing * f + Math.sin(ang) * r + jz * (0.4 + f)))
                .addScaledVector(
                  outward,
                  c.standOff * Math.sqrt(f) + Math.cos(ang) * r + jx * (0.4 + f) + stray * f * f,
                ),
            );
            nrm.push(outward.clone());
            dep.push(0.55 + 0.45 * rnd());
          }
          addStrand(out, pts, nrm, dep, tone + c.tone + (rnd() - 0.5) * 0.2);
        }
      }
    }
  };

  for (let attempt = 0; made < s.count && attempt < s.count * 4; attempt++) {
    // A random point on a random triangle, weighted by area.
    const pick = rnd() * total;
    let lo = 0;
    let hi = areas.length - 1;
    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      if (areas[mid] < pick) lo = mid + 1;
      else hi = mid;
    }
    const t = tris[lo];
    a.fromBufferAttribute(pos, index[t]);
    b.fromBufferAttribute(pos, index[t + 1]);
    c.fromBufferAttribute(pos, index[t + 2]);
    let u = rnd();
    let v = rnd();
    if (u + v > 1) [u, v] = [1 - u, 1 - v];
    p.copy(a)
      .multiplyScalar(1 - u - v)
      .addScaledVector(b, u)
      .addScaledVector(c, v);
    // Sparser towards the hairline, none on the ears.
    const density =
      THREE.MathUtils.smoothstep(aboveHairline(p.x, p.y, p.z), -HAIR.feather * 0.2, HAIR.feather * 1.4) *
      (1 - onEar(p.x, p.y, p.z));
    if (rnd() > density) continue;
    if (insideBun(p, 1.05)) continue;
    made++;

    // The strand's lock: strands that start close together move together.
    const lock = Math.floor(p.x * 9) * 7919 + Math.floor(p.y * 9) * 104729 + Math.floor(p.z * 9) * 1299709;
    const lockRnd = random(lock);
    const lockPhase = lockRnd() * Math.PI * 2;
    const lockAmp = s.lockWave * (0.5 + lockRnd());
    const phase = rnd() * Math.PI * 2;
    const flyaway = rnd() < s.flyaways;
    const layer = rnd();
    const tone = (lockRnd() - 0.5) * 0.6 + (rnd() - 0.5) * 0.4;

    const points: THREE.Vector3[] = [];
    const normals: THREE.Vector3[] = [];
    const depths: number[] = [];
    const start = p.distanceTo(bunC);
    prev.set(0, 0, 0);
    // Hair from the forehead and temples is first brushed up and out, away from a parting a little to one
    // side, before it turns back to the bun, as in a soft swept-back style.
    const around = Math.abs(Math.atan2(p.x - HAIR.centre[0], p.z - HAIR.centre[1]));
    const sweep = s.sweep.amount * (1 - THREE.MathUtils.smoothstep(around, s.sweep.around[0], s.sweep.around[1]));
    sweepDir.set(Math.sign(p.x - s.sweep.part) * s.sweep.out, 1, 0);
    for (let step = 0; step < s.maxSteps; step++) {
      d.subVectors(p, centre).normalize();
      const progress = THREE.MathUtils.clamp(1 - p.distanceTo(bunC) / start, 0, 1);
      // Soft volume: a strand rises gradually from its root, so hair from the front, which has
      // furthest to go, ends up lying over the hair from further back, as when it is brushed back.
      // Fullest over the top of the head, sleeker low on the back; and it rises and falls in loose waves.
      const full = THREE.MathUtils.smoothstep(step * s.step, 0, s.rise);
      const crown = 0.3 + 0.7 * THREE.MathUtils.smoothstep(p.y, s.crown[0], s.crown[1]);
      const lift =
        s.lift[0] +
        (s.lift[1] - s.lift[0]) * full * crown * (0.55 + 0.45 * layer) +
        Math.sin(progress * 11 + lockPhase * 1.7) * s.ripple * full +
        (flyaway ? 0.08 * progress : 0);
      const q = centre.clone().addScaledVector(d, radius(d) + lift);
      // Waves across the strand, shared by its lock.
      dir.subVectors(bunC, q);
      dir.addScaledVector(d, -dir.dot(d)).normalize();
      const sweepNow = sweep * (1 - THREE.MathUtils.smoothstep(step * s.step, 0, s.sweep.length));
      if (sweepNow > 0) {
        sw.copy(sweepDir).addScaledVector(d, -sweepDir.dot(d)).normalize();
        dir.addScaledVector(sw, sweepNow).normalize();
      }
      side.crossVectors(d, dir);
      q.addScaledVector(side, Math.sin(progress * 9 + lockPhase) * lockAmp + Math.sin(progress * 26 + phase) * s.wave);
      // Low on the nape the scalp lookup can catch the shoulders; stop rather than jump down to them.
      if (q.y < lowest || (points.length && q.distanceTo(points[points.length - 1]) > s.step * 4)) break;
      points.push(q);
      normals.push(d.clone());
      depths.push(layer * (0.3 + 0.7 * full));
      if (insideBun(q, 0.85)) break;
      // Step towards the bun over the scalp, turning gradually.
      if (prev.lengthSq() > 0) dir.lerp(prev, 0.55).normalize();
      prev.copy(dir);
      p.copy(q).addScaledVector(dir, s.step);
    }
    addStrand(out, points, normals, depths, tone);
  }

  addCurls();

  // The bun: the gathered hair twisted into a rope and wound on itself, from the
  // outer edge at its base up to the middle, its strands spiralling round the rope.
  const k = HAIR.bun.coil;
  const size = HAIR.bun.radius;
  /** The rope's centre-line, and its thickness, at u (0 at the start of the rope, 1 at its tucked-in end). */
  const ropeAt = (u: number, at: THREE.Vector3) => {
    const ang = k.turns * Math.PI * 2 * u;
    const r = THREE.MathUtils.lerp(k.outer, k.inner, u) * size;
    const h = (k.base + k.height * Math.sin((u * Math.PI) / 2)) * size;
    return at
      .copy(bunC)
      .addScaledVector(bunAxis, h)
      .addScaledVector(bunE1, Math.cos(ang) * r * k.stretch)
      .addScaledVector(bunE2, Math.sin(ang) * r);
  };
  const c0 = new THREE.Vector3();
  const c1 = new THREE.Vector3();
  const tan = new THREE.Vector3();
  const across = new THREE.Vector3();
  const over = new THREE.Vector3();
  const outward = new THREE.Vector3();
  for (let n = 0; n < s.bunStrands; n++) {
    const u0 = rnd() * 0.97;
    const span = 0.1 + rnd() * 0.28;
    const theta0 = rnd() * Math.PI * 2;
    // Most strands lie on the outside of the rope; some fill it, so no gaps show.
    const inset = 0.72 + 0.32 * Math.sqrt(rnd());
    const loose = rnd() < s.bunFlyaways ? 0.25 + rnd() * 0.5 : 0;
    const tone = (rnd() - 0.5) * 0.7;
    const points: THREE.Vector3[] = [];
    const normals: THREE.Vector3[] = [];
    const depths: number[] = [];
    const steps = 34;
    for (let i = 0; i < steps; i++) {
      const f = i / (steps - 1);
      const u = Math.min(1, u0 + span * f);
      const centreLine = ropeAt(u, new THREE.Vector3());
      ropeAt(Math.max(0, u - 0.004), c0);
      ropeAt(Math.min(1, u + 0.004), c1);
      tan.subVectors(c1, c0).normalize();
      // Round the rope: out from the bun's axis, and over the rope.
      across.subVectors(centreLine, bunC).addScaledVector(bunAxis, -centreLine.clone().sub(bunC).dot(bunAxis));
      across.addScaledVector(tan, -across.dot(tan)).normalize();
      over.crossVectors(tan, across);
      const theta = theta0 + k.twist * k.turns * Math.PI * 2 * (u - u0);
      const thick = THREE.MathUtils.lerp(k.rope[0], k.rope[1], u) * size;
      outward.copy(across).multiplyScalar(Math.cos(theta)).addScaledVector(over, Math.sin(theta));
      // A loose strand lifts away from the rope in a fine arc.
      const lift = 1 + loose * Math.sin(f * Math.PI) * 1.4;
      const q = centreLine.addScaledVector(outward, thick * inset * lift);
      points.push(q);
      normals.push(outward.clone());
      // In the shade where the rope turns in on itself or against the core.
      const exposed = q.clone().sub(bunC).normalize().dot(outward);
      depths.push(0.3 + 0.7 * THREE.MathUtils.clamp(exposed * 0.5 + 0.5, 0, 1) * inset);
    }
    addStrand(out, points, normals, depths, tone);
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out.positions, 3));
  g.setAttribute("hairTangent", new THREE.Float32BufferAttribute(out.tangents, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(out.normals, 3));
  g.setAttribute("along", new THREE.Float32BufferAttribute(out.along, 1));
  g.setAttribute("depth", new THREE.Float32BufferAttribute(out.depth, 1));
  g.setAttribute("tone", new THREE.Float32BufferAttribute(out.tone, 1));
  g.setIndex(out.index);
  return g;
}

/**
 * Eyebrows of fine single hairs, grown over the brow area of a model (`brow`,
 * the patch of each brow, in the model's own units, facing +Z): pointing up at
 * the inner end, fanning out sideways along the brow and angling down at the
 * tail, the top row combed a little flatter for a soft upper edge, each hair
 * curving gently and lying just off the skin. Thinner towards the tail.
 */
export function buildBrowHairs(
  brow: THREE.BufferGeometry,
  o: {
    count: number;
    length: readonly [number, number];
    /** Angle up from straight out (radians) at points along the brow: [position 0..1, angle]. */
    angles: readonly (readonly [number, number])[];
    /** How thick the brow is (metres) at points along it: [position 0..1, thickness]. */
    thickness: readonly (readonly [number, number])[];
    /** How far along the patch the brow runs (it stops short of the patch's outer end at less than 1). */
    span: number;
    /** How high the brow rises above the patch's lower edge in a soft arch, peaking about two thirds along. */
    arch: number;
    /** How far the hairs lie off the brow patch. */
    lift: number;
  },
  /** The skin's front surface depth at a point (x, y), so the hairs lie on it (the brow patch floats off it). */
  surface?: (x: number, y: number) => number,
) {
  const rnd = random(20261105);
  const out: Builder = { positions: [], tangents: [], normals: [], along: [], depth: [], tone: [], index: [] };
  const pos = brow.getAttribute("position");
  const BINS = 24;
  for (const sign of [1, -1]) {
    // The brow's outline on this side: its span across, and its bottom, top and depth at each point along it.
    let x0 = Infinity;
    let x1 = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) * sign;
      if (x <= 0) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
    }
    const lo = new Array(BINS).fill(Infinity);
    const hi = new Array(BINS).fill(-Infinity);
    const zs = new Array(BINS).fill(0);
    const ns = new Array(BINS).fill(0);
    const binOf = (x: number) => Math.min(BINS - 1, Math.max(0, Math.floor(((x - x0) / (x1 - x0)) * BINS)));
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) * sign;
      if (x <= 0) continue;
      const k = binOf(x);
      lo[k] = Math.min(lo[k], pos.getY(i));
      hi[k] = Math.max(hi[k], pos.getY(i));
      zs[k] += pos.getZ(i);
      ns[k]++;
    }
    for (let k = 0; k < BINS; k++) {
      if (!ns[k]) {
        const j = k > 0 ? k - 1 : k + 1;
        lo[k] = lo[j];
        hi[k] = hi[j];
        zs[k] = zs[j];
        ns[k] = ns[j] || 1;
      }
    }
    const at = (x: number, arr: number[], avg = false) => {
      const f = THREE.MathUtils.clamp(((x - x0) / (x1 - x0)) * BINS - 0.5, 0, BINS - 1.001);
      const k = Math.floor(f);
      const v = (j: number) => (avg ? arr[j] / ns[j] : arr[j]);
      return THREE.MathUtils.lerp(v(k), v(k + 1), f - k);
    };
    const profile = (a: readonly (readonly [number, number])[], t: number) => {
      for (let i = 1; i < a.length; i++) {
        if (t <= a[i][0])
          return THREE.MathUtils.lerp(a[i - 1][1], a[i][1], (t - a[i - 1][0]) / (a[i][0] - a[i - 1][0]));
      }
      return a[a.length - 1][1];
    };
    const angleAt = (t: number) => {
      const a = o.angles;
      for (let i = 1; i < a.length; i++) {
        if (t <= a[i][0])
          return THREE.MathUtils.lerp(a[i - 1][1], a[i][1], (t - a[i - 1][0]) / (a[i][0] - a[i - 1][0]));
      }
      return a[a.length - 1][1];
    };

    let made = 0;
    for (let attempt = 0; made < o.count && attempt < o.count * 20; attempt++) {
      const t = rnd();
      const x = x0 + (x1 - x0) * t * o.span;
      // A slim brow along the patch's lower edge, rising in a soft arch, thinning to the tail; sparse at the ends.
      const bottom = at(x, lo) + o.arch * Math.sin(Math.PI * Math.pow(t, 1.4));
      const height = profile(o.thickness, t);
      const v = rnd();
      if (rnd() > THREE.MathUtils.smoothstep(t, 0, 0.06) * (1 - 0.6 * THREE.MathUtils.smoothstep(t, 0.85, 1))) continue;
      made++;
      const y = bottom + height * v;
      // Up at the head of the brow, out along it, down at the tail; the top row lies flatter.
      const angle = angleAt(t) - 0.45 * Math.max(0, v - 0.6) + (rnd() - 0.5) * 0.35;
      const length = THREE.MathUtils.lerp(o.length[0], o.length[1], rnd()) * (1 - 0.3 * t);
      const bend = -0.35 - rnd() * 0.25;
      const tone = (rnd() - 0.5) * 0.6;
      const points: THREE.Vector3[] = [];
      const normals: THREE.Vector3[] = [];
      const depths: number[] = [];
      const p = new THREE.Vector3(x, y, 0);
      const n = new THREE.Vector3(sign * 0.3, 0.2, 1).normalize();
      const steps = 6;
      for (let i = 0; i < steps; i++) {
        const f = i / (steps - 1);
        if (i) {
          const a = angle + bend * f;
          p.x += Math.cos(a) * (length / (steps - 1));
          p.y += Math.sin(a) * (length / (steps - 1));
        }
        const z = (surface ? surface(p.x * sign, p.y) : at(p.x, zs, true)) + o.lift * (1 + 0.8 * Math.sin(f * Math.PI));
        points.push(new THREE.Vector3(p.x * sign, p.y, z));
        normals.push(n);
        depths.push(0.55 + 0.45 * rnd());
      }
      addStrand(out, points, normals, depths, tone);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out.positions, 3));
  g.setAttribute("hairTangent", new THREE.Float32BufferAttribute(out.tangents, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(out.normals, 3));
  g.setAttribute("along", new THREE.Float32BufferAttribute(out.along, 1));
  g.setAttribute("depth", new THREE.Float32BufferAttribute(out.depth, 1));
  g.setAttribute("tone", new THREE.Float32BufferAttribute(out.tone, 1));
  g.setIndex(out.index);
  return g;
}

/**
 * Eyelashes of single curved hairs along the lid edges. The edge of each lid is found where the skin starts
 * to cover the eyeball (across the span of the model's own lash meshes) and smoothed into a curve; along it, upper lashes grow out of the eye and
 * curl upwards, longer and fanning outwards towards the outer corner; lower lashes are short and fine and
 * point down. Each lash is drawn twice, a hair's breadth apart, so it reads as a lash, not a thread.
 */
export function buildLashes(
  lids: { upper: THREE.BufferGeometry; lower: THREE.BufferGeometry },
  /** The skin's front surface depth at (x, y), for finding where the lids meet the eyeball. */
  surface: (x: number, y: number) => number,
  eye: { centre: readonly [number, number, number]; radius: number },
  o: {
    upper: { count: number; length: readonly [number, number]; curl: number; shift: number };
    lower: { count: number; length: readonly [number, number]; shift: number };
    lift: number;
  },
) {
  const rnd = random(20261106);
  const out: Builder = { positions: [], tangents: [], normals: [], along: [], depth: [], tone: [], index: [] };
  const up = new THREE.Vector3(0, 1, 0);

  /**
   * The lid edge on one side, fitted as smooth curves y(x) and z(x): at points across the span of the
   * model's lash mesh for that lid, going out from the middle of the eye (up for the upper lid, down for the
   * lower), the first place where the skin's front surface reaches the eyeball's: where the lid starts.
   */
  const edge = (geo: THREE.BufferGeometry, sign: number, isUpper: boolean) => {
    const pos = geo.getAttribute("position");
    let x0 = Infinity;
    let x1 = -Infinity;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) * sign;
      if (x <= 0) continue;
      x0 = Math.min(x0, x);
      x1 = Math.max(x1, x);
    }
    const [cx, cy, cz] = eye.centre;
    const BINS = 14;
    const samples: [number, number, number][] = [];
    for (let k = 0; k <= BINS; k++) {
      const x = x0 + ((x1 - x0) * k) / BINS;
      const dx = x - cx;
      for (let d = 0; d < 0.013; d += 0.00012) {
        const y = cy + (isUpper ? d : -d);
        const r2 = eye.radius * eye.radius - dx * dx - (y - cy) * (y - cy);
        const skinZ = surface(x * sign, y);
        const ballZ = r2 > 0 ? cz + Math.sqrt(r2) : -Infinity;
        if (skinZ >= ballZ - 0.00008) {
          samples.push([x, y, Math.max(skinZ, ballZ)]);
          break;
        }
      }
    }
    // Least-squares quadratics through the samples.
    const fit = (k: 1 | 2) => {
      let [s0, s1, s2, s3, s4, t0, t1, t2] = [0, 0, 0, 0, 0, 0, 0, 0];
      for (const p of samples) {
        const x = p[0];
        const v = p[k];
        s0 += 1;
        s1 += x;
        s2 += x * x;
        s3 += x * x * x;
        s4 += x * x * x * x;
        t0 += v;
        t1 += v * x;
        t2 += v * x * x;
      }
      const m = new THREE.Matrix3().set(s0, s1, s2, s1, s2, s3, s2, s3, s4).invert();
      const c = new THREE.Vector3(t0, t1, t2).applyMatrix3(m);
      return (x: number) => c.x + c.y * x + c.z * x * x;
    };
    return { x0, x1, y: fit(1), z: fit(2) };
  };

  for (const sign of [1, -1]) {
    const centre = new THREE.Vector3(eye.centre[0] * sign, eye.centre[1], eye.centre[2]);
    for (const isUpper of [true, false]) {
      const lid = edge(isUpper ? lids.upper : lids.lower, sign, isUpper);
      const conf = isUpper ? o.upper : o.lower;
      for (let n = 0; n < conf.count; n++) {
        const t = (n + 0.5 + (rnd() - 0.5) * 0.8) / conf.count;
        const x = lid.x0 + (lid.x1 - lid.x0) * t;
        // Just onto the lid from where it meets the eye, so the lashes never start inside the eye.
        const root = new THREE.Vector3(x * sign, lid.y(x) + (isUpper ? conf.shift : -conf.shift), lid.z(x));
        const outOfEye = root.clone().sub(centre).normalize();
        root.addScaledVector(outOfEye, o.lift);
        // Longer towards the outer corner, shorter at the very ends.
        const reach = THREE.MathUtils.smoothstep(t, 0.0, isUpper ? 0.75 : 0.6);
        const ends = THREE.MathUtils.smoothstep(t, 0, 0.08) * (1 - 0.45 * THREE.MathUtils.smoothstep(t, 0.88, 1));
        const length =
          THREE.MathUtils.lerp(conf.length[0], conf.length[1], reach) * (0.35 + 0.65 * ends) * (0.85 + rnd() * 0.3);
        const fan = new THREE.Vector3(sign, 0, 0).multiplyScalar((t - 0.35) * (isUpper ? 0.4 : 0.3));
        const curl = isUpper ? o.upper.curl * (0.8 + rnd() * 0.4) : 0;
        // Lower lashes are finer and fairer, so they read faintly.
        const tone = (rnd() - 0.5) * 0.3 + (isUpper ? 0 : 0.9);
        const steps = isUpper ? 8 : 5;
        const pts: THREE.Vector3[] = [];
        const nrm: THREE.Vector3[] = [];
        const dep: number[] = [];
        const p = root.clone();
        for (let i = 0; i < steps; i++) {
          const f = i / (steps - 1);
          if (i) {
            // Out of the eye, then curling up (upper) or angled down (lower), fanning sideways.
            const dir = outOfEye
              .clone()
              .multiplyScalar(isUpper ? 1 - curl * f : 0.45)
              .addScaledVector(up, isUpper ? 0.05 + curl * f : -0.85 - 0.15 * f)
              .add(fan)
              .normalize();
            p.addScaledVector(dir, length / (steps - 1));
          }
          pts.push(p.clone());
          nrm.push(outOfEye);
          dep.push(0.6 + 0.4 * f);
        }
        addStrand(out, pts, nrm, dep, tone);
        if (!isUpper) continue;
        const twin = new THREE.Vector3(0.00007, 0.00007, 0.00005);
        addStrand(
          out,
          pts.map((q) => q.clone().add(twin)),
          nrm,
          dep,
          tone,
        );
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(out.positions, 3));
  g.setAttribute("hairTangent", new THREE.Float32BufferAttribute(out.tangents, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(out.normals, 3));
  g.setAttribute("along", new THREE.Float32BufferAttribute(out.along, 1));
  g.setAttribute("depth", new THREE.Float32BufferAttribute(out.depth, 1));
  g.setAttribute("tone", new THREE.Float32BufferAttribute(out.tone, 1));
  g.setIndex(out.index);
  return g;
}

/** Shading for strands: Kajiya-Kay (diffuse and two highlights round each fibre), darker at the roots and deep in the hair. */
/**
 * `fade`: fine strands are drawn a pixel wide however far away they are, so from a distance many of them
 * merge into a solid dark mass; they fade between these camera distances, down to this share of their opacity.
 */
export function strandMaterial(
  look: {
    color?: string;
    sheen?: string;
    opacity?: number;
    spec?: number;
    fade?: readonly [number, number, number];
  } = {},
) {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      hairColor: { value: new THREE.Color(look.color ?? HAIR.color) },
      sheenColor: { value: new THREE.Color(look.sheen ?? HAIR.sheen) },
      keyDir: { value: new THREE.Vector3(...HAIR.keyLight).normalize() },
      rimDir: { value: new THREE.Vector3(-10, 6, -12).normalize() },
      opacity: { value: look.opacity ?? HAIR.strands.opacity },
      specStrength: { value: look.spec ?? 0.55 },
      fade: { value: new THREE.Vector3(...(look.fade ?? [1e6, 2e6, 1])) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 hairTangent;
      attribute float along;
      attribute float depth;
      attribute float tone;
      varying vec3 vT;
      varying vec3 vN;
      varying vec3 vPos;
      varying float vAlong;
      varying float vDepth;
      varying float vTone;
      void main() {
        vT = normalize(mat3(modelMatrix) * hairTangent);
        vN = normalize(mat3(modelMatrix) * normal);
        vec4 world = modelMatrix * vec4(position, 1.0);
        vPos = world.xyz;
        vAlong = along;
        vDepth = depth;
        vTone = tone;
        gl_Position = projectionMatrix * viewMatrix * world;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 hairColor;
      uniform vec3 sheenColor;
      uniform vec3 keyDir;
      uniform vec3 rimDir;
      uniform float opacity;
      uniform float specStrength;
      uniform vec3 fade;
      varying vec3 vT;
      varying vec3 vN;
      varying vec3 vPos;
      varying float vAlong;
      varying float vDepth;
      varying float vTone;
      float kkSpec(vec3 T, vec3 L, vec3 V, float shift, float power) {
        vec3 H = normalize(L + V);
        float th = dot(normalize(T + shift * cross(T, H)), H);
        return pow(sqrt(max(0.0, 1.0 - th * th)), power);
      }
      void main() {
        vec3 T = normalize(vT);
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vPos);
        float tl = dot(T, keyDir);
        float kk = sqrt(max(0.0, 1.0 - tl * tl));
        // Which way this part of the hair faces the light (wrapped, as light passes into hair).
        float facing = clamp(dot(N, keyDir) * 0.6 + 0.4, 0.0, 1.0);
        float rimFacing = clamp(dot(N, rimDir) * 0.6 + 0.4, 0.0, 1.0);
        // Deeper strands and roots sit in the shade of the hair above them.
        float ao = mix(0.5, 1.0, vDepth) * mix(0.7, 1.0, smoothstep(0.0, 0.3, vAlong));
        vec3 base = hairColor * (1.0 + vTone * 0.7);
        vec3 col = base * (0.18 + 1.1 * kk * facing) * ao;
        col += vec3(1.0, 0.96, 0.92) * kkSpec(T, keyDir, V, -0.06, 120.0) * specStrength * facing * ao;
        col += sheenColor * kkSpec(T, keyDir, V, 0.14, 24.0) * 0.4 * facing * ao;
        col += sheenColor * kkSpec(T, rimDir, V, 0.0, 30.0) * 0.25 * rimFacing;
        // Just softened where it leaves the skin (a long fade reads as spiky tips at the hairline).
        float far = mix(1.0, fade.z, smoothstep(fade.x, fade.y, distance(cameraPosition, vPos)));
        gl_FragColor = vec4(col, opacity * far * smoothstep(0.0, 0.012, vAlong));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
