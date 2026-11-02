"use client";

import { useLayoutEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { GemMaterial, MetalMaterial } from "../materials";

/** Centre-line radius of the shank and its tube radius. */
export const BAND_RADIUS = 1;
export const BAND_TUBE = 0.075;
export const BAND_TOP = BAND_RADIUS + BAND_TUBE;

export const UNIT_SPHERE = new THREE.SphereGeometry(1, 14, 10);

type InstancedProps = { geometry: THREE.BufferGeometry; matrices: THREE.Matrix4[]; color: string };

function useInstanceMatrices(matrices: THREE.Matrix4[], geometry: THREE.BufferGeometry) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    matrices.forEach((m, i) => mesh.setMatrixAt(i, m));
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [matrices, geometry]);
  return ref;
}

/** Many identical stones in one draw call (halos, pavé, side stones). */
export function InstancedGems({ geometry, matrices, color }: InstancedProps) {
  const ref = useInstanceMatrices(matrices, geometry);
  if (!matrices.length) return null;
  return (
    // The refraction shader builds its BVH from the geometry on mount, so remount when it changes.
    <instancedMesh key={`${geometry.uuid}-${matrices.length}`} ref={ref} args={[geometry, undefined, matrices.length]}>
      <GemMaterial color={color} />
    </instancedMesh>
  );
}

/** Many identical metal pieces (beads, claws) in one draw call. */
export function InstancedMetal({ geometry, matrices, color }: InstancedProps) {
  const ref = useInstanceMatrices(matrices, geometry);
  if (!matrices.length) return null;
  return (
    <instancedMesh key={matrices.length} ref={ref} args={[geometry, undefined, matrices.length]} castShadow>
      <MetalMaterial color={color} />
    </instancedMesh>
  );
}

export function sphereMatrix(position: THREE.Vector3, radius: number) {
  return new THREE.Matrix4().compose(
    position,
    new THREE.Quaternion(),
    new THREE.Vector3(radius, radius, radius),
  );
}

const easeOutBack = (t: number) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;

/** Settles its children into place when they first mount (on every option change). */
export function PopIn({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const start = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const g = group.current;
    if (!g) return;
    start.current ??= clock.elapsedTime;
    const t = Math.min(1, (clock.elapsedTime - start.current) / 0.45);
    g.scale.setScalar(0.94 + 0.06 * easeOutBack(t));
  });

  return (
    <group ref={group} scale={0.94}>
      {children}
    </group>
  );
}
