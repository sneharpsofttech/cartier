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
  for (let t = 0; t < index.length; t += 3) {
    a.fromBufferAttribute(pos, index[t]);
    b.fromBufferAttribute(pos, index[t + 1]);
    c.fromBufferAttribute(pos, index[t + 2]);
    for (let u = 0; u <= 4; u++) {
      for (let v = 0; v <= 4 - u; v++) {
        p.copy(a)
          .multiplyScalar(1 - (u + v) / 4)
          .addScaledVector(b, u / 4)
          .addScaledVector(c, v / 4);
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
  const insideBun = (p: THREE.Vector3, k = 1) =>
    Math.hypot((p.x - bunC.x) / bunR.x, (p.y - bunC.y) / bunR.y, (p.z - bunC.z) / bunR.z) < k;
  const out: Builder = { positions: [], tangents: [], normals: [], along: [], depth: [], tone: [], index: [] };

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
  let made = 0;
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
      THREE.MathUtils.smoothstep(aboveHairline(p.x, p.y, p.z), -HAIR.feather * 0.3, HAIR.feather * 2.5) *
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
    for (let step = 0; step < 60; step++) {
      d.subVectors(p, centre).normalize();
      const progress = THREE.MathUtils.clamp(1 - p.distanceTo(bunC) / start, 0, 1);
      // Hair builds up towards the bun; each strand at its own depth in it.
      const lift =
        s.lift[0] + (s.lift[1] - s.lift[0]) * progress * (0.4 + 0.6 * layer) + (flyaway ? 0.05 * progress : 0);
      const q = centre.clone().addScaledVector(d, radius(d) + lift);
      // A gentle wave across the strand, shared by its lock.
      dir.subVectors(bunC, q);
      dir.addScaledVector(d, -dir.dot(d)).normalize();
      side.crossVectors(d, dir);
      q.addScaledVector(side, Math.sin(progress * 6 + lockPhase) * lockAmp + Math.sin(progress * 17 + phase) * s.wave);
      points.push(q);
      normals.push(d.clone());
      depths.push(layer * (0.3 + 0.7 * progress));
      if (insideBun(q, 0.85)) break;
      // Step towards the bun over the scalp, turning gradually.
      if (prev.lengthSq() > 0) dir.lerp(prev, 0.55).normalize();
      prev.copy(dir);
      p.copy(q).addScaledVector(dir, s.step);
    }
    addStrand(out, points, normals, depths, tone);
  }

  // The bun: strands coiled round it.
  for (let k = 0; k < s.bunStrands; k++) {
    const lat = (rnd() - 0.5) * Math.PI * 0.95;
    const a0 = rnd() * Math.PI * 2;
    const span = Math.PI * (0.8 + rnd() * 1.2);
    const twist = (rnd() - 0.5) * 0.9;
    const out1 = 1.0 + rnd() * 0.06;
    const tone = (rnd() - 0.5) * 0.7;
    const points: THREE.Vector3[] = [];
    const normals: THREE.Vector3[] = [];
    const depths: number[] = [];
    const n = 22;
    for (let i = 0; i < n; i++) {
      const f = i / (n - 1);
      const ang = a0 + span * f;
      const l = lat + twist * Math.sin(f * Math.PI);
      // Round the bun's axis (pointing back, along z).
      points.push(
        new THREE.Vector3(
          bunC.x + Math.cos(ang) * Math.cos(l) * bunR.x * out1,
          bunC.y + Math.sin(ang) * Math.cos(l) * bunR.y * out1,
          bunC.z - Math.sin(l) * bunR.z * out1,
        ),
      );
      normals.push(points[i].clone().sub(bunC).divide(bunR).normalize());
      depths.push(out1 - 1 > 0.03 ? 1 : 0.6);
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

/** Shading for strands: Kajiya-Kay (diffuse and two highlights round each fibre), darker at the roots and deep in the hair. */
export function strandMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      hairColor: { value: new THREE.Color(HAIR.color) },
      sheenColor: { value: new THREE.Color(HAIR.sheen) },
      keyDir: { value: new THREE.Vector3(...HAIR.keyLight).normalize() },
      rimDir: { value: new THREE.Vector3(-10, 6, -12).normalize() },
      opacity: { value: HAIR.strands.opacity },
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
        col += vec3(1.0, 0.96, 0.92) * kkSpec(T, keyDir, V, -0.06, 120.0) * 0.55 * facing * ao;
        col += sheenColor * kkSpec(T, keyDir, V, 0.14, 24.0) * 0.4 * facing * ao;
        col += sheenColor * kkSpec(T, rimDir, V, 0.0, 30.0) * 0.25 * rimFacing;
        // Fine and soft at the root, as hair is where it leaves the skin.
        gl_FragColor = vec4(col, opacity * smoothstep(0.0, 0.05, vAlong));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
