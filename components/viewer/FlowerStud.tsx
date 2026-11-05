"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { InstancedGems, InstancedMetal, UNIT_SPHERE } from "./ring/parts";
import { areaFactor, createCutGeometry, crownHeight, pavilionDepth, shapeById } from "./ring/shapes";
import { MetalMaterial } from "./materials";

/**
 * A diamond flower cluster stud: a larger round brilliant in the centre and six
 * round brilliants round it as petals, each in its own open basket, held by
 * claws at the petal tips and in the gaps between the stones. Behind: a wire
 * gallery joining the baskets, a back plate, the post and a butterfly back.
 *
 * Built facing +Y (the stones' tables up) with the post running down -Y, the
 * way an earring is worn out of the skin; FlowerStuds turns it to face the camera.
 */

const ROUND_DEF = shapeById("round");
const ROUND = createCutGeometry(ROUND_DEF);
const PAVILION = pavilionDepth(ROUND_DEF);
const CROWN = crownHeight(ROUND_DEF);
/** Girdle half-width of a 1 ct round, in scene units (as Head sizes its stones). */
const ONE_CARAT_RADIUS = 0.37;
const PETALS = 6;
/** Height of the bottom of the baskets, and of each culet just above it. */
const CULET_Y = 0.03;

const girdleRadius = (carat: number) => (ONE_CARAT_RADIUS * Math.cbrt(carat)) / Math.sqrt(areaFactor(ROUND_DEF));

/**
 * An open basket under a stone, for a girdle radius of 1: a thin tapering
 * wall from just under the culet up to just below the girdle, so the stone
 * sits in it with its crown clear.
 */
const BASKET = (() => {
  const top = PAVILION * 0.9;
  const pts = [
    new THREE.Vector2(0.3, 0),
    new THREE.Vector2(0.96, top),
    new THREE.Vector2(0.9, top + 0.04),
    new THREE.Vector2(0.22, 0.05),
  ];
  pts.push(pts[0].clone());
  const g = new THREE.LatheGeometry(pts, 48);
  g.computeVertexNormals();
  return g;
})();

/** A claw: a slightly tapered rod of unit length along +Y, from its base at the origin. */
const CLAW = (() => {
  const g = new THREE.CylinderGeometry(0.75, 1, 1, 12, 1);
  g.translate(0, 0.5, 0);
  return g;
})();

const Y = new THREE.Vector3(0, 1, 0);

/** Matrix for a claw from `from` to `to`, of radius `r`. */
function clawMatrix(from: THREE.Vector3, to: THREE.Vector3, r: number) {
  const d = to.clone().sub(from);
  const q = new THREE.Quaternion().setFromUnitVectors(Y, d.clone().normalize());
  return new THREE.Matrix4().compose(from, q, new THREE.Vector3(r, d.length(), r));
}

const sphere = (p: THREE.Vector3, r: number) =>
  new THREE.Matrix4().compose(p, new THREE.Quaternion(), new THREE.Vector3(r, r, r));

export function flowerLayout(centreCarat: number, petalCarat: number) {
  const wc = girdleRadius(centreCarat);
  const wp = girdleRadius(petalCarat);
  // Petal centres: just clear of the centre stone.
  const R = wc + wp + 0.03;
  const gc = CULET_Y + PAVILION * wc;
  const gp = CULET_Y + PAVILION * wp;
  return { wc, wp, R, gc, gp, extent: R + wp + 0.05 };
}

export default function FlowerStud({
  centreCarat,
  petalCarat,
  metal,
  gem,
  worn = false,
}: {
  centreCarat: number;
  petalCarat: number;
  metal: string;
  gem: string;
  /** Worn on an ear: a short post that ends in the lobe, and no butterfly back. */
  worn?: boolean;
}) {
  const parts = useMemo(() => {
    const { wc, wp, R, gc, gp } = flowerLayout(centreCarat, petalCarat);
    const at = (angle: number, dist: number, y: number) =>
      new THREE.Vector3(Math.cos(angle) * dist, y, Math.sin(angle) * dist);
    const petalAngles = Array.from({ length: PETALS }, (_, i) => (i / PETALS) * Math.PI * 2 + Math.PI / 2);

    // Stones: tables up, girdles at their heights.
    const centreStone = [
      new THREE.Matrix4().compose(new THREE.Vector3(0, gc, 0), new THREE.Quaternion(), new THREE.Vector3(wc, wc, wc)),
    ];
    const petals = petalAngles.map((a) =>
      new THREE.Matrix4().compose(
        at(a, R, gp),
        new THREE.Quaternion().setFromAxisAngle(Y, a),
        new THREE.Vector3(wp, wp, wp),
      ),
    );
    // Baskets under each.
    const baskets = [
      new THREE.Matrix4().compose(
        new THREE.Vector3(0, CULET_Y - 0.02, 0),
        new THREE.Quaternion(),
        new THREE.Vector3(wc, wc, wc),
      ),
      ...petalAngles.map((a) =>
        new THREE.Matrix4().compose(at(a, R, CULET_Y - 0.02), new THREE.Quaternion(), new THREE.Vector3(wp, wp, wp)),
      ),
    ];

    const claws: THREE.Matrix4[] = [];
    const tips: THREE.Matrix4[] = [];
    const clawR = 0.022;
    const tipR = 0.032;
    const addClaw = (base: THREE.Vector3, tip: THREE.Vector3) => {
      claws.push(clawMatrix(base, tip, clawR));
      tips.push(sphere(tip, tipR));
    };

    // At each petal's tip: one claw rising up the outside and over the girdle.
    for (const a of petalAngles) {
      const out = R + wp;
      addClaw(at(a, out - 0.04, CULET_Y + 0.02), at(a, out - 0.035, gp + CROWN * wp * 0.32));
    }
    // In the gaps between neighbouring petals, on the outside: one claw holding both.
    const gapOut =
      R * Math.cos(Math.PI / PETALS) + Math.sqrt(Math.max(0, (wp * 1.02) ** 2 - (R * Math.sin(Math.PI / PETALS)) ** 2));
    for (const a of petalAngles) {
      const m = a + Math.PI / PETALS;
      addClaw(at(m, gapOut - 0.06, CULET_Y + 0.02), at(m, gapOut, gp + CROWN * wp * 0.28));
    }
    // In the gaps between the centre and two petals: one claw holding all three.
    // Found where it is as far from the centre stone's edge as from the petals'.
    let lo = wc;
    let hi = R;
    for (let k = 0; k < 40; k++) {
      const t = (lo + hi) / 2;
      const toCentre = t - wc;
      const toPetal = Math.sqrt(t * t + R * R - 2 * t * R * Math.cos(Math.PI / PETALS)) - wp;
      if (toCentre < toPetal) lo = t;
      else hi = t;
    }
    const gapIn = (lo + hi) / 2;
    for (const a of petalAngles) {
      const m = a + Math.PI / PETALS;
      addClaw(at(m, gapIn, CULET_Y + 0.02), at(m, gapIn, Math.max(gc, gp) + CROWN * wc * 0.22));
    }

    // Gallery: a wire round the petals' baskets, and spokes to the centre one.
    const ring = new THREE.TorusGeometry(R, 0.026, 12, 96);
    ring.rotateX(Math.PI / 2);
    ring.translate(0, CULET_Y + 0.05, 0);
    const spokes = petalAngles.map((a) => clawMatrix(new THREE.Vector3(0, CULET_Y, 0), at(a, R, CULET_Y), 0.024));

    return { centreStone, petals, baskets, claws, tips, ring, spokes, wc, wp };
  }, [centreCarat, petalCarat]);

  const postLength = worn ? 0.26 : 0.95;
  const butterflyY = -0.5;

  return (
    <group>
      <InstancedGems geometry={ROUND} matrices={parts.centreStone} color={gem} />
      <InstancedGems geometry={ROUND} matrices={parts.petals} color={gem} />
      <InstancedMetal geometry={BASKET} matrices={parts.baskets} color={metal} />
      <InstancedMetal geometry={CLAW} matrices={parts.claws} color={metal} />
      <InstancedMetal geometry={UNIT_SPHERE} matrices={parts.tips} color={metal} />
      <InstancedMetal geometry={CLAW} matrices={parts.spokes} color={metal} />
      <mesh geometry={parts.ring}>
        <MetalMaterial color={metal} />
      </mesh>

      {/* Back plate, where the post is soldered on. */}
      <mesh position={[0, CULET_Y - 0.035, 0]}>
        <cylinderGeometry args={[0.13, 0.15, 0.05, 32]} />
        <MetalMaterial color={metal} />
      </mesh>

      {/* The post, with the two notches the butterfly clicks into. */}
      <mesh position={[0, CULET_Y - 0.06 - postLength / 2, 0]}>
        <cylinderGeometry args={[0.024, 0.024, postLength, 14]} />
        <MetalMaterial color={metal} />
      </mesh>
      {!worn &&
        [butterflyY - 0.12, butterflyY - 0.2].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.024, 0.005, 6, 20]} />
            <MetalMaterial color={metal} />
          </mesh>
        ))}

      {!worn && (
        // Butterfly back: a domed plate with a collar round the post, and two wings curled under.
        <group position={[0, butterflyY, 0]}>
          <mesh scale={[1.45, 1, 1]}>
            <cylinderGeometry args={[0.2, 0.19, 0.03, 40]} />
            <MetalMaterial color={metal} />
          </mesh>
          <mesh position={[0, 0.045, 0]}>
            <cylinderGeometry args={[0.048, 0.056, 0.07, 20]} />
            <MetalMaterial color={metal} />
          </mesh>
          {[1, -1].map((s) => (
            <mesh
              key={s}
              position={[s * 0.15, -0.075, 0]}
              rotation={[0, 0, s > 0 ? Math.PI : Math.PI / 2]}
              scale={[1, 1, 2.2]}
            >
              <torusGeometry args={[0.075, 0.02, 12, 40, Math.PI * 1.5]} />
              <MetalMaterial color={metal} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

/** A pair of flower studs, facing the camera: the left straight on, the right turned a little to show its depth. */
export function FlowerStuds(props: { centreCarat: number; petalCarat: number; metal: string; gem: string }) {
  const { extent } = flowerLayout(props.centreCarat, props.petalCarat);
  const gap = extent + 0.12;
  return (
    <group>
      <group position={[-gap, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <FlowerStud {...props} />
      </group>
      <group position={[gap, 0, 0]} rotation={[0, -0.35, 0]}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <FlowerStud {...props} />
        </group>
      </group>
    </group>
  );
}
