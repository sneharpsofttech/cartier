"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "./Scene";
import { GemEnvironmentProvider } from "./materials";
import ConfigurableRing, { BAND_AS_SHANK } from "./ring/ConfigurableRing";
import Shank from "./ring/Shank";
import { DEFAULT_CONFIG, gemColor, metalColor, type BandStyle, type ShankStyle } from "./ring/config";
import { getSetting, settingConfig } from "@/lib/settings/catalog";

/** Shank thumbnails show a small round solitaire head so the style reads as a ring. */
const SHANK_CONFIG = {
  ...DEFAULT_CONFIG,
  head: "prong" as const,
  shape: "round" as const,
  carat: 0.75,
  centerGem: "diamond",
  accentGem: "diamond",
  headMetal: "white",
  shankMetal: "white",
  band: "none" as const,
};

export default function ThumbnailScene({
  kind,
  style,
  metal = "yellow",
  background = "#ffffff",
}: {
  kind: "shank" | "band" | "setting";
  style: string;
  metal?: string;
  /** Backdrop colour; the dark one is used for the home page's hero shots. */
  background?: string;
}) {
  const isBand = kind === "band";
  const setting = kind === "setting" ? getSetting(style) : null;
  // Band thumbnails: side-on, slightly from above, looking at the band's top
  // surface. Shank thumbnails: close in, three-quarters from the front, so both shoulders
  // show either side of the head, where side stones and splits differ. Product
  // photos: from above and in front, nearly overhead: the centre stone faces the
  // camera and the band flattens to a thin oval behind it.
  const camera = isBand
    ? { position: [3.9, 1.9, 1.5] as const, target: [0, 0, 0] }
    : setting
      ? { position: [0, 6.95, 1.1] as const, target: [0, 0.6, 0] }
      : { position: [1.35, 2.55, 3.35] as const, target: [0, 0.6, 0] };

  return (
    <div style={{ position: "fixed", inset: 0, background }}>
      {/* Keep the dev-mode badge out of the screenshots. */}
      <style>{"nextjs-portal { display: none !important; }"}</style>
      <Canvas
        dpr={2}
        camera={{ position: [...camera.position], fov: 30, near: 0.1, far: 50 }}
        // Rose settings keep the builder's tone mapping: the neutral one pushes rose gold towards coral.
        gl={{
          antialias: true,
          toneMapping: setting && metal !== "rose" ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping,
        }}
        onCreated={({ camera: cam }) => cam.lookAt(...(camera.target as [number, number, number]))}
      >
        <color attach="background" args={[background]} />
        <StudioEnvironment />
        <GemEnvironmentProvider>
          <Suspense fallback={null}>
            {setting ? (
              <>
                <ConfigurableRing config={settingConfig(setting, metal)} />
                {/* A soft shadow under the ring, as on a photographer's table. */}
                <ContactShadows position={[0, -1.12, 0]} scale={4} blur={2.6} opacity={0.32} far={1.6} />
              </>
            ) : isBand ? (
              <Shank
                style={BAND_AS_SHANK[style as Exclude<BandStyle, "none">] ?? "solitaire"}
                eternity
                metal={metalColor("white")}
                accent={gemColor("diamond")}
              />
            ) : (
              <ConfigurableRing config={{ ...SHANK_CONFIG, shank: style as ShankStyle }} />
            )}
          </Suspense>
        </GemEnvironmentProvider>
      </Canvas>
    </div>
  );
}
