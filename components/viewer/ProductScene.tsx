"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "./Scene";
import { GemEnvironmentProvider } from "./materials";
import JewelryPiece, { PIECE_EXTRA_VIEWS, PIECE_VIEW } from "./JewelryPiece";
import { getProduct } from "@/lib/catalog/products";

/** Fixed studio shot of one jewellery piece, for its product photos: view 1 is the main one, 2 to 4 the extra angles. */
export default function ProductScene({
  slug,
  background = "#ffffff",
  view = 1,
}: {
  slug: string;
  background?: string;
  view?: number;
}) {
  const product = getProduct(slug);
  if (!product) return null;
  const position = PIECE_EXTRA_VIEWS[product.design.kind][view - 2] ?? PIECE_VIEW[product.design.kind];
  return (
    <div style={{ position: "fixed", inset: 0, background }}>
      <style>{"nextjs-portal { display: none !important; }"}</style>
      <Canvas
        dpr={2}
        camera={{ position, fov: 30, near: 0.1, far: 80 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={[background]} />
        <StudioEnvironment />
        <GemEnvironmentProvider>
          <Suspense fallback={null}>
            {/* The chain is left out of the fit, so the pendant fills the frame. */}
            <Bounds fit clip margin={1.15} maxDuration={0.01}>
              <JewelryPiece product={product} part="piece" />
            </Bounds>
            <JewelryPiece product={product} part="chain" />
          </Suspense>
        </GemEnvironmentProvider>
      </Canvas>
    </div>
  );
}
