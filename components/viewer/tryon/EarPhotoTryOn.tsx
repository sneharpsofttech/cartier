"use client";

import { Suspense, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "../Scene";
import { GemEnvironmentProvider } from "../materials";
import JewelryPiece from "../JewelryPiece";
import type { Product } from "@/lib/catalog/products";
import { EAR_PHOTOS, type EarPhoto } from "./earPhotos";
import styles from "./HandTryOn.module.css";

/** Turns a worn stud (out of the skin along +Y, hanging along +Z) to face out of the earlobe in a photo. */
function lobePose(yaw: number) {
  const y = THREE.MathUtils.degToRad(yaw);
  const out = new THREE.Vector3(Math.sin(y), -0.08, Math.cos(y)).normalize();
  const down = new THREE.Vector3(0, -1, 0);
  down.sub(out.clone().multiplyScalar(down.dot(out))).normalize();
  const side = new THREE.Vector3().crossVectors(out, down);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, out, down));
}

/**
 * The earring over one photo: an orthographic camera in the photo's pixels,
 * scaled as the photo is to fill the frame, so the earring lands on the lobe at
 * any size. Behind it, an invisible block of earlobe hides the post, from any side.
 */
function EarringOverlay({ photo, product }: { photo: EarPhoto; product: Props["product"] }) {
  const { size } = useThree();
  const pose = useMemo(() => lobePose(photo.yaw), [photo.yaw]);
  const zoom = Math.max(size.width / photo.width, size.height / photo.height);
  const [x, y] = photo.lobe;
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 500]} zoom={zoom} near={1} far={1000} />
      <StudioEnvironment />
      <ambientLight intensity={0.25} color="#ffe6d2" />
      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          <group position={[x - photo.width / 2, photo.height / 2 - y, 0]} quaternion={pose} scale={photo.scale}>
            <mesh position={[0, -1.02, 0]} renderOrder={-1}>
              <boxGeometry args={[3, 2, 3]} />
              <meshBasicMaterial colorWrite={false} />
            </mesh>
            <JewelryPiece product={product} ear />
          </group>
        </Suspense>
      </GemEnvironmentProvider>
    </>
  );
}

type Props = { product: Pick<Product, "design" | "metal" | "gem"> };

/** Earrings worn by a model, in photos from four sides, with the earring being viewed drawn on her ear. */
export default function EarPhotoTryOn({ product }: Props) {
  const [active, setActive] = useState(0);
  const photo = EAR_PHOTOS[active];
  return (
    <div className={styles.photoStage}>
      {EAR_PHOTOS.map((p, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={p.id}
          src={p.src}
          alt={i === active ? `Model wearing the earrings, ${p.label.toLowerCase()}` : ""}
          className={styles.photoImage}
          data-active={i === active}
          draggable={false}
        />
      ))}
      <Canvas
        className={styles.videoCanvas}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <EarringOverlay photo={photo} product={product} />
      </Canvas>
      <div className={styles.photoThumbs} role="tablist" aria-label="View">
        {EAR_PHOTOS.map((p, i) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={i === active}
            aria-label={p.label}
            title={p.label}
            data-active={i === active}
            onClick={() => setActive(i)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.src} alt="" draggable={false} />
          </button>
        ))}
      </div>
    </div>
  );
}
