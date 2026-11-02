"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { GemMaterial, MetalMaterial } from "../materials";
import { surfaceMatrix } from "../geometry";
import type { HeadType } from "./config";
import {
  areaFactor,
  createCutGeometry,
  crownHeight,
  denseOutline,
  offsetOutline,
  pavilionDepth,
  radiusAt,
  shapeById,
  spacedAlong,
  type ShapeId,
} from "./shapes";
import { BAND_RADIUS, BAND_TOP, BAND_TUBE, InstancedGems, InstancedMetal, UNIT_SPHERE, sphereMatrix } from "./parts";

/** Girdle half-width of a 1 ct round, in scene units (~6.5 mm on a size 7 ring). */
const ONE_CARAT_RADIUS = 0.37;
const UP = new THREE.Vector3(0, 1, 0);
const ROUND = createCutGeometry(shapeById("round"));

const to3 = (p: THREE.Vector2, y: number) => new THREE.Vector3(p.x, y, p.y);

/**
 * A claw that tapers like a jeweller's prong: slim where it leaves the base,
 * fullest where it grips the girdle, easing in towards a rounded tip. The
 * tube's rings are scaled about the curve; a sphere of the end radius caps it.
 */
function taperedClaw(curve: THREE.Curve<THREE.Vector3>, radius: number) {
  const SEGMENTS = 40;
  const SIDES = 14;
  const geometry = new THREE.TubeGeometry(curve, SEGMENTS, radius, SIDES, false);
  const width = (t: number) => (t < 0.7 ? 0.68 + 0.32 * Math.sin((t / 0.7) * (Math.PI / 2)) : 1 - 0.12 * ((t - 0.7) / 0.3));
  const pos = geometry.attributes.position;
  const centre = new THREE.Vector3();
  const v = new THREE.Vector3();
  for (let i = 0; i <= SEGMENTS; i++) {
    const t = i / SEGMENTS;
    curve.getPointAt(t, centre);
    for (let j = 0; j <= SIDES; j++) {
      const k = i * (SIDES + 1) + j;
      v.fromBufferAttribute(pos, k).sub(centre).multiplyScalar(width(t)).add(centre);
      pos.setXYZ(k, v.x, v.y, v.z);
    }
  }
  geometry.computeVertexNormals();
  return { geometry, tip: curve.getPointAt(1), tipRadius: radius * width(1) * 1.04 };
}

function closedTube(points: THREE.Vector3[], radius: number) {
  return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 160, radius, 8, true);
}

type Halo = { stones: THREE.Matrix4[]; beads: THREE.Matrix4[]; rail: THREE.TubeGeometry };

/**
 * A bezel: a wall of metal following the girdle, its rounded lip just over the
 * stone's edge. Extruded downwards from `top` by `height`.
 */
function buildBezel(girdle: THREE.Vector2[], wall: number, top: number, height: number) {
  const shape = new THREE.Shape(offsetOutline(girdle, wall));
  // The opening is a touch smaller than the stone, so the lip holds it.
  shape.holes.push(new THREE.Path(offsetOutline(girdle, -0.012)));
  const bevel = Math.min(wall * 0.35, 0.016);
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height,
    curveSegments: 1,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 4,
  });
  // Shape plane (x, y) -> ring plane (x, z); extrusion (+z) -> downwards (-y).
  geometry.rotateX(Math.PI / 2);
  geometry.translate(0, top, 0);
  geometry.computeVertexNormals();
  return geometry;
}

/** The tapered cup under a bezel, narrowing from its wall down onto the band. */
function buildBezelCup(girdle: THREE.Vector2[], wall: number, from: number, to: number) {
  const upper = offsetOutline(girdle, wall);
  const lower = girdle.map((p) => p.clone().multiplyScalar(0.3));
  const positions: number[] = [];
  upper.forEach((p) => positions.push(p.x, from, p.y));
  lower.forEach((p) => positions.push(p.x, to, p.y));
  const n = girdle.length;
  const index: number[] = [];
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    // Anticlockwise outline seen from above: these windings face outwards.
    index.push(i, j, n + i, j, n + j, n + i);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(index);
  geometry.computeVertexNormals();
  return geometry;
}

/** A ring of melee following `path`, tilted outward by `tilt` (0 = facing up). */
function buildHalo(path: THREE.Vector2[], y: number, melee: number, tilt: number): Halo {
  const spots = spacedAlong(path, melee * 2.18);
  const stones: THREE.Matrix4[] = [];
  const beads: THREE.Matrix4[] = [];

  spots.forEach(({ point, tangent }, i) => {
    const outward = new THREE.Vector3(tangent.y, 0, -tangent.x);
    const normal = UP.clone().lerp(outward, tilt).normalize();
    stones.push(surfaceMatrix(to3(point, y), normal, new THREE.Vector3(tangent.x, 0, tangent.y), 0, melee));

    // Shared prong between neighbours, on the outer edge.
    const next = spots[(i + 1) % spots.length].point;
    const mid = point.clone().lerp(next, 0.5);
    const bead = to3(mid, y + melee * 0.2).add(outward.clone().multiplyScalar(melee * 0.55));
    beads.push(sphereMatrix(bead, melee * 0.33));
  });

  const railPath = path.map((p) => to3(p, y - melee * 0.6));
  return { stones, beads, rail: closedTube(railPath, melee * 0.8) };
}

function useHeadLayout(shapeId: ShapeId, carat: number, head: HeadType) {
  const def = shapeById(shapeId);
  const gemGeometry = useMemo(() => createCutGeometry(def), [def]);

  const layout = useMemo(() => {
    const width = (ONE_CARAT_RADIUS * Math.cbrt(carat)) / Math.sqrt(areaFactor(def));
    const depth = pavilionDepth(def) * width;
    const crown = crownHeight(def) * width;
    const lift = head === "hiddenHalo" ? 0.05 : 0;
    const girdleY = BAND_TOP + depth + 0.06 + lift;
    const unit = denseOutline(def);
    const girdle = unit.map((p) => p.clone().multiplyScalar(width));
    // Sturdy claws, as a jeweller makes them for a centre stone.
    const prongRadius = THREE.MathUtils.clamp(0.04 + width * 0.08, 0.056, 0.09);

    const prongs = (head === "bezel" ? [] : def.prongs).map((angle) => {
      const dir = new THREE.Vector2(Math.cos(angle), Math.sin(angle));
      const r = radiusAt(unit, angle) * width;
      const at = (radius: number, y: number) => to3(dir.clone().multiplyScalar(radius), y);
      const curve = new THREE.CatmullRomCurve3([
        at(Math.min(r, 0.3) * 0.3, BAND_TOP - 0.02),
        at(r * 0.72, girdleY - depth * 0.5),
        at(r + prongRadius * 0.4, girdleY),
        // A short hook over the crown, so from above the claw ends in one rounded tip.
        at(r - prongRadius * 0.05, girdleY + crown * 0.3),
      ]);
      return taperedClaw(curve, prongRadius);
    });

    const galleries = [
      closedTube(girdle.map((p) => to3(p.clone().multiplyScalar(0.7), girdleY - depth * 0.42)), 0.022),
      closedTube(girdle.map((p) => to3(p.clone().multiplyScalar(0.32), BAND_TOP + 0.03)), 0.02),
    ];

    const melee = THREE.MathUtils.clamp(0.026 + width * 0.035, 0.034, 0.05);
    const halos: Halo[] = [];
    if (head === "halo" || head === "doubleHalo") {
      const inner = offsetOutline(girdle, melee + 0.018);
      halos.push(buildHalo(inner, girdleY - 0.035, melee, 0.2));
      if (head === "doubleHalo") {
        const outer = offsetOutline(girdle, melee * 3.1 + 0.03);
        halos.push(buildHalo(outer, girdleY - 0.075, melee * 0.9, 0.3));
      }
    } else if (head === "hiddenHalo") {
      const under = offsetOutline(girdle.map((p) => p.clone().multiplyScalar(0.84)), melee * 0.4);
      halos.push(buildHalo(under, girdleY - depth * 0.3, melee * 0.85, 0.85));
    }

    const bezelWall = THREE.MathUtils.clamp(0.04 + width * 0.05, 0.05, 0.075);
    const bezelTop = girdleY + crown * 0.18;
    // A short straight lip; the sloped cup below catches more light than a tall wall.
    const bezelHeight = depth * 0.2 + crown * 0.18;
    const bezel =
      head === "bezel"
        ? [
            buildBezel(girdle, bezelWall, bezelTop, bezelHeight),
            buildBezelCup(girdle, bezelWall, bezelTop - bezelHeight, BAND_TOP + 0.01),
          ]
        : [];

    // Cathedral shoulders: the band sweeps up on each side to cradle a prong head.
    const cathedral =
      head === "prong"
        ? [-1, 1].map((side) => {
            const start = 0.62;
            const curve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(side * Math.sin(start) * BAND_RADIUS, Math.cos(start) * BAND_RADIUS, 0),
              new THREE.Vector3(side * Math.sin(start * 0.62) * (BAND_RADIUS + 0.05), Math.cos(start * 0.62) * (BAND_RADIUS + 0.05), 0),
              new THREE.Vector3(side * Math.min(width * 0.5, 0.22), girdleY - depth * 0.62, 0),
            ]);
            const g = new THREE.TubeGeometry(curve, 32, BAND_TUBE * 0.78, 12, false);
            g.scale(1, 1, 1.55);
            return g;
          })
        : [];

    return { width, girdleY, prongs, galleries, halos, bezel, cathedral };
  }, [def, carat, head]);

  return { gemGeometry, ...layout };
}

type HeadProps = {
  shape: ShapeId;
  carat: number;
  type: HeadType;
  metal: string;
  gem: string;
  accent: string;
  /** Band shoulders rising to meet a prong head; only rings have a band to join. */
  shoulders?: boolean;
};

export default function Head({ shape, carat, type, metal, gem, accent, shoulders = true }: HeadProps) {
  const { gemGeometry, width, girdleY, prongs, galleries, halos, bezel, cathedral } = useHeadLayout(shape, carat, type);

  return (
    <group>
      {/* Seat that joins the basket to the shank (and bridges split shanks). */}
      <mesh position={[0, BAND_TOP - 0.035, 0]} scale={[0.12, 0.055, 0.19]}>
        <sphereGeometry args={[1, 24, 16]} />
        <MetalMaterial color={metal} />
      </mesh>

      {shoulders && cathedral.map((g) => (
        <mesh key={g.uuid} geometry={g} castShadow>
          <MetalMaterial color={metal} />
        </mesh>
      ))}

      {bezel.map((g) => (
        <mesh key={g.uuid} geometry={g} castShadow>
          <MetalMaterial color={metal} />
        </mesh>
      ))}

      {galleries.map((g, i) => (
        <mesh key={i} geometry={g}>
          <MetalMaterial color={metal} />
        </mesh>
      ))}

      {prongs.map(({ geometry, tip, tipRadius }, i) => (
        <group key={i}>
          <mesh geometry={geometry} castShadow>
            <MetalMaterial color={metal} />
          </mesh>
          {/* A round cap the same size as the claw's end, so the tip is smooth. */}
          <mesh position={tip} scale={tipRadius} geometry={UNIT_SPHERE}>
            <MetalMaterial color={metal} />
          </mesh>
        </group>
      ))}

      {halos.map((h, i) => (
        <group key={i}>
          <mesh geometry={h.rail} castShadow>
            <MetalMaterial color={metal} />
          </mesh>
          <InstancedMetal geometry={UNIT_SPHERE} matrices={h.beads} color={metal} />
          <InstancedGems geometry={ROUND} matrices={h.stones} color={accent} />
        </group>
      ))}

      <mesh key={gemGeometry.uuid} geometry={gemGeometry} position={[0, girdleY, 0]} scale={width}>
        <GemMaterial color={gem} />
      </mesh>
    </group>
  );
}
