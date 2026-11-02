"use client";

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { Bounds } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "./Scene";
import { GemEnvironmentProvider } from "./materials";
import JewelryPiece, { PIECE_VIEW } from "./JewelryPiece";
import { getProduct } from "@/lib/catalog/products";

/** Fixed studio shot of one jewellery piece, for its product photo. */
export default function ProductScene({ slug, background = "#ffffff" }: { slug: string; background?: string }) {
  const product = getProduct(slug);
  if (!product) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background }}>
      <style>{"nextjs-portal { display: none !important; }"}</style>
      <Canvas
        dpr={2}
        camera={{ position: PIECE_VIEW[product.design.kind], fov: 30, near: 0.1, far: 80 }}
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
