"use client";

import { Suspense, useEffect, useImperativeHandle, useRef, forwardRef } from "react";
import { useFrame } from "@react-three/fiber";
import { CameraControls, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import ConfigurableRing from "./ring/ConfigurableRing";
import { gemColor, metalColor, type RingConfig } from "./ring/config";
import GltfRing from "./GltfRing";
import { GemEnvironmentProvider } from "./materials";
import { GradientDome, SoftBox } from "./studio";

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

/**
 * Studio lighting like a product photographer's: a light-grey sweep plus large
 * diffused softboxes (overhead, front and both sides) and a couple of small
 * accents. The soft falloff gives polished metal the smooth highlight-to-shadow
 * gradients of a real photograph instead of hard-edged bands.
 */
export function StudioEnvironment() {
  return (
    <Environment resolution={512} frames={1}>
      <GradientDome top="#ffffff" horizon="#d9d2c6" bottom="#6f675c" />
      {/*
        Dark flags give the metal its depth: deep tones down the sides and under
        the band, so polished gold shows the light-to-dark sweep of a photograph.
      */}
      <SoftBox position={[-6, 0.5, 5]} scale={[4, 13]} color="#3b352e" intensity={0.95} dark />
      <SoftBox position={[6, 0.5, -5]} scale={[4, 13]} color="#3b352e" intensity={0.95} dark />
      <SoftBox position={[5, 0, 6]} scale={[2.2, 12]} color="#2e2924" intensity={0.85} dark />
      <SoftBox position={[0, -6, -4]} scale={[11, 6]} color="#4a443c" intensity={0.9} dark />
      <SoftBox position={[0, 8, 0]} scale={[11, 11]} intensity={2.6} color="#fffdf8" />
      <SoftBox position={[0, 3, 8]} scale={[10, 5]} intensity={2} color="#fffaf0" />
      <SoftBox position={[-8, 2, 1]} scale={[3.5, 11]} intensity={2.4} />
      <SoftBox position={[8, 2, -1]} scale={[3.5, 11]} intensity={2.4} />
      <SoftBox position={[0, -7, 3]} scale={[10, 6]} intensity={1.2} color="#fff6e0" />
      <SoftBox position={[4, 5, 6]} scale={[2.4, 2.4]} intensity={3.5} />
      <SoftBox position={[-5, 4, -5]} scale={[2.2, 2.2]} intensity={3} />
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
    c.rotate(delta * rotateSpeed * 0.45, 0, false);
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
