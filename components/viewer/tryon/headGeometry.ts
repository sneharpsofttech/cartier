"use client";

import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { HEAD_MODEL } from "./heads";

/** 0 below `from`, rising to 1 across [`p0`, `p1`], and back to 0 at `to`, smoothly. */
function band(y: number, from: number, p0: number, p1: number, to: number) {
  return THREE.MathUtils.smoothstep(y, from, p0) * (1 - THREE.MathUtils.smoothstep(y, p1, to));
}

/** The scan reshaped towards a female figure (see HEAD_MODEL.shape). */
function feminise(source: THREE.BufferGeometry) {
  const g = source.clone();
  const { centreX: cx, neck, jaw, chin, shoulders, brow, nose, lips } = HEAD_MODEL.shape;
  const p = g.getAttribute("position").array as Float32Array;
  for (let o = 0; o < p.length; o += 3) {
    let x = p[o];
    let y = p[o + 1];
    let z = p[o + 2];
    // A slimmer neck: narrower, and less deep at the back.
    const n = band(y, neck.from, neck.plateau[0], neck.plateau[1], neck.to);
    x = cx + (x - cx) * (1 - n * (1 - neck.width));
    if (z < 0) z *= 1 - n * (1 - neck.depth);
    // A narrower jaw and a smaller chin.
    const j = band(y, jaw.from, jaw.plateau[0], jaw.plateau[1], jaw.to);
    x = cx + (x - cx) * (1 - j * (1 - jaw.width));
    const c = band(y, chin.from, chin.from + 0.25, chin.to - 0.25, chin.to);
    if (z > chin.start) z = chin.start + (z - chin.start) * (1 - c * (1 - chin.reach));
    // Softer features down the middle of the face.
    const mid = (half: number) => 1 - THREE.MathUtils.smoothstep(Math.abs(x - cx), half * 0.6, half);
    const b = band(y, brow.from, brow.plateau[0], brow.plateau[1], brow.to) * mid(brow.halfWidth);
    if (z > brow.base) z = brow.base + (z - brow.base) * (1 - b * (1 - brow.amount));
    const k = band(y, nose.from, nose.plateau[0], nose.plateau[1], nose.to) * mid(nose.halfWidth);
    if (z > nose.base) {
      z = nose.base + (z - nose.base) * (1 - k * (1 - nose.amount));
      x = cx + (x - cx) * (1 - k * (1 - nose.width));
    }
    const l = band(y, lips.from, lips.plateau[0], lips.plateau[1], lips.to) * mid(lips.halfWidth);
    if (z > lips.base) z += l * lips.push;
    // Narrower shoulders that slope down from the neck.
    const below = 1 - THREE.MathUtils.smoothstep(y, shoulders.full, shoulders.below);
    x = cx + (x - cx) * (1 - below * (1 - shoulders.width));
    y -= below * shoulders.slope * Math.max(0, Math.abs(x - cx) - 1.3);
    p[o] = x;
    p[o + 1] = y;
    p[o + 2] = z;
  }
  g.computeVertexNormals();
  return g;
}

/** The reshaped head, shared by the skin, the hair and the necklace (which drapes on it). */
const shaped = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
export function useHeadGeometry() {
  const { scene } = useGLTF(HEAD_MODEL.url);
  const source = (scene.getObjectByProperty("isMesh", true) as THREE.Mesh).geometry;
  if (!shaped.has(source)) shaped.set(source, feminise(source));
  return shaped.get(source)!;
}
