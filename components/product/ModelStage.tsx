"use client";

import { Suspense, forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "@/components/viewer/Scene";
import { GemEnvironmentProvider } from "@/components/viewer/materials";
import styles from "./Product.module.css";

/** How long the turning waits after the shopper lets go. */
const RESUME_DELAY = 2500;
/** Turning speed in 360° mode (radians a second: a full turn in about 18 s). */
const SPIN_SPEED = 0.35;
const FOV = 30;

type View = "front" | "side" | "back" | "360";
const VIEWS: { id: View; label: string }[] = [
  { id: "front", label: "Front" },
  { id: "side", label: "Side" },
  { id: "back", label: "Back" },
  { id: "360", label: "360°" },
];

type StageHandle = { show: (view: View) => void; zoom: (direction: 1 | -1) => void };

/**
 * The scene: studio light, the piece, and an orbiting camera (drag to turn any
 * way, including over the top and underneath; scroll or pinch to zoom). Once the
 * piece is drawn it is framed from its front, and the camera can be sent to
 * the front, side or back, or set turning slowly on its own.
 */
const Stage = forwardRef<
  StageHandle,
  {
    front: readonly [number, number, number];
    spin: boolean;
    onReady: () => void;
    children: React.ReactNode;
    extra?: React.ReactNode;
  }
>(function Stage({ front, spin, onReady, children, extra }, ref) {
  const controls = useRef<CameraControls>(null);
  const piece = useRef<THREE.Group>(null);
  const frame = useRef<{ centre: THREE.Vector3; distance: number } | null>(null);
  const dragging = useRef(false);
  const resumeAt = useRef(0);
  const frames = useRef(0);
  const { camera } = useThree();
  // The front view's angles round the piece.
  const dir = new THREE.Vector3(...front).normalize();
  const azimuth = Math.atan2(dir.x, dir.z);
  const polar = Math.acos(THREE.MathUtils.clamp(dir.y, -1, 1));

  useImperativeHandle(ref, () => ({
    show(view) {
      const c = controls.current;
      const f = frame.current;
      if (!c || !f) return;
      resumeAt.current = performance.now() + 900;
      if (view === "360") return;
      // Side: square on from the right; back: round behind, at the front view's height.
      const az = azimuth + (view === "side" ? Math.PI / 2 : view === "back" ? Math.PI : 0);
      const pol = view === "side" ? Math.PI / 2 : polar;
      c.rotateTo(az, pol, true);
      c.dollyTo(f.distance, true);
    },
    zoom(direction) {
      const c = controls.current;
      if (c) c.dolly(direction * c.distance * 0.22, true);
    },
  }));

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
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
    if (!c) return;
    // Frame the piece once it has been drawn (its stones and claws are placed by then).
    if (!frame.current && piece.current && ++frames.current === 2) {
      const sphere = new THREE.Box3().setFromObject(piece.current).getBoundingSphere(new THREE.Sphere());
      const distance = (sphere.radius / Math.sin(THREE.MathUtils.degToRad(FOV / 2))) * 1.12;
      frame.current = { centre: sphere.center, distance };
      c.minDistance = distance * 0.3;
      c.maxDistance = distance * 2.4;
      const eye = sphere.center.clone().addScaledVector(dir, distance);
      c.setLookAt(eye.x, eye.y, eye.z, sphere.center.x, sphere.center.y, sphere.center.z, false);
      (camera as THREE.PerspectiveCamera).near = distance / 50;
      camera.updateProjectionMatrix();
      onReady();
    }
    if (!spin || dragging.current || performance.now() < resumeAt.current) return;
    // Capped, so a pause (e.g. while a shader compiles) does not jump the view round.
    c.rotate(Math.min(delta, 0.1) * SPIN_SPEED, 0, false);
  });

  return (
    <>
      <CameraControls
        ref={controls}
        makeDefault
        minPolarAngle={0.02}
        maxPolarAngle={Math.PI - 0.02}
        smoothTime={0.4}
        draggingSmoothTime={0.1}
        truckSpeed={0}
      />
      <StudioEnvironment />
      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          <group ref={piece}>{children}</group>
          {extra}
        </Suspense>
      </GemEnvironmentProvider>
    </>
  );
});

/**
 * A 3D product viewer: the piece in real 3D, turning slowly on its own until
 * the shopper takes over. Drag (or swipe) to turn it any way, scroll (or pinch)
 * or use + and − to zoom, and jump to the front, side or back. The product photo
 * shows, with a loading mark, until the model has been drawn.
 */
export default function ModelStage({
  front,
  poster,
  children,
  extra,
}: {
  /** The direction the front view looks from (the camera's position relative to the piece). */
  front: readonly [number, number, number];
  /** Product photo shown while the model loads. */
  poster?: string;
  /** The piece, framed by the camera. */
  children: React.ReactNode;
  /** Shown but left out of the framing (a pendant's chain). */
  extra?: React.ReactNode;
}) {
  const stage = useRef<StageHandle>(null);
  const [view, setView] = useState<View>("360");
  const [ready, setReady] = useState(false);

  const pick = (v: View) => {
    setView(v);
    stage.current?.show(v);
  };

  return (
    <div className={styles.modelStage}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className={styles.modelPoster} src={poster} alt="" data-hidden={ready} draggable={false} />
      )}
      {!ready && (
        <div className={styles.modelLoading} role="status">
          <span className={styles.modelSpinner} />
          Loading 3D view…
        </div>
      )}
      <Canvas
        className={styles.modelCanvas}
        data-ready={ready}
        dpr={[1, 2]}
        camera={{ position: [...front], fov: FOV, near: 0.05, far: 80 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        // A text selection elsewhere on the page would otherwise be dragged along when turning the piece.
        onPointerDownCapture={() => window.getSelection()?.removeAllRanges()}
        onDragStart={(e) => e.preventDefault()}
      >
        <color attach="background" args={["#f6f0e8"]} />
        <Stage ref={stage} front={front} spin={view === "360"} onReady={() => setReady(true)} extra={extra}>
          {children}
        </Stage>
      </Canvas>

      <div className={styles.modelZoom}>
        <button onClick={() => stage.current?.zoom(1)} aria-label="Zoom in">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 6v12M6 12h12" />
          </svg>
        </button>
        <button onClick={() => stage.current?.zoom(-1)} aria-label="Zoom out">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 12h12" />
          </svg>
        </button>
      </div>

      <div className={styles.modelViews} role="toolbar" aria-label="View">
        {VIEWS.map((v) => (
          <button key={v.id} onClick={() => pick(v.id)} aria-pressed={view === v.id}>
            {v.id === "360" && (
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 12a8 8 0 0 1 14.5-4.6M20 12a8 8 0 0 1-14.5 4.6M18.5 3v4.4h-4.4M5.5 21v-4.4h4.4" />
              </svg>
            )}
            {v.label}
          </button>
        ))}
      </div>
      <p className={styles.modelHint}>Drag to turn · scroll or pinch to zoom</p>
    </div>
  );
}
