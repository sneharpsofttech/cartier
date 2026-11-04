"use client";

import { Suspense, forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
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
import SkinPicker from "./SkinPicker";
import styles from "./HandTryOn.module.css";

/** The viewer's background; the forearm fades into it. */
const BACKDROP = "#f6f0e8";
/** How long auto-rotation waits after the user lets go. */
const RESUME_DELAY = 2500;
/** Smoothing passes over the scan: enough to iron out noise, few enough to keep knuckles and tendons. */
const HAND_SMOOTHING = 8;
const FOCUS = new THREE.Vector3(...HAND_MODEL.focus);
const HOME = FOCUS.clone().add(new THREE.Vector3(0, 1.5, 44));

export type HandTryOnHandle = {
  snapshot: () => Promise<string | null>;
  reset: () => void;
  zoom: (direction: 1 | -1) => void;
};

type Props = {
  config?: RingConfig;
  modelUrl?: string;
  /** Any ring-sized piece to wear instead of the configured ring (e.g. a jewellery-shop ring or band). */
  piece?: React.ReactNode;
  /** Where `piece` is worn: on the ring finger (default) or round the wrist (see HAND_MODEL.wrist). */
  wear?: "finger" | "wrist";
  skin: string;
  onSkinChange: (id: string) => void;
  autoRotate: boolean;
  rotateSpeed: number;
  /** Start with the skin-tone panel folded away (small viewers, where it would cover the hand). */
  compact?: boolean;
};

/**
 * Taubin smoothing: alternately pulls each vertex towards the average of its
 * neighbours and pushes it back a little further, which irons out the scan's
 * bumpy surface noise without shrinking the hand.
 */
function smoothScan(geometry: THREE.BufferGeometry, iterations: number) {
  const pos = geometry.getAttribute("position") as THREE.BufferAttribute;
  const index = geometry.getIndex()!.array;
  const count = pos.count;
  // Each vertex's neighbours, packed into one array (offsets[v] .. offsets[v + 1]).
  const degree = new Uint32Array(count);
  for (let i = 0; i < index.length; i++) degree[index[i]] += 2;
  const offsets = new Uint32Array(count + 1);
  for (let v = 0; v < count; v++) offsets[v + 1] = offsets[v] + degree[v];
  const neighbours = new Uint32Array(offsets[count]);
  const fill = offsets.slice(0, count);
  for (let i = 0; i < index.length; i += 3) {
    const [a, b, c] = [index[i], index[i + 1], index[i + 2]];
    neighbours[fill[a]++] = b;
    neighbours[fill[a]++] = c;
    neighbours[fill[b]++] = a;
    neighbours[fill[b]++] = c;
    neighbours[fill[c]++] = a;
    neighbours[fill[c]++] = b;
  }
  const p = pos.array as Float32Array;
  const next = new Float32Array(p.length);
  const pass = (factor: number) => {
    for (let v = 0; v < count; v++) {
      let x = 0;
      let y = 0;
      let z = 0;
      const start = offsets[v];
      const end = offsets[v + 1];
      for (let k = start; k < end; k++) {
        const n = neighbours[k] * 3;
        x += p[n];
        y += p[n + 1];
        z += p[n + 2];
      }
      const inv = 1 / Math.max(1, end - start);
      const o = v * 3;
      next[o] = p[o] + factor * (x * inv - p[o]);
      next[o + 1] = p[o + 1] + factor * (y * inv - p[o + 1]);
      next[o + 2] = p[o + 2] + factor * (z * inv - p[o + 2]);
    }
    p.set(next);
  };
  for (let i = 0; i < iterations; i++) {
    pass(0.5);
    pass(-0.53);
  }
  pos.needsUpdate = true;
  geometry.computeVertexNormals();
}

/** Stretches the forearm along its axis (see HAND_MODEL.arm) so it leaves the frame. */
function lengthenArm(geometry: THREE.BufferGeometry) {
  const { from, stretch } = HAND_MODEL.arm;
  const dir = new THREE.Vector3(...HAND_MODEL.arm.dir).normalize();
  const p = geometry.getAttribute("position").array as Float32Array;
  for (let o = 0; o < p.length; o += 3) {
    // How far past the plane, down the arm.
    const below = (p[o] - from[0]) * dir.x + (p[o + 1] - from[1]) * dir.y + (p[o + 2] - from[2]) * dir.z;
    if (below <= 0) continue;
    const k = below * (stretch - 1);
    p[o] += dir.x * k;
    p[o + 1] += dir.y * k;
    p[o + 2] += dir.z * k;
  }
}

function Hand({ skin, onReady }: { skin: string; onReady?: () => void }) {
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
    return createSkinMaterial(detailMap, {
      ...t,
      dorsal,
      palmar,
      backdrop: BACKDROP,
    });
  }, [detailMap, dorsal, palmar, t]);
  const geometry = useMemo(() => {
    const mesh = scene.getObjectByProperty("isMesh", true) as THREE.Mesh;
    const g = mesh.geometry.clone();
    // Nail mask, occlusion and curvature travel as COLOR_0; rename so they aren't applied as a tint.
    g.setAttribute("handData", g.getAttribute("color"));
    g.deleteAttribute("color");
    lengthenArm(g);
    smoothScan(g, HAND_SMOOTHING);
    return g;
  }, [scene]);

  useEffect(() => setSkin(skin), [setSkin, skin]);
  // Preparing the scan and its shader takes a while after it downloads; say once it has been drawn.
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 2) onReady?.();
  });

  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

/** Turns a bracelet (round +Y, across = X) to sit round the wrist. */
const WRIST_ROTATION = (() => {
  const axis = new THREE.Vector3(...HAND_MODEL.wrist.axis).normalize();
  const across = new THREE.Vector3(...HAND_MODEL.wrist.across);
  across.sub(axis.clone().multiplyScalar(across.dot(axis))).normalize();
  const through = new THREE.Vector3().crossVectors(across, axis);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, axis, through));
})();
/** The camera looks at the wrist for a bracelet, from a little closer. */
const WRIST_FOCUS = new THREE.Vector3(...HAND_MODEL.wrist.centre).lerp(FOCUS, 0.35);
const WRIST_HOME = WRIST_FOCUS.clone().add(new THREE.Vector3(6, 2, 34));

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
  {
    config?: RingConfig;
    modelUrl?: string;
    piece?: React.ReactNode;
    wear?: "finger" | "wrist";
    skin: string;
    autoRotate: boolean;
    rotateSpeed: number;
    onReady?: () => void;
  }
>(function HandScene({ config, modelUrl, piece, wear = "finger", skin, autoRotate, rotateSpeed, onReady }, ref) {
  const [home, focus] = wear === "wrist" ? [WRIST_HOME, WRIST_FOCUS] : [HOME, FOCUS];
  const controls = useRef<CameraControls>(null);
  const dragging = useRef(false);
  const resumeAt = useRef(0);
  const ringRotation = useRingOnFinger();

  useImperativeHandle(ref, () => ({
    reset() {
      resumeAt.current = performance.now() + 1200;
      controls.current?.setLookAt(...home.toArray(), ...focus.toArray(), true);
    },
    zoom(direction) {
      const c = controls.current;
      if (c) c.dolly(direction * c.distance * 0.22, true);
    },
  }));

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.setLookAt(...home.toArray(), ...focus.toArray(), false);
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
  }, [home, focus]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || !autoRotate || dragging.current || performance.now() < resumeAt.current) return;
    // Capped, so a pause (e.g. while a shader compiles) does not jump the view round.
    c.rotate(Math.min(delta, 0.1) * rotateSpeed * 0.4, 0, false);
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
      <hemisphereLight args={["#ffffff", "#a07f70", 0.14]} />
      {/* Key from above and to the side gives the knuckles and tendons their shape. */}
      <directionalLight
        position={[20, 18, 12]}
        intensity={4}
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
      <directionalLight position={[-10, 4, 20]} intensity={0.28} />
      {/* Rim from behind: a warm edge that lifts the fingers off the backdrop. */}
      <directionalLight position={[-16, 6, -14]} intensity={1.3} color="#ffe2d4" />

      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          <Hand skin={skin} onReady={onReady} />
          {wear === "wrist" ? (
            <group position={HAND_MODEL.wrist.centre} quaternion={WRIST_ROTATION}>
              {piece}
            </group>
          ) : (
            <group position={HAND_MODEL.ringSeat} quaternion={ringRotation} scale={HAND_MODEL.ringScale}>
              {piece ??
                (config &&
                  (modelUrl ? (
                    <GltfRing
                      url={modelUrl}
                      metal={metalColor(config.headMetal)}
                      gem={gemColor(config.centerGem)}
                      side={gemColor(config.accentGem)}
                    />
                  ) : (
                    <ConfigurableRing config={config} />
                  )))}
            </group>
          )}
        </Suspense>
      </GemEnvironmentProvider>
    </>
  );
});

const HandTryOn = forwardRef<HandTryOnHandle, Props>(function HandTryOn(
  { config, modelUrl, piece, wear, skin, onSkinChange, autoRotate, rotateSpeed, compact = false },
  ref,
) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const scene = useRef<SceneHandle>(null);
  const [pickerOpen, setPickerOpen] = useState(!compact);
  const tone = SKIN_TONES.find((t) => t.id === skin) ?? SKIN_TONES[0];
  const { active, progress } = useProgress();
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const loading = active || !ready;

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
        gl={{
          antialias: true,
          preserveDrawingBuffer: true,
          toneMapping: THREE.NeutralToneMapping,
        }}
      >
        <color attach="background" args={[BACKDROP]} />
        <HandScene
          ref={scene}
          config={config}
          modelUrl={modelUrl}
          piece={piece}
          wear={wear}
          skin={tone.color}
          autoRotate={autoRotate}
          rotateSpeed={rotateSpeed}
          onReady={onReady}
        />
      </Canvas>

      {loading && (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} />
          {active ? `Loading hand… ${Math.round(progress)}%` : "Preparing hand…"}
        </div>
      )}

      <SkinPicker tone={tone} onChange={onSkinChange} open={pickerOpen} onToggle={() => setPickerOpen((v) => !v)} />

      <a className={styles.credit} href={MODEL_CREDIT.url} target="_blank" rel="noreferrer">
        3D hand: {MODEL_CREDIT.name} (CC BY 4.0)
      </a>
    </div>
  );
});

export default HandTryOn;
