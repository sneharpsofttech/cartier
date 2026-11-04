"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Environment, MeshRefractionMaterial } from "@react-three/drei";
import { GradientDome, MetalStudio, SoftBox } from "./studio";
import { METAL_OPTIONS } from "./ring/config";
import * as THREE from "three";

/** The gem environment texture, read by the refraction shader. */
const EnvMapContext = createContext<THREE.Texture | null>(null);
/** The metal studio with neutral shadows, reflected by rose gold (see MetalStudio). */
const RoseEnvContext = createContext<THREE.Texture | null>(null);

/**
 * Black-and-white contrast reads as sparkle on a stone set in a ring; a grey
 * backdrop and softer lights keep large centre stones from blowing out white.
 */
function JewelleryStudio() {
  // Bright sweep with soft dark panels: diamonds show white, silver-grey and
  // near-black facets as in a photograph; the refraction adds the coloured fire.
  return (
    <>
      <GradientDome top="#e6e8ec" horizon="#d9dce2" bottom="#5a5f69" />
      <SoftBox position={[0, 8, 0]} scale={[14, 14]} intensity={1.7} />
      {/*
        The camera's own dark reflection, as in a real photograph: looking down on
        a stone, the table and star facets show near-black and grey, not a white glare.
      */}
      <SoftBox position={[0, 7, 0.6]} scale={[8, 8]} color="#14171c" intensity={1} dark />
      <SoftBox position={[0, 2, 8]} scale={[12, 6]} intensity={1.6} />
      <SoftBox position={[6, 3, 4]} scale={[3, 3]} intensity={1.4} color="#bcd4ff" />
      {[-0.9, -0.3, 0.3, 0.9].map((a, i) => (
        <SoftBox
          key={i}
          position={[Math.sin(a * 2.4) * 7, (i % 2 ? 1 : -1) * 1.5, Math.cos(a * 2.4) * 7]}
          scale={[1.8, 10]}
          color="#141820"
          intensity={1}
          dark
        />
      ))}
    </>
  );
}

/**
 * A loose stone seen close up, like a listing photo: a soft studio sweep from
 * white above to charcoal below, diffused softboxes and narrow dark flags, so
 * facets shade smoothly from bright white through silver to near-black.
 */
function LooseStoneStudio() {
  return (
    <>
      <GradientDome top="#f4f5f7" horizon="#8d939d" bottom="#23262c" />
      <SoftBox position={[0, 8, 0]} scale={[10, 10]} intensity={1.4} />
      <SoftBox position={[0, 3, 8]} scale={[10, 5]} intensity={1.1} />
      <SoftBox position={[-7, 3, 2]} scale={[3, 8]} intensity={1.1} />
      <SoftBox position={[7, 3, 2]} scale={[3, 8]} intensity={1.1} />
      <SoftBox position={[4, 2, -6]} scale={[2.5, 2.5]} intensity={1} color="#cfe0ff" />
      {/* The camera's own dark reflection, as in a real photo, so the table is not blown out. */}
      <SoftBox position={[0, 6.5, 1.2]} scale={[6, 6]} color="#1c1f24" intensity={1} dark />
      {[-1.2, -0.6, 0, 0.6, 1.2, 2.4].map((a, i) => (
        <SoftBox
          key={i}
          position={[Math.sin(a * 2) * 7, (i % 2 ? 1 : -1) * 1.2, Math.cos(a * 2) * 7]}
          scale={[1.2, 9]}
          color="#15181d"
          intensity={0.9}
          dark
        />
      ))}
    </>
  );
}

/**
 * Gems want a bright studio crossed by dark strips, which gives the classic
 * facet pattern. That differs from the metal lighting, so it is rendered into
 * an off-screen scene and handed to the gems once ready.
 */
export function GemEnvironmentProvider({
  children,
  variant = "jewellery",
}: {
  children: React.ReactNode;
  variant?: "jewellery" | "loose";
}) {
  const gemScene = useMemo(() => new THREE.Scene(), []);
  const roseScene = useMemo(() => new THREE.Scene(), []);
  const [envMap, setEnvMap] = useState<THREE.Texture | null>(null);
  const [roseEnv, setRoseEnv] = useState<THREE.Texture | null>(null);

  useFrame(() => {
    if (gemScene.environment && gemScene.environment !== envMap) setEnvMap(gemScene.environment);
    if (roseScene.environment && roseScene.environment !== roseEnv) setRoseEnv(roseScene.environment);
  });

  return (
    <>
      <Environment scene={gemScene} resolution={512} frames={1}>
        {variant === "loose" ? <LooseStoneStudio /> : <JewelleryStudio />}
      </Environment>
      <Environment scene={roseScene} resolution={512} frames={1}>
        <MetalStudio neutral />
      </Environment>
      <EnvMapContext.Provider value={envMap}>
        <RoseEnvContext.Provider value={roseEnv}>{children}</RoseEnvContext.Provider>
      </EnvMapContext.Provider>
    </>
  );
}

/** Polished precious metal: a fine, slightly soft mirror, as gold looks after hand finishing. */
/**
 * Rose gold goes without the glossy top coat: on a warm metal its colourless
 * reflections turn the highlights grey-pink and the metal looks plated.
 */
const UNCOATED = new Set(METAL_OPTIONS.filter((m) => m.id === "rose").map((m) => m.color));

const ROSE_ENV = 1.3;

export function MetalMaterial({ color }: { color: string }) {
  const rose = UNCOATED.has(color);
  const roseEnv = useContext(RoseEnvContext);
  return (
    <meshPhysicalMaterial
      // Rose gold reflects the neutral studio once it is ready; the rest use the scene's own.
      envMap={rose ? roseEnv : null}
      color={color}
      metalness={1}
      roughness={0.1}
      envMapIntensity={rose ? ROSE_ENV : 1.1}
      clearcoat={rose ? 0 : 0.5}
      clearcoatRoughness={0.04}
    />
  );
}

export function GemMaterial({ color, aberration = 0.012 }: { color: string; aberration?: number }) {
  const envMap = useContext(EnvMapContext);

  // Until the environment exists, a clear physical material stands in.
  if (!envMap) {
    return (
      <meshPhysicalMaterial
        color={color}
        transmission={1}
        thickness={0.6}
        roughness={0}
        ior={2.4}
        flatShading
      />
    );
  }

  return (
    <MeshRefractionMaterial
      envMap={envMap}
      color={color}
      bounces={4}
      ior={2.42}
      fresnel={1}
      aberrationStrength={aberration}
      fastChroma
      toneMapped={false}
    />
  );
}
