"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, useGLTF, useProgress } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "../Scene";
import { GemEnvironmentProvider, MetalMaterial } from "../materials";
import JewelryPiece, { pendantHangPoint } from "../JewelryPiece";
import { metalColor } from "../ring/config";
import type { Design, Product } from "@/lib/catalog/products";
import { BUST_MODEL } from "./heads";
import Hair from "./Hair";
import { buildBrowHairs, buildLashes, strandMaterial } from "./hairStrands";
import { SKIN_TONES } from "./hands";
import SkinPicker from "./SkinPicker";
import styles from "./HandTryOn.module.css";

/** The viewer's background; the bottom of the bust fades into it. */
const BACKDROP = "#f6f0e8";
/** How long auto-rotation waits after the user lets go. */
const RESUME_DELAY = 2500;
/** How long the opening view holds before the head starts turning. */
const OPENING_HOLD = 5000;
/** Earrings or a necklace: what the camera looks at, and from where. */
type Wear = "ears" | "neck";
/** A point on the bust (in its metres) where it shows in the scene. */
const inScene = (p: readonly [number, number, number]) =>
  new THREE.Vector3(...p).sub(new THREE.Vector3(...BUST_MODEL.origin)).multiplyScalar(BUST_MODEL.scale);
const VIEW = {
  // Close in from the side: the ear, its earring and the line of the jaw.
  ears: { focus: inScene(BUST_MODEL.focus.ears), offset: new THREE.Vector3(7.6, 0.6, 4.6) },
  // From the front and a little to one side, framing the neck and the top of the chest.
  neck: { focus: inScene(BUST_MODEL.focus.neck), offset: new THREE.Vector3(2.1, 0.8, 6.6) },
};
/** Thickness of a necklace chain, in metres. */
const CHAIN_RADIUS = 0.0006;

type Props = {
  product: Pick<Product, "design" | "metal" | "gem">;
  skin: string;
  onSkinChange: (id: string) => void;
  /** Start with the skin-tone panel folded away (small viewers). */
  compact?: boolean;
};

/** A colour's components as shown on screen (THREE.Color stores linear values). */
function srgb(color: string) {
  const c = new THREE.Color(color).getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
  return new THREE.Vector3(c.r, c.g, c.b);
}

type BustParts = { skin: THREE.Mesh; rest: THREE.Mesh[]; lids: { upper?: THREE.Mesh; lower?: THREE.Mesh } };

/**
 * An iris painted in code: a black pupil, warm amber round it darkening to brown, a dark rim at the
 * edge, a ring of lighter flecks, and fine radial fibres and darker crypts (BUST_MODEL.eyeLook.iris).
 */
function irisTexture() {
  const look = BUST_MODEL.eyeLook.iris;
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const g = canvas.getContext("2d")!;
  const c = size / 2;
  const R = size / 2;
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
  const [pupilEdge, amber, brown, deep, rim] = look.colours;
  const grad = g.createRadialGradient(c, c, 0, c, c, R);
  grad.addColorStop(0, "#000");
  grad.addColorStop(look.pupil * 0.98, pupilEdge);
  grad.addColorStop(look.pupil + 0.02, amber);
  grad.addColorStop(0.55, brown);
  grad.addColorStop(0.84, deep);
  grad.addColorStop(0.95, rim);
  grad.addColorStop(1, rim);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  // Radial fibres, lighter and darker, from round the pupil out towards the rim.
  g.lineCap = "round";
  for (let i = 0; i < 900; i++) {
    const a = rnd() * Math.PI * 2;
    const r0 = R * (look.pupil + 0.01 + rnd() * 0.1);
    const r1 = R * (0.55 + rnd() * 0.38);
    const wobble = (rnd() - 0.5) * 0.08;
    const light = rnd() < 0.62;
    g.strokeStyle = light ? look.fibre : look.crypt;
    g.globalAlpha = light ? 0.05 + rnd() * 0.12 : 0.05 + rnd() * 0.1;
    g.lineWidth = 0.6 + rnd() * 1.6;
    g.beginPath();
    g.moveTo(c + Math.cos(a) * r0, c + Math.sin(a) * r0);
    g.quadraticCurveTo(
      c + Math.cos(a + wobble) * (r0 + r1) * 0.5,
      c + Math.sin(a + wobble) * (r0 + r1) * 0.5,
      c + Math.cos(a + wobble * 0.5) * r1,
      c + Math.sin(a + wobble * 0.5) * r1,
    );
    g.stroke();
  }
  // A ring of soft lighter flecks a little out from the pupil (the collarette).
  for (let i = 0; i < 500; i++) {
    const a = rnd() * Math.PI * 2;
    const r = R * (0.42 + (rnd() - 0.5) * 0.08);
    g.globalAlpha = 0.08 + rnd() * 0.12;
    g.fillStyle = look.fibre;
    g.beginPath();
    g.arc(c + Math.cos(a) * r, c + Math.sin(a) * r, 0.8 + rnd() * 1.6, 0, Math.PI * 2);
    g.fill();
  }
  // The pupil, with a soft edge.
  g.globalAlpha = 1;
  const pupil = g.createRadialGradient(c, c, R * look.pupil * 0.85, c, c, R * look.pupil * 1.04);
  pupil.addColorStop(0, "rgba(0,0,0,1)");
  pupil.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = pupil;
  g.beginPath();
  g.arc(c, c, R * look.pupil * 1.04, 0, Math.PI * 2);
  g.fill();
  // A soft catchlight up and to one side, the bright glint that makes an eye look alive.
  const [gx, gy, gr] = look.glint;
  const glint = g.createRadialGradient(c + gx * R, c + gy * R, 0, c + gx * R, c + gy * R, gr * R);
  glint.addColorStop(0, "rgba(255,255,255,0.95)");
  glint.addColorStop(0.45, "rgba(255,255,255,0.6)");
  glint.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = glint;
  g.beginPath();
  g.arc(c + gx * R, c + gy * R, gr * R, 0, Math.PI * 2);
  g.fill();
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

const band = (v: number, [a, b, c, d]: readonly [number, number, number, number]) =>
  THREE.MathUtils.smoothstep(v, a, b) * (1 - THREE.MathUtils.smoothstep(v, c, d));

/**
 * Evens out the shading: each vertex's normal averaged with its neighbours' a few times, so the bust's
 * sharp creases (down the middle of the chin and neck) no longer show as a hard light-and-dark line.
 */
function smoothNormals(geometry: THREE.BufferGeometry, passes: number) {
  const index = geometry.getIndex();
  const nrm = geometry.getAttribute("normal") as THREE.BufferAttribute;
  if (!index) return;
  const idx = index.array;
  let cur = Float32Array.from(nrm.array as ArrayLike<number>);
  for (let p = 0; p < passes; p++) {
    const acc = Float32Array.from(cur);
    for (let t = 0; t < idx.length; t += 3) {
      const a = idx[t] * 3;
      const b = idx[t + 1] * 3;
      const c = idx[t + 2] * 3;
      for (let k = 0; k < 3; k++) {
        const sum = cur[a + k] + cur[b + k] + cur[c + k];
        acc[a + k] += sum;
        acc[b + k] += sum;
        acc[c + k] += sum;
      }
    }
    for (let i = 0; i < acc.length; i += 3) {
      const l = Math.hypot(acc[i], acc[i + 1], acc[i + 2]) || 1;
      acc[i] /= l;
      acc[i + 1] /= l;
      acc[i + 2] /= l;
    }
    cur = acc;
  }
  (nrm.array as Float32Array).set(cur);
  nrm.needsUpdate = true;
}

/**
 * Makes the lower face smooth and even: the folds and dents on the cheeks, jaw, chin and the front of the
 * neck (the lines running down from the mouth) are filled in. Each point there that sits lower than the
 * average of its neighbours is lifted out towards it, many times over; points on a rounded surface (the
 * chin, the cheekbones) already sit above their neighbours and stay put, so the face keeps its shape. The
 * lips, nose and ears are left as they are (BUST_MODEL.face.smooth).
 */
function smoothLowerFace(geometry: THREE.BufferGeometry) {
  const c = BUST_MODEL.face.smooth;
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
  const index = geometry.getIndex();
  if (!index) return;
  const idx = index.array;
  const n = pos.count;
  const p = pos.array as Float32Array;
  // How much each point is smoothed: fading out at the region's edges, and round the mouth and nose.
  const weight = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = Math.abs(p[i * 3]);
    const y = p[i * 3 + 1];
    const z = p[i * 3 + 2];
    const mouth = Math.hypot(x / c.mouth[0], (y - c.mouth[2]) / c.mouth[1]);
    const nose = Math.hypot(x / c.nose[0], (y - c.nose[2]) / c.nose[1]);
    weight[i] =
      band(y, c.band) *
      (1 - THREE.MathUtils.smoothstep(x, c.across[0], c.across[1])) *
      THREE.MathUtils.smoothstep(z, c.minZ[0], c.minZ[1]) *
      THREE.MathUtils.smoothstep(mouth, 1, 1.25) *
      THREE.MathUtils.smoothstep(nose, 1, 1.3);
  }
  // Only the triangles touching the region take part.
  const tris: number[] = [];
  for (let t = 0; t < idx.length; t += 3) {
    if (weight[idx[t]] || weight[idx[t + 1]] || weight[idx[t + 2]]) tris.push(idx[t], idx[t + 1], idx[t + 2]);
  }
  const moving: number[] = [];
  for (let i = 0; i < n; i++) if (weight[i]) moving.push(i);
  const nrm = geometry.getAttribute("normal").array as Float32Array;
  const sum = new Float32Array(n * 3);
  const count = new Float32Array(n);
  const step = () => {
    for (const i of moving) {
      sum[i * 3] = sum[i * 3 + 1] = sum[i * 3 + 2] = 0;
      count[i] = 0;
    }
    for (let t = 0; t < tris.length; t += 3) {
      for (let k = 0; k < 3; k++) {
        const a = tris[t + k];
        const b = tris[t + ((k + 1) % 3)];
        sum[a * 3] += p[b * 3];
        sum[a * 3 + 1] += p[b * 3 + 1];
        sum[a * 3 + 2] += p[b * 3 + 2];
        sum[b * 3] += p[a * 3];
        sum[b * 3 + 1] += p[a * 3 + 1];
        sum[b * 3 + 2] += p[a * 3 + 2];
        count[a]++;
        count[b]++;
      }
    }
    for (const i of moving) {
      if (!count[i]) continue;
      // How far the neighbours' average lies out from this point, along the surface's outward normal.
      let out = 0;
      for (let k = 0; k < 3; k++) out += (sum[i * 3 + k] / count[i] - p[i * 3 + k]) * nrm[i * 3 + k];
      if (out <= 0) continue;
      const w = out * weight[i] * c.lambda;
      for (let k = 0; k < 3; k++) p[i * 3 + k] += nrm[i * 3 + k] * w;
    }
  };
  for (let pass = 0; pass < c.passes; pass++) step();
}

/** Narrows the jaw, chin and nose wings of the bust's skin (once; see BUST_MODEL.face). */
function softenFace(geometry: THREE.BufferGeometry) {
  if (geometry.userData.softened) return;
  const { jaw, nose } = BUST_MODEL.face;
  const pos = geometry.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const wJaw =
      band(y, jaw.band) *
      THREE.MathUtils.smoothstep(z, jaw.frontZ[0], jaw.frontZ[1]) *
      (1 - THREE.MathUtils.smoothstep(Math.abs(x), jaw.clearOfEars[0], jaw.clearOfEars[1]));
    const wNose =
      band(y, nose.band) *
      THREE.MathUtils.smoothstep(z, nose.minZ[0], nose.minZ[1]) *
      (1 - THREE.MathUtils.smoothstep(Math.abs(x), nose.halfWidth[0], nose.halfWidth[1]));
    pos.setX(i, x * (1 - (1 - jaw.width) * wJaw) * (1 - (1 - nose.width) * wNose));
  }
  geometry.computeVertexNormals();
  smoothLowerFace(geometry);
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
  smoothNormals(geometry, 3);
  geometry.computeBoundingSphere();
  geometry.userData.softened = true;
}

/** The bust's meshes, with smooth normals worked out (the file has none for most of them). */
function useBust(): BustParts {
  const { scene } = useGLTF(BUST_MODEL.url);
  return useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    scene.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    for (const m of meshes) {
      if (!m.geometry.attributes.normal) m.geometry.computeVertexNormals();
      const mat = m.material as THREE.MeshStandardMaterial;
      if (m.name === BUST_MODEL.brows.base) {
        // Only a soft shadow of colour under the brow hairs.
        mat.transparent = true;
        mat.opacity = BUST_MODEL.brows.baseOpacity;
        mat.depthWrite = false;
        mat.visible = BUST_MODEL.brows.baseOpacity > 0;
      } else if (BUST_MODEL.fibres.includes(m.name)) {
        // Brow hairs and lashes: tiny loose triangles, lit from both sides and matte, so they read as soft
        // dark hair rather than glinting speckles.
        mat.side = THREE.DoubleSide;
        mat.roughness = 1;
        mat.envMapIntensity = 0.2;
      } else if (BUST_MODEL.eyes.includes(m.name)) {
        if (m.name === "eye_iris" && !m.geometry.userData.forward) {
          m.geometry.translate(0, BUST_MODEL.irisRaise, BUST_MODEL.irisForward);
          m.geometry.userData.forward = true;
        }
        // Moist, but not glassy: a softer reflection of the studio.
        mat.envMapIntensity = 0.25;
        mat.roughness = Math.max(mat.roughness, 0.3);
        if (m.name === "eye_iris") {
          mat.map = irisTexture();
          // Glossy, as under the cornea: it catches a small bright reflection of the studio light.
          mat.roughness = 0.08;
          mat.envMapIntensity = 0.9;
          mat.needsUpdate = true;
        } else {
          mat.color.setRGB(...BUST_MODEL.eyeLook.sclera);
        }
      }
    }
    const skin = meshes.find((m) => m.name === BUST_MODEL.skin) ?? meshes[0];
    softenFace(skin.geometry);
    return {
      skin,
      rest: meshes.filter((m) => m !== skin && !BUST_MODEL.hidden.includes(m.name)),
      // The file's lash meshes: not shown, but they mark where the lid edges are.
      lids: {
        upper: meshes.find((m) => m.name === "eyelash_upper"),
        lower: meshes.find((m) => m.name === "eyelash_lower"),
      },
    };
  }, [scene]);
}

/** The bust's skin in scene units, for laying the hair on it. */
function useSceneSkin() {
  const { skin } = useBust();
  return useMemo(
    () =>
      skin.geometry
        .clone()
        .translate(...(BUST_MODEL.origin.map((v) => -v) as [number, number, number]))
        .scale(BUST_MODEL.scale, BUST_MODEL.scale, BUST_MODEL.scale),
    [skin],
  );
}

function BustHair() {
  return <Hair head={useSceneSkin()} />;
}

/**
 * The skin's front surface over part of the face (bounds: x from, x to, y from, y to), as a depth lookup by
 * (x, y): the most forward skin point in each small cell of a grid, gaps filled from neighbours, read back
 * smoothly. With `raise`, each cell takes the most forward of its neighbours (so hairs laid on it never dip
 * into the skin); without, it keeps the exact edge where the lids meet the eyeball.
 */
function skinSurface(
  skin: THREE.BufferGeometry,
  [x0, x1, y0, y1]: readonly [number, number, number, number],
  CELL: number,
  raise: boolean,
) {
  const W = Math.ceil((x1 - x0) / CELL) + 1;
  const H = Math.ceil((y1 - y0) / CELL) + 1;
  const depth = new Float32Array(W * H).fill(-Infinity);
  const pos = skin.getAttribute("position");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (z < 0.1 || x < x0 || x > x1 || y < y0 || y > y1) continue;
    const k = Math.round((y - y0) / CELL) * W + Math.round((x - x0) / CELL);
    if (z > depth[k]) depth[k] = z;
  }
  // Gaps are filled only for a raised surface: filling would spread the lids a little over the eye opening.
  for (let pass = 0; raise && pass < 6; pass++) {
    const next = depth.slice();
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        if (depth[j * W + i] > -Infinity) continue;
        let sum = 0;
        let n = 0;
        for (const [di, dj] of [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]) {
          const ii = i + di;
          const jj = j + dj;
          if (ii < 0 || jj < 0 || ii >= W || jj >= H) continue;
          const v = depth[jj * W + ii];
          if (v > -Infinity) {
            sum += v;
            n++;
          }
        }
        if (n) next[j * W + i] = sum / n;
      }
    }
    depth.set(next);
  }
  // Each cell takes the most forward of its neighbours, so a hair never dips below the skin between points.
  const raised = depth.slice();
  if (!raise) return lookup(depth, W, H, x0, y0, CELL);
  for (let j = 0; j < H; j++) {
    for (let i = 0; i < W; i++) {
      let m = depth[j * W + i];
      for (let dj = -1; dj <= 1; dj++) {
        for (let di = -1; di <= 1; di++) {
          const ii = i + di;
          const jj = j + dj;
          if (ii >= 0 && jj >= 0 && ii < W && jj < H) m = Math.max(m, depth[jj * W + ii]);
        }
      }
      raised[j * W + i] = m;
    }
  }
  depth.set(raised);
  return lookup(depth, W, H, x0, y0, CELL);
}

/** Smooth (bilinear) reading of a depth grid at (x, y). */
function lookup(depth: Float32Array, W: number, H: number, x0: number, y0: number, CELL: number) {
  return (x: number, y: number) => {
    const fx = THREE.MathUtils.clamp((x - x0) / CELL, 0, W - 1.001);
    const fy = THREE.MathUtils.clamp((y - y0) / CELL, 0, H - 1.001);
    const i = Math.floor(fx);
    const j = Math.floor(fy);
    const at = (a: number, b: number) => depth[b * W + a];
    const top = THREE.MathUtils.lerp(at(i, j), at(i + 1, j), fx - i);
    const bottom = THREE.MathUtils.lerp(at(i, j + 1), at(i + 1, j + 1), fx - i);
    return THREE.MathUtils.lerp(top, bottom, fy - j);
  };
}

/** Dark, curled eyelashes along the lid edges (in the bust's metres). */
function BustLashes() {
  const { lids, skin } = useBust();
  const { geometry, material } = useMemo(() => {
    const l = BUST_MODEL.lashes;
    return {
      geometry:
        lids.upper && lids.lower
          ? buildLashes(
              { upper: lids.upper.geometry, lower: lids.lower.geometry },
              skinSurface(skin.geometry, [-0.07, 0.07, 0.262, 0.302], 0.00045, false),
              BUST_MODEL.eyeLook,
              l,
            )
          : null,
      material: strandMaterial({ color: l.color, sheen: l.sheen, opacity: l.opacity, spec: l.spec, fade: l.fade }),
    };
  }, [lids, skin]);
  if (!geometry) return null;
  return <lineSegments geometry={geometry} material={material} renderOrder={3} frustumCulled={false} />;
}

/** Fine single brow hairs over the bust's brow patches (in the bust's metres). */
function BustBrows() {
  const { skin, rest } = useBust();
  const base = rest.find((m) => m.name === BUST_MODEL.brows.base);
  const { geometry, material } = useMemo(() => {
    const b = BUST_MODEL.brows;
    return {
      geometry: base
        ? buildBrowHairs(base.geometry, b, skinSurface(skin.geometry, [-0.075, 0.075, 0.27, 0.325], 0.0007, true))
        : null,
      material: strandMaterial({ color: b.color, sheen: b.sheen, opacity: b.opacity, spec: b.spec }),
    };
  }, [base, skin]);
  if (!geometry) return null;
  return <lineSegments geometry={geometry} material={material} renderOrder={3} frustumCulled={false} />;
}

function Bust({ skin, fade, onReady }: { skin: string; fade: readonly [number, number]; onReady: () => void }) {
  const parts = useBust();
  // The skin in the chosen tone; the eyes, brows, lashes and hair keep the file's own materials.
  const material = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      roughness: 0.5,
      sheen: 0.3,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#ffb39b"),
      envMapIntensity: 0.3,
    });
    // Colour on the lips and cheeks, and the cut-off bottom of the bust faded into the backdrop.
    const { lips, cheeks } = BUST_MODEL.face;
    m.onBeforeCompile = (shader) => {
      shader.uniforms.backdrop = { value: srgb(BACKDROP) };
      shader.uniforms.fadeStart = { value: fade[0] };
      shader.uniforms.fadeEnd = { value: fade[1] };
      shader.uniforms.lipShape = { value: new THREE.Vector4(...lips.centre, ...lips.radii) };
      shader.uniforms.lipZ = { value: new THREE.Vector2(...lips.minZ) };
      shader.uniforms.lipTint = { value: new THREE.Vector4(...lips.tint, lips.amount) };
      shader.uniforms.cheekShape = { value: new THREE.Vector4(...cheeks.centre, ...cheeks.radii) };
      shader.uniforms.cheekZ = { value: new THREE.Vector2(...cheeks.minZ) };
      shader.uniforms.cheekTint = { value: new THREE.Vector4(...cheeks.tint, cheeks.amount) };
      const eye = BUST_MODEL.eyeLook;
      shader.uniforms.eyeCentre = { value: new THREE.Vector4(...eye.centre, eye.radius) };
      shader.uniforms.lashLine = { value: new THREE.Vector2(eye.lashLine.upper, eye.lashLine.lower) };
      shader.uniforms.waterline = { value: new THREE.Vector4(...eye.waterline.tint, eye.waterline.amount) };
      shader.uniforms.crease = {
        value: new THREE.Vector4(...eye.crease.radii, eye.crease.raise, eye.crease.amount),
      };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vModelPos;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvModelPos = position;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
varying vec3 vModelPos;
uniform vec3 backdrop;
uniform float fadeStart;
uniform float fadeEnd;
uniform vec4 lipShape;
uniform vec2 lipZ;
uniform vec4 lipTint;
uniform vec4 cheekShape;
uniform vec2 cheekZ;
uniform vec4 cheekTint;
uniform vec4 eyeCentre;
uniform vec2 lashLine;
uniform vec4 waterline;
uniform vec4 crease;`,
        )
        .replace(
          "#include <color_fragment>",
          `#include <color_fragment>
float lipR = length(vec2((vModelPos.x - lipShape.x) / lipShape.z, (vModelPos.y - lipShape.y) / lipShape.w));
float lipW = (1.0 - smoothstep(0.7, 1.05, lipR)) * smoothstep(lipZ.x, lipZ.y, vModelPos.z) * lipTint.w;
float cheekR = length(vec2((abs(vModelPos.x) - cheekShape.x) / cheekShape.z, (vModelPos.y - cheekShape.y) / cheekShape.w));
float cheekW = (1.0 - smoothstep(0.2, 1.0, cheekR)) * smoothstep(cheekZ.x, cheekZ.y, vModelPos.z) * cheekTint.w;
diffuseColor.rgb *= mix(vec3(1.0), cheekTint.rgb, cheekW);
diffuseColor.rgb *= mix(vec3(1.0), lipTint.rgb, lipW);
// Round each eye: a dark lash line where the lids meet the eyeball, and a soft crease in the upper lid.
vec3 eyeC = vec3(sign(vModelPos.x) * eyeCentre.x, eyeCentre.y, eyeCentre.z);
vec3 toEye = vModelPos - eyeC;
float eyeD = length(toEye);
float upper = smoothstep(-0.003, 0.002, toEye.y);
float front = smoothstep(0.002, 0.006, toEye.z);
float lash = (1.0 - smoothstep(eyeCentre.w + 0.0006, eyeCentre.w + 0.0045, eyeD)) * front;
lash *= mix(lashLine.y, lashLine.x, upper);
diffuseColor.rgb *= mix(vec3(1.0), vec3(0.32, 0.25, 0.23), lash);
// A soft rosy edge along the lower lid.
float rimLow = (1.0 - smoothstep(eyeCentre.w + 0.0004, eyeCentre.w + 0.0035, eyeD)) * front * (1.0 - upper);
diffuseColor.rgb *= mix(vec3(1.0), waterline.rgb, rimLow * waterline.w);
float creaseE = length(vec2(toEye.x / crease.x, (toEye.y - crease.z) / crease.y));
float creaseW = (1.0 - smoothstep(0.0, 0.09, abs(creaseE - 1.0))) * smoothstep(0.003, 0.0065, toEye.y) * front;
diffuseColor.rgb *= mix(vec3(1.0), vec3(0.8, 0.72, 0.7), creaseW * crease.w);
// A soft warm shadow over the upper lid, inside the crease.
float lidW = (1.0 - smoothstep(0.75, 1.0, creaseE)) * smoothstep(0.0015, 0.004, toEye.y) * front;
diffuseColor.rgb *= mix(vec3(1.0), vec3(0.96, 0.9, 0.88), lidW);`,
        )
        .replace(
          "#include <dithering_fragment>",
          "#include <dithering_fragment>\ngl_FragColor.rgb = mix(backdrop, gl_FragColor.rgb, smoothstep(fadeEnd, fadeStart, vModelPos.y));",
        );
    };
    return m;
  }, [fade]);

  useEffect(() => {
    material.color.set(skin);
  }, [material, skin]);

  // Say once the bust has been drawn (preparing its shader takes a moment).
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 2) onReady();
  });

  return (
    <>
      {/* Not shadowing itself: on this smooth bust that draws hard-edged bands across the face. */}
      {/* Nor shadowed by the hair: its shadow falls as hard-edged patches across the cheeks. */}
      <mesh geometry={parts.skin.geometry} material={material} />
      {parts.rest.map((m) => (
        // No shadows from these: the hair cap would throw a hard band across the face and neck.
        <mesh
          key={m.uuid}
          name={m.name}

          geometry={m.geometry}
          material={m.material}
        />
      ))}
    </>
  );
}

/** Turns a stud (out along +Y, length along +Z) to sit on each earlobe, hanging straight down. */
const LOBES = BUST_MODEL.lobes.map(({ position, out }) => {
  const up = new THREE.Vector3(...out).normalize();
  const down = new THREE.Vector3(0, -1, 0);
  down.sub(up.clone().multiplyScalar(down.dot(up))).normalize();
  const side = new THREE.Vector3().crossVectors(up, down);
  return {
    position,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, down)),
  };
});

/**
 * A pendant on its chain. The chain is draped on the scan: rays cast in towards
 * the neck from all round, along a loop that sits high at the back and low at
 * the front, find the skin, and the chain runs just outside it. The pendant
 * hangs from the front of the chain, lying against the chest.
 */
function Necklace({ product }: { product: Props["product"] }) {
  const geometry = useBust().skin.geometry;
  const design = product.design as Extract<Design, { kind: "pendant" }>;
  const metal = metalColor(product.metal);
  const { tube, hang, quaternion } = useMemo(() => {
    const mesh = new THREE.Mesh(geometry);
    const { back, front, axisZ } = BUST_MODEL.chain;
    const ray = new THREE.Raycaster();
    const points: THREE.Vector3[] = [];
    const normals: THREE.Vector3[] = [];
    const steps = 120;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const y = back + ((front - back) * (1 + Math.cos(a))) / 2;
      const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      ray.set(new THREE.Vector3(0, y, axisZ).addScaledVector(dir, 0.5), dir.clone().negate());
      const hit = ray.intersectObject(mesh, false)[0];
      if (!hit?.face) continue;
      const n = hit.face.normal.clone();
      points.push(hit.point.clone().addScaledVector(n, CHAIN_RADIUS * 2));
      normals.push(n);
    }
    // Even out the scan's small bumps, as a chain would lie over them.
    for (let pass = 0; pass < 2; pass++) {
      const prev = points.map((p) => p.clone());
      prev.forEach((p, i) => {
        const a = prev[(i + prev.length - 1) % prev.length];
        const b = prev[(i + 1) % prev.length];
        points[i].copy(p).multiplyScalar(0.5).addScaledVector(a, 0.25).addScaledVector(b, 0.25);
      });
    }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 480, CHAIN_RADIUS, 8, true);
    // The pendant faces out of the chest at the front of the chain, upright along it.
    const out = normals[0].clone();
    const up = new THREE.Vector3(0, 1, 0).addScaledVector(out, -out.y).normalize();
    const side = new THREE.Vector3().crossVectors(up, out);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, out));
    return { tube, hang: points[0], quaternion };
  }, [geometry]);
  const [hangY, hangZ] = pendantHangPoint(design);

  return (
    <>
      <mesh geometry={tube}>
        <MetalMaterial color={metal} />
      </mesh>
      <group position={hang} quaternion={quaternion} scale={BUST_MODEL.jewelleryScale}>
        <group position={[0, -hangY, -hangZ]}>
          <JewelryPiece product={product} part="piece" />
        </group>
      </group>
    </>
  );
}

function HeadScene({
  product,
  wear,
  skin,
  onReady,
  revealed,
}: {
  product: Props["product"];
  wear: Wear;
  skin: string;
  onReady: () => void;
  /** The loading message has gone and the model is on show. */
  revealed: boolean;
}) {
  const { focus, offset } = VIEW[wear];
  const controls = useRef<CameraControls>(null);
  const dragging = useRef(false);
  // No turning until the model is on show; then hold the opening view (the
  // jewellery towards the camera) for a moment before turning.
  const resumeAt = useRef(Infinity);
  useEffect(() => {
    resumeAt.current = revealed ? performance.now() + OPENING_HOLD : Infinity;
  }, [revealed]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.setLookAt(...focus.clone().add(offset).toArray(), ...focus.toArray(), false);
    const onStart = () => {
      dragging.current = true;
    };
    const onEnd = () => {
      dragging.current = false;
      resumeAt.current = performance.now() + RESUME_DELAY;
    };
    c.addEventListener("controlstart", onStart);
    c.addEventListener("controlend", onEnd);
    return () => {
      c.removeEventListener("controlstart", onStart);
      c.removeEventListener("controlend", onEnd);
    };
  }, [focus, offset]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || dragging.current || performance.now() < resumeAt.current) return;
    // Capped, so a pause (e.g. while a shader compiles) does not jump the view round.
    c.rotate(Math.min(delta, 0.1) * 0.4, 0, false);
  });

  return (
    <>
      <CameraControls
        ref={controls}
        makeDefault
        minDistance={3}
        maxDistance={22}
        smoothTime={0.35}
        draggingSmoothTime={0.12}
      />
      <StudioEnvironment />
      <hemisphereLight args={["#ffffff", "#a07f70", 0.14]} />
      {/* Key from above and to the side models the face; a warm rim lifts the head off the backdrop. */}
      <directionalLight
        position={[12, 14, 10]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        // The bust's fine mesh would otherwise shadow itself in stripes.
        shadow-normalBias={0.04}
        shadow-camera-left={-5.5}
        shadow-camera-right={5.5}
        shadow-camera-top={5.5}
        shadow-camera-bottom={-5.5}
      />
      {/* A soft fill from the other side, so the face is evenly, flatteringly lit. */}
      <directionalLight position={[-8, 3, 12]} intensity={1.0} />
      <directionalLight position={[-10, 6, -12]} intensity={1.2} color="#ffe2d4" />

      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          {/* The bust and its jewellery, in the bust's metres, shown at scene size. */}
          <group scale={BUST_MODEL.scale}>
            <group position={BUST_MODEL.origin.map((v) => -v) as [number, number, number]}>
              <Bust skin={skin} fade={BUST_MODEL.fade[wear]} onReady={onReady} />
              <BustBrows />
              <BustLashes />
              {wear === "neck" ? (
                <Necklace product={product} />
              ) : (
                LOBES.map((lobe, i) => (
                  <group
                    key={i}
                    position={lobe.position}
                    quaternion={lobe.quaternion}
                    scale={BUST_MODEL.jewelleryScale}
                  >
                    <JewelryPiece product={product} ear />
                  </group>
                ))
              )}
            </group>
          </group>
          <BustHair />
        </Suspense>
      </GemEnvironmentProvider>
    </>
  );
}

/**
 * Earrings or a pendant worn on a 3D head-and-shoulders bust: drag to turn it,
 * scroll to zoom, with a choice of skin tone.
 */
export default function HeadTryOn({ product, skin, onSkinChange, compact = false }: Props) {
  const wear: Wear = product.design.kind === "pendant" ? "neck" : "ears";
  const { focus, offset } = VIEW[wear];
  const [pickerOpen, setPickerOpen] = useState(!compact);
  const tone = SKIN_TONES.find((t) => t.id === skin) ?? SKIN_TONES[0];
  const { active, progress } = useProgress();
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <div className={styles.root}>
      <Canvas
        className={styles.canvas}
        dpr={[1, 2]}
        shadows="soft"
        camera={{ position: focus.clone().add(offset).toArray(), fov: 30, near: 0.1, far: 200 }}
        // Neutral tone mapping keeps skin colour true (filmic curves wash it out).
        gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping }}
      >
        <color attach="background" args={[BACKDROP]} />
        <HeadScene product={product} wear={wear} skin={tone.color} onReady={onReady} revealed={ready && !active} />
      </Canvas>

      {(active || !ready) && (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} />
          {active ? `Loading model… ${Math.round(progress)}%` : "Preparing model…"}
        </div>
      )}

      <SkinPicker tone={tone} onChange={onSkinChange} open={pickerOpen} onToggle={() => setPickerOpen((v) => !v)} />
    </div>
  );
}
