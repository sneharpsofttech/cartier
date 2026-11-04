"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "@/components/viewer/Scene";
import { GemEnvironmentProvider } from "@/components/viewer/materials";
import ConfigurableRing from "@/components/viewer/ring/ConfigurableRing";
import { getSetting, settingConfig } from "@/lib/settings/catalog";

/** Interactive 3D view of an engagement-ring setting in one metal: drag to turn, scroll to zoom. */
export default function SettingViewer({ slug, metal }: { slug: string; metal: string }) {
  const setting = getSetting(slug);
  if (!setting) return null;
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [3.3, 2.3, 5.6], fov: 30, near: 0.05, far: 80 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      // A text selection elsewhere on the page would otherwise be dragged along when turning the ring.
      onPointerDownCapture={() => window.getSelection()?.removeAllRanges()}
      onDragStart={(e) => e.preventDefault()}
    >
      <color attach="background" args={["#f6f0e8"]} />
      <StudioEnvironment />
      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          <Bounds fit clip margin={1.3}>
            <ConfigurableRing config={settingConfig(setting, metal)} />
          </Bounds>
        </Suspense>
      </GemEnvironmentProvider>
      <OrbitControls makeDefault autoRotate autoRotateSpeed={1.2} enablePan={false} minDistance={1} maxDistance={20} />
    </Canvas>
  );
}
