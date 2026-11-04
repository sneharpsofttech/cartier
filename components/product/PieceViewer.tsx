"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "@/components/viewer/Scene";
import { GemEnvironmentProvider } from "@/components/viewer/materials";
import JewelryPiece, { PIECE_VIEW } from "@/components/viewer/JewelryPiece";
import { getProduct } from "@/lib/catalog/products";

/** Interactive 3D view of a jewellery piece: drag to turn, scroll to zoom. */
export default function PieceViewer({ slug }: { slug: string }) {
  const product = getProduct(slug);
  if (!product) return null;
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: PIECE_VIEW[product.design.kind], fov: 30, near: 0.05, far: 80 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      // A text selection elsewhere on the page would otherwise be dragged along when turning the piece.
      onPointerDownCapture={() => window.getSelection()?.removeAllRanges()}
      onDragStart={(e) => e.preventDefault()}
    >
      <color attach="background" args={["#f6f0e8"]} />
      <StudioEnvironment />
      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          <Bounds fit clip margin={1.3}>
            <JewelryPiece product={product} part="piece" />
          </Bounds>
          <JewelryPiece product={product} part="chain" />
        </Suspense>
      </GemEnvironmentProvider>
      <OrbitControls makeDefault autoRotate autoRotateSpeed={1.2} enablePan={false} minDistance={1} maxDistance={20} />
    </Canvas>
  );
}
