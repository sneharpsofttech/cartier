"use client";

import { useMemo } from "react";
import * as THREE from "three";

/** Radial falloff, bright in the middle and fading to nothing, for soft light panels. */
let softTexture: THREE.CanvasTexture | null = null;
function softFalloff() {
  if (softTexture) return softTexture;
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.45, "rgba(255,255,255,0.85)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  softTexture = new THREE.CanvasTexture(canvas);
  return softTexture;
}

/** A diffused softbox: its light fades out towards the edges, so reflections have smooth gradients. */
export function SoftBox({
  position,
  scale,
  intensity = 1,
  color = "#ffffff",
  dark = false,
}: {
  position: [number, number, number];
  scale: [number, number];
  intensity?: number;
  color?: string;
  /** A soft dark flag (it blocks light) instead of a light. */
  dark?: boolean;
}) {
  // Face the centre from the first render: the environment is captured once, straight away.
  const quaternion = useMemo(() => {
    const o = new THREE.Object3D();
    o.position.set(...position);
    o.lookAt(0, 0, 0);
    return o.quaternion.clone();
  }, [position]);
  const tint = dark ? new THREE.Color(color) : new THREE.Color(color).multiplyScalar(intensity);
  return (
    <mesh position={position} quaternion={quaternion} scale={[scale[0], scale[1], 1]}>
      <planeGeometry />
      <meshBasicMaterial
        map={softFalloff()}
        color={tint}
        transparent
        depthWrite={false}
        opacity={dark ? intensity : 1}
        blending={dark ? THREE.NormalBlending : THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        toneMapped={false}
      />
    </mesh>
  );
}

/** Studio sweep: light above, mid grey towards the floor, with a smooth blend between. */
export function GradientDome({ top, horizon, bottom }: { top: string; horizon: string; bottom: string }) {
  const geometry = useMemo(() => {
    const g = new THREE.SphereGeometry(30, 48, 24);
    const pos = g.attributes.position;
    const colors: number[] = [];
    const [t, h, b] = [top, horizon, bottom].map((c) => new THREE.Color(c));
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 30;
      const c = y >= 0 ? h.clone().lerp(t, Math.pow(y, 0.7)) : h.clone().lerp(b, Math.pow(-y, 0.6));
      colors.push(c.r, c.g, c.b);
    }
    g.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
    return g;
  }, [top, horizon, bottom]);
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial vertexColors side={THREE.BackSide} toneMapped={false} />
    </mesh>
  );
}
