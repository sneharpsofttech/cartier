"use client";

import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { StudioEnvironment } from "./Scene";
import { GemEnvironmentProvider, GemMaterial } from "./materials";
import { createCutGeometry, shapeById } from "./ring/shapes";

/** Gem colour per image tint (see TINTS in lib/diamonds/grades.ts). */
const TINT_COLOR: Record<string, string> = {
  white: "#ffffff",
  yellow: "#ffd447",
  pink: "#f7a3c1",
  blue: "#2c5ce6",
  green: "#13a35e",
  red: "#d3123e",
  peach: "#f7b89e",
};

function Stone({ shape, tint }: { shape: string; tint: string }) {
  const { geometry, scale } = useMemo(() => {
    const g = createCutGeometry(shapeById(shape));
    g.computeBoundingBox();
    const size = g.boundingBox!.getSize(new THREE.Vector3());
    // Fit the longest side of the girdle to the frame.
    // Hearts are shown point down, as in a listing photo.
    // Square shapes look larger at this tilt (their corners reach the frame), so go smaller.
    const fit = shape === "princess" ? 1.15 : 1.32;
    return { geometry: g, scale: fit / Math.max(size.x, size.z) };
  }, [shape]);

  return (
    <mesh key={geometry.uuid} geometry={geometry} scale={scale} rotation-y={shape === "round" ? Math.PI / 16 : shape === "heart" ? Math.PI : 0}>
      <GemMaterial color={TINT_COLOR[tint] ?? TINT_COLOR.white} aberration={0.004} />
    </mesh>
  );
}

/**
 * A loose stone shot face-up with a slight tilt, like a diamond listing photo.
 * Screenshotted by scripts/render_thumbnails.py into public/stones/.
 */
/** Warm backdrop matching the site's photo tiles (--photo), so stones need no blending. */
const BACKDROP = "#f3ebe0";

export default function StoneScene({ shape, tint }: { shape: string; tint: string }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: BACKDROP }}>
      <style>{"nextjs-portal { display: none !important; }"}</style>
      <Canvas
        dpr={2}
        camera={{ position: [0, 4.7, 1.4], fov: 30, near: 0.1, far: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
      >
        <color attach="background" args={[BACKDROP]} />
        <StudioEnvironment />
        <GemEnvironmentProvider variant="loose">
          <Suspense fallback={null}>
            <Stone shape={shape} tint={tint} />
          </Suspense>
        </GemEnvironmentProvider>
      </Canvas>
    </div>
  );
}
