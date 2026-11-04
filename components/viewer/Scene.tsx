"use client";

import { Suspense, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CameraControls, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import ConfigurableRing from "./ring/ConfigurableRing";
import { gemColor, metalColor, type RingConfig } from "./ring/config";
import GltfRing from "./GltfRing";
import { GemEnvironmentProvider } from "./materials";
import { MetalStudio } from "./studio";

export const HOME = {
  position: new THREE.Vector3(3.3, 2.3, 5.6),
  target: new THREE.Vector3(0, 0.25, 0),
};
const INTRO_POSITION = new THREE.Vector3(5.5, 4.2, 9.5);
/** How long auto-rotation waits after the user lets go. */
const RESUME_DELAY = 2500;

export type SceneHandle = {
  reset: () => void;
  fit: () => void;
  zoom: (direction: 1 | -1) => void;
};

type SceneProps = {
  modelUrl?: string;
  config: RingConfig;
  autoRotate: boolean;
  rotateSpeed: number;
  shadow: boolean;
};

/** The metal studio (see MetalStudio), lighting every piece in the scene. */
export function StudioEnvironment() {
  return (
    <Environment resolution={512} frames={1}>
      <MetalStudio />
    </Environment>
  );
}

const Scene = forwardRef<SceneHandle, SceneProps>(function Scene(
  { modelUrl, config, autoRotate, rotateSpeed, shadow },
  ref,
) {
  const controls = useRef<CameraControls>(null);
  const ring = useRef<THREE.Group>(null);
  const resumeAt = useRef(0);
  const dragging = useRef(false);

  useImperativeHandle(ref, () => ({
    reset() {
      resumeAt.current = performance.now() + 1200;
      controls.current?.setLookAt(...HOME.position.toArray(), ...HOME.target.toArray(), true);
    },
    fit() {
      if (!ring.current || !controls.current) return;
      resumeAt.current = performance.now() + 1200;
      controls.current.fitToSphere(ring.current, true);
    },
    zoom(direction) {
      const c = controls.current;
      if (c) c.dolly(direction * c.distance * 0.22, true);
    },
  }));

  // Fly in from a distance on first load.
  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.setLookAt(...INTRO_POSITION.toArray(), ...HOME.target.toArray(), false);
    resumeAt.current = performance.now() + 1400;
    c.setLookAt(...HOME.position.toArray(), ...HOME.target.toArray(), true);

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
  }, []);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || !autoRotate || dragging.current || performance.now() < resumeAt.current) return;
    // Capped, so a pause (e.g. while a shader compiles) does not jump the view round.
    c.rotate(Math.min(delta, 0.1) * rotateSpeed * 0.45, 0, false);
  });


  return (
    <>
      <CameraControls
        ref={controls}
        makeDefault
        minDistance={2.2}
        maxDistance={12}
        minPolarAngle={0.15}
        maxPolarAngle={Math.PI / 2 + 0.05}
        smoothTime={0.35}
        draggingSmoothTime={0.12}
      />

      <StudioEnvironment />

      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          {modelUrl ? (
            <GltfRing
              ref={ring}
              url={modelUrl}
              metal={metalColor(config.headMetal)}
              gem={gemColor(config.centerGem)}
              side={gemColor(config.accentGem)}
            />
          ) : (
            <ConfigurableRing ref={ring} config={config} />
          )}
          {shadow && (
            <ContactShadows
              position={[0, -1.18, 0]}
              opacity={0.55}
              scale={9}
              blur={2.8}
              far={3.2}
              resolution={1024}
              color="#1b1b1b"
              frames={Infinity}
            />
          )}
        </Suspense>
      </GemEnvironmentProvider>
    </>
  );
});

export default Scene;
