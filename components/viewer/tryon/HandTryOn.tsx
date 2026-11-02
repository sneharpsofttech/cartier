"use client";

import { Suspense, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, useGLTF, useProgress, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "../Scene";
import { GemEnvironmentProvider } from "../materials";
import ConfigurableRing from "../ring/ConfigurableRing";
import GltfRing from "../GltfRing";
import { gemColor, metalColor, type RingConfig } from "../ring/config";
import { HAND_MODEL, MODEL_CREDIT, SKIN_TONES } from "./hands";
import { createSkinMaterial } from "./skinMaterial";
import styles from "./HandTryOn.module.css";

/** How long auto-rotation waits after the user lets go. */
const RESUME_DELAY = 2500;
const FOCUS = new THREE.Vector3(...HAND_MODEL.focus);
const HOME = FOCUS.clone().add(new THREE.Vector3(0, 1.5, 44));

export type HandTryOnHandle = {
  snapshot: () => Promise<string | null>;
  reset: () => void;
  zoom: (direction: 1 | -1) => void;
};

type Props = {
  config: RingConfig;
  modelUrl?: string;
  skin: string;
  onSkinChange: (id: string) => void;
  autoRotate: boolean;
  rotateSpeed: number;
};

function Hand({ skin }: { skin: string }) {
  const { scene } = useGLTF(HAND_MODEL.url);
  const { skinTextures: t } = HAND_MODEL;
  const [detailMap, dorsal, palmar] = useTexture([HAND_MODEL.skinDetail, t.dorsal, t.palmar]);
  const { material, setSkin } = useMemo(() => {
    detailMap.wrapS = detailMap.wrapT = THREE.RepeatWrapping;
    detailMap.colorSpace = THREE.NoColorSpace; // data, not colour
    detailMap.anisotropy = 8;
    for (const map of [dorsal, palmar]) {
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = 8;
    }
    return createSkinMaterial(detailMap, { ...t, dorsal, palmar });
  }, [detailMap, dorsal, palmar, t]);
  const geometry = useMemo(() => {
    const mesh = scene.getObjectByProperty("isMesh", true) as THREE.Mesh;
    const g = mesh.geometry.clone();
    // Nail mask, occlusion and curvature travel as COLOR_0; rename so they aren't applied as a tint.
    g.setAttribute("handData", g.getAttribute("color"));
    g.deleteAttribute("color");
    return g;
  }, [scene]);

  useEffect(() => setSkin(skin), [setSkin, skin]);

  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

/** Puts the ring on the ring finger: band around the finger, head on the back of the hand. */
function useRingOnFinger() {
  return useMemo(() => {
    const along = new THREE.Vector3(...HAND_MODEL.ringAxis).normalize();
    const up = new THREE.Vector3(0, 0, 1);
    up.sub(along.clone().multiplyScalar(up.dot(along))).normalize();
    const side = new THREE.Vector3().crossVectors(up, along);
    // Ring local axes: X across, Y towards the head, Z through the hole.
    return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, along));
  }, []);
}

type SceneHandle = { reset: () => void; zoom: (direction: 1 | -1) => void };

const HandScene = forwardRef<
  SceneHandle,
  { config: RingConfig; modelUrl?: string; skin: string; autoRotate: boolean; rotateSpeed: number }
>(function HandScene({ config, modelUrl, skin, autoRotate, rotateSpeed }, ref) {
  const controls = useRef<CameraControls>(null);
  const dragging = useRef(false);
  const resumeAt = useRef(0);
  const ringRotation = useRingOnFinger();

  useImperativeHandle(ref, () => ({
    reset() {
      resumeAt.current = performance.now() + 1200;
      controls.current?.setLookAt(...HOME.toArray(), ...FOCUS.toArray(), true);
    },
    zoom(direction) {
      const c = controls.current;
      if (c) c.dolly(direction * c.distance * 0.22, true);
    },
  }));

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.setLookAt(...HOME.toArray(), ...FOCUS.toArray(), false);
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
    c.rotate(delta * rotateSpeed * 0.4, 0, false);
  });

  return (
    <>
      <CameraControls
        ref={controls}
        makeDefault
        minDistance={7}
        maxDistance={55}
        smoothTime={0.35}
        draggingSmoothTime={0.12}
      />

      <StudioEnvironment />
      {/* Soft key and fill so skin reads warm and three-dimensional. */}
      <hemisphereLight args={["#ffffff", "#c4a597", 0.3]} />
      {/* Key from above and to the side gives the knuckles and tendons their shape. */}
      <directionalLight
        position={[20, 18, 12]}
        intensity={2.8}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.04}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={16}
        shadow-camera-bottom={-16}
        shadow-camera-near={1}
        shadow-camera-far={90}
      />
      <directionalLight position={[-10, 4, 20]} intensity={0.45} />
      <directionalLight position={[-16, 6, -14]} intensity={0.9} color="#ffe2d4" />

      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          <Hand skin={skin} />
          <group quaternion={ringRotation}>
            {modelUrl ? (
              <GltfRing
                url={modelUrl}
                metal={metalColor(config.headMetal)}
                gem={gemColor(config.centerGem)}
                side={gemColor(config.accentGem)}
              />
            ) : (
              <ConfigurableRing config={config} />
            )}
          </group>
        </Suspense>
      </GemEnvironmentProvider>
    </>
  );
});

const HandTryOn = forwardRef<HandTryOnHandle, Props>(function HandTryOn(
  { config, modelUrl, skin, onSkinChange, autoRotate, rotateSpeed },
  ref,
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<SceneHandle>(null);
  const [pickerOpen, setPickerOpen] = useState(true);
  const tone = SKIN_TONES.find((t) => t.id === skin) ?? SKIN_TONES[0];
  const { active: loading, progress } = useProgress();

  useImperativeHandle(ref, () => ({
    reset: () => scene.current?.reset(),
    zoom: (direction) => scene.current?.zoom(direction),
    snapshot: async () => canvas.current?.toDataURL("image/png") ?? null,
  }));

  return (
    <div className={styles.root}>
      <Canvas
        ref={canvas}
        className={styles.canvas}
        dpr={[1, 2]}
        shadows="soft"
        camera={{ position: HOME.toArray(), fov: 30, near: 0.5, far: 400 }}
        // Neutral tone mapping keeps skin colour true (filmic curves wash it out).
        gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.NeutralToneMapping }}
      >
        <color attach="background" args={["#f6f0e8"]} />
        <HandScene
          ref={scene}
          config={config}
          modelUrl={modelUrl}
          skin={tone.color}
          autoRotate={autoRotate}
          rotateSpeed={rotateSpeed}
        />
      </Canvas>

      {loading && (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} />
          Loading hand… {Math.round(progress)}%
        </div>
      )}

      <div className={styles.skinDock}>
        {pickerOpen && (
          <div className={styles.skinPanel} role="radiogroup" aria-label="Skin tone">
            <span className={styles.skinTitle}>Skin</span>
            <div className={styles.skinGrid}>
              {SKIN_TONES.map((t) => (
                <button
                  key={t.id}
                  role="radio"
                  aria-checked={t.id === tone.id}
                  aria-label={t.label}
                  title={t.label}
                  className={styles.skinThumb}
                  data-active={t.id === tone.id}
                  style={{ "--skin": t.color } as React.CSSProperties}
                  onClick={() => onSkinChange(t.id)}
                >
                  <HandGlyph />
                </button>
              ))}
            </div>
          </div>
        )}
        <button
          className={styles.skinToggle}
          onClick={() => setPickerOpen((v) => !v)}
          aria-expanded={pickerOpen}
          aria-label="Choose skin tone"
        >
          <span className={styles.skinThumb} style={{ "--skin": tone.color } as React.CSSProperties}>
            <HandGlyph />
          </span>
          <svg
            viewBox="0 0 24 24"
            width="14"
            height="14"
            data-open={pickerOpen}
            className={styles.caret}
            aria-hidden
          >
            <path d="m6 15 6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <a className={styles.credit} href={MODEL_CREDIT.url} target="_blank" rel="noreferrer">
        3D hand: {MODEL_CREDIT.name} (CC BY 4.0)
      </a>
    </div>
  );
});

/** Raised hand silhouette, filled with the tone via --skin. */
function HandGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden className={styles.handGlyph}>
      <path d="M9 21c-2.6-1.3-4.6-3.9-5.4-6.8l-.5-1.9c-.2-.8.3-1.5 1.1-1.6.6-.1 1.2.2 1.4.8L6.8 14V5.6c0-.8.6-1.4 1.3-1.4.8 0 1.4.6 1.4 1.4V11V3.4c0-.8.6-1.4 1.3-1.4.8 0 1.4.6 1.4 1.4V11V4.4c0-.8.6-1.4 1.3-1.4.8 0 1.4.6 1.4 1.4V11.4V7c0-.8.6-1.4 1.3-1.4.8 0 1.4.6 1.4 1.4v7.4c0 3.6-2.4 6.6-5.7 7.4" />
    </svg>
  );
}

export default HandTryOn;
