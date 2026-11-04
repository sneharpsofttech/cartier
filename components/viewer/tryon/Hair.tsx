"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { HAIR } from "./heads";
import { useHeadGeometry } from "./headGeometry";
import { buildHairStrands, strandMaterial } from "./hairStrands";

/**
 * Sleek hair pulled back into a low bun, so the ears and neck stay clear for
 * the jewellery. Thousands of fine strands (see hairStrands.ts) run from the
 * scalp back into the bun; under them, a dark layer over the scalp (the head's
 * own surface, lifted off it, from a soft hairline) and the bun's core keep any
 * skin from showing between the strands, as dense hair would.
 */

/** How far above the hairline a point is (negative below it), from where it sits round the head. */
function aboveHairline(x: number, y: number, z: number) {
  const [cx, cz] = HAIR.centre;
  // 0 at the front of the face, π/2 at the ears, π at the back.
  const around = Math.abs(Math.atan2(x - cx, z - cz));
  const line = HAIR.hairline;
  let height: number = line[line.length - 1][1];
  for (let i = 1; i < line.length; i++) {
    const [a0, h0] = line[i - 1];
    const [a1, h1] = line[i];
    if (around <= a1) {
      height = THREE.MathUtils.lerp(h0, h1, THREE.MathUtils.smoothstep(around, a0, a1));
      break;
    }
  }
  return y - height;
}

/** How far inside the ear's outline (an oval seen from the side) a point is: 0 outside, 1 well inside. */
function onEar(x: number, y: number, z: number) {
  const e = HAIR.ears;
  if (Math.abs(x - HAIR.centre[0]) < e.x) return 0;
  const r = Math.hypot((z - e.centre[1]) / e.radii[1], (y - e.centre[0]) / e.radii[0]);
  return 1 - THREE.MathUtils.smoothstep(r, 0.92, 1.06);
}

const POINTS = HAIR.hairline.length;

const VERTEX_HEAD = /* glsl */ `
attribute vec2 strand;
attribute vec3 flow;
attribute vec3 scalp;
varying vec2 vStrand;
varying vec3 vFlow;
varying vec3 vScalp;
varying vec3 vWorld;
varying vec3 vWorldNormal;
`;

const VERTEX_BODY = /* glsl */ `
vStrand = strand;
vFlow = normalize(mat3(modelMatrix) * flow);
vScalp = scalp;
vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
vWorldNormal = normalize(mat3(modelMatrix) * normal);
`;

const FRAGMENT_HEAD = /* glsl */ `
uniform vec3 keyLight;
uniform vec3 hairTint;
uniform vec2 hairline[${POINTS}];
uniform vec2 hairCentre;
uniform float feather;
uniform vec4 ear;
uniform float earX;
varying vec2 vStrand;
varying vec3 vFlow;
varying vec3 vScalp;
varying vec3 vWorld;
varying vec3 vWorldNormal;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// Strands side by side: noise of the position round the axis (a point on a
// circle, so it joins up all the way round), at three widths, in -1..1.
float streaks() {
  float n = noise(vStrand * 70.0) * 0.45 + noise(vStrand * 230.0 + 7.0) * 0.33 + noise(vStrand * 720.0 + 3.0) * 0.22;
  return n * 2.0 - 1.0;
}

// How much hair covers this point of the scalp: up from a soft hairline, and clear of the ears.
float hairCover() {
  float around = abs(atan(vScalp.x - hairCentre.x, vScalp.z - hairCentre.y));
  float height = hairline[${POINTS - 1}].y;
  for (int i = 1; i < ${POINTS}; i++) {
    if (around <= hairline[i].x) {
      height = mix(hairline[i - 1].y, hairline[i].y, smoothstep(hairline[i - 1].x, hairline[i].x, around));
      break;
    }
  }
  // A slightly ragged edge, as real hairlines are.
  float edge = (noise(vec2(around * 14.0, 0.5)) - 0.5) * feather * 0.9;
  // Starts a little behind the hairline, so the very front is individual strands.
  float c = smoothstep(-feather, feather, vScalp.y - height + edge - 0.24);
  if (abs(vScalp.x - hairCentre.x) > earX) {
    float r = length(vec2((vScalp.z - ear.y) / ear.w, (vScalp.y - ear.x) / ear.z));
    c *= smoothstep(0.92, 1.06, r);
  }
  return c;
}
`;

const COLOR_FRAGMENT = /* glsl */ `
float hairStreak = streaks();
diffuseColor.rgb *= 0.9 + 0.15 * hairStreak;
#ifdef HAIR_COVER
diffuseColor.a *= hairCover();
#endif
`;

const SHEEN_FRAGMENT = /* glsl */ `
// Kajiya-Kay: hair reflects light in a band across the strands, strongest where
// the half-vector is at right angles to the strand direction.
vec3 hairV = normalize(cameraPosition - vWorld);
vec3 hairL = normalize(keyLight);
vec3 hairH = normalize(hairL + hairV);
float hairTH = dot(normalize(vFlow), hairH);
float hairSin = sqrt(max(0.0, 1.0 - hairTH * hairTH));
float hairLit = smoothstep(-0.15, 0.45, dot(normalize(vWorldNormal), hairL));
vec3 hairSpec = hairTint * pow(hairSin, 22.0) * 0.08;
gl_FragColor.rgb += hairSpec * hairLit * (0.7 + 0.3 * hairStreak) * diffuseColor.a;
`;

/** Hair shading; `cover` fades it out below the hairline and round the ears (for the layer over the scalp). */
function hairMaterial(cover: boolean) {
  const m = new THREE.MeshStandardMaterial({
    color: HAIR.underColor,
    roughness: 0.8,
    metalness: 0,
    transparent: true,
    envMapIntensity: 0.35,
  });
  if (cover) m.defines = { HAIR_COVER: "" };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.keyLight = { value: new THREE.Vector3(...HAIR.keyLight) };
    shader.uniforms.hairTint = { value: new THREE.Color(HAIR.sheen) };
    shader.uniforms.hairline = { value: HAIR.hairline.map(([a, h]) => new THREE.Vector2(a, h)) };
    shader.uniforms.hairCentre = { value: new THREE.Vector2(...HAIR.centre) };
    shader.uniforms.feather = { value: HAIR.feather };
    shader.uniforms.ear = { value: new THREE.Vector4(...HAIR.ears.centre, ...HAIR.ears.radii) };
    shader.uniforms.earX = { value: HAIR.ears.x };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_HEAD}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_HEAD}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${COLOR_FRAGMENT}`)
      .replace("#include <dithering_fragment>", `${SHEEN_FRAGMENT}\n#include <dithering_fragment>`);
  };
  return m;
}

/** The hair over the scalp: the head's surface above the hairline, lifted off it. */
function capGeometry(head: THREE.BufferGeometry) {
  const pos = head.getAttribute("position");
  const nrm = head.getAttribute("normal");
  const count = pos.count;
  const bun = new THREE.Vector3(...HAIR.bun.centre);
  // Roughly where the hair is (the shader works out its exact, soft edge for each
  // pixel); a margin past the hairline leaves room for it to fade out.
  const near = new Uint8Array(count);
  for (let i = 0; i < count; i++) {
    const [x, y, z] = [pos.getX(i), pos.getY(i), pos.getZ(i)];
    near[i] = aboveHairline(x, y, z) > -HAIR.feather * 3 && onEar(x, y, z) < 1 ? 1 : 0;
  }
  const index = head.getIndex()?.array ?? Array.from({ length: count }, (_, i) => i);
  const keep: number[] = [];
  for (let t = 0; t < index.length; t += 3) {
    const [a, b, c] = [index[t], index[t + 1], index[t + 2]];
    if (near[a] || near[b] || near[c]) keep.push(a, b, c);
  }

  const positions = new Float32Array(count * 3);
  const strand = new Float32Array(count * 2);
  const flow = new Float32Array(count * 3);
  const p = new THREE.Vector3();
  const n = new THREE.Vector3();
  const d = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    p.fromBufferAttribute(pos, i);
    n.fromBufferAttribute(nrm, i);
    // Thin at the hairline, fuller over the crown.
    const rise = Math.min(1, Math.max(0, aboveHairline(p.x, p.y, p.z) / 0.8));
    const lift = HAIR.thickness[0] + (HAIR.thickness[1] - HAIR.thickness[0]) * rise;
    positions.set([p.x + n.x * lift, p.y + n.y * lift, p.z + n.z * lift], i * 3);
    // The strands run back over the surface towards the bun ...
    d.subVectors(bun, p);
    d.addScaledVector(n, -d.dot(n)).normalize();
    flow.set([d.x, d.y, d.z], i * 3);
    // ... and lie side by side round the axis from the face to the bun.
    const a = Math.atan2(p.x - HAIR.centre[0], p.y - HAIR.axisY);
    strand.set([Math.cos(a), Math.sin(a)], i * 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  g.setAttribute("normal", nrm.clone());
  g.setAttribute("strand", new THREE.BufferAttribute(strand, 2));
  g.setAttribute("flow", new THREE.BufferAttribute(flow, 3));
  g.setAttribute("scalp", pos.clone());
  g.setIndex(keep);
  return g;
}

/** A low bun: a rounded coil, its strands swirling round it. */
function bunGeometry() {
  const { radius, scale } = HAIR.bun;
  const g = new THREE.SphereGeometry(radius, 64, 40);
  g.scale(...scale);
  const pos = g.getAttribute("position");
  const count = pos.count;
  const strand = new Float32Array(count * 2);
  const flow = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const [x, y] = [pos.getX(i), pos.getY(i)];
    // Swirl: the angle round the bun's axis, wound with the distance out from it.
    const a = Math.atan2(y, x) + Math.hypot(x, y) * 5;
    strand.set([Math.cos(a), Math.sin(a)], i * 2);
    const t = new THREE.Vector3(-y, x, 0.001).normalize();
    flow.set([t.x, t.y, t.z], i * 3);
  }
  g.setAttribute("strand", new THREE.BufferAttribute(strand, 2));
  g.setAttribute("flow", new THREE.BufferAttribute(flow, 3));
  g.setAttribute("scalp", pos.clone());
  return g;
}

export default function Hair() {
  const head = useHeadGeometry();
  const { cap, bun, capMaterial, bunMaterial, strands, fibre } = useMemo(
    () => ({
      cap: capGeometry(head),
      bun: bunGeometry(),
      capMaterial: hairMaterial(true),
      bunMaterial: hairMaterial(false),
      strands: buildHairStrands(head, aboveHairline, onEar),
      fibre: strandMaterial(),
    }),
    [head],
  );
  return (
    <>
      <lineSegments geometry={strands} material={fibre} renderOrder={2} frustumCulled={false} />
      <mesh geometry={cap} material={capMaterial} renderOrder={1} castShadow />
      <mesh geometry={bun} material={bunMaterial} position={HAIR.bun.centre} renderOrder={1} castShadow />
    </>
  );
}
