"use client";

import { Suspense, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrthographicCamera } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "../Scene";
import { GemEnvironmentProvider } from "../materials";
import ConfigurableRing from "../ring/ConfigurableRing";
import GltfRing from "../GltfRing";
import { gemColor, metalColor, type RingConfig } from "../ring/config";
import { HAND_VIDEO, type VideoFrame } from "./hands";
import type { HandTryOnHandle } from "./HandTryOn";
import styles from "./HandTryOn.module.css";

/** Pixels of drag per frame. */
const DRAG_STEP = 9;
/** Time per frame while the hand turns on its own. */
const PLAY_STEP = 70;
/** How long the turning waits after the user lets go. */
const RESUME_DELAY = 2500;
/** The ring's inner radius in its own units. */
const RING_INNER = 0.925;

/** The ring's local axes (X across, Y towards the head, Z through the hole) for one frame's finger. */
function framePose({ lean, yaw, pitch }: VideoFrame) {
  const l = THREE.MathUtils.degToRad(lean);
  const p = THREE.MathUtils.degToRad(pitch);
  const y = THREE.MathUtils.degToRad(yaw);
  // Up the finger: leaning right by `lean`, the tip tipped away from the camera by `pitch`.
  const along = new THREE.Vector3(Math.sin(l) * Math.cos(p), Math.cos(l) * Math.cos(p), -Math.sin(p));
  // The head starts out facing the camera and turns about the finger towards the right.
  const toCamera = new THREE.Vector3(0, 0, 1);
  toCamera.sub(along.clone().multiplyScalar(toCamera.dot(along))).normalize();
  const right = new THREE.Vector3().crossVectors(along, toCamera);
  const up = toCamera.multiplyScalar(Math.cos(y)).addScaledVector(right, Math.sin(y));
  const side = new THREE.Vector3().crossVectors(up, along);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, along));
}

/** The ring over one frame: an orthographic camera in the frame's pixels, so it lands on the finger at any size. */
function RingOverlay({ frame, config, modelUrl }: { frame: VideoFrame; config: RingConfig; modelUrl?: string }) {
  const { size } = useThree();
  const pose = useMemo(() => framePose(frame), [frame]);
  const { width, height } = HAND_VIDEO;
  const visible = frame.x !== null && frame.y !== null;
  return (
    <>
      <OrthographicCamera makeDefault position={[0, 0, 500]} zoom={size.width / width} near={1} far={1000} />
      <StudioEnvironment />
      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          <group
            visible={visible}
            position={[(frame.x ?? 0) - width / 2, height / 2 - (frame.y ?? 0), 0]}
            quaternion={pose}
            scale={frame.r / RING_INNER}
          >
            {/* The finger: invisible, but it hides the back of the band and, palm up, the head. */}
            <mesh rotation={[Math.PI / 2, 0, 0]} renderOrder={-1}>
              <cylinderGeometry args={[0.9, 0.9, 12, 48]} />
              <meshBasicMaterial colorWrite={false} />
            </mesh>
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
}

const frameSrc = (i: number) => `/tryon/hand/${i}.webp`;

/**
 * Hand try-on from a video of a real hand turning from its back to its palm
 * and back, with the ring being designed drawn onto its ring finger in every
 * frame. It turns on its own; drag sideways to turn it by hand.
 */
const HandVideo = forwardRef<
  HandTryOnHandle,
  { config: RingConfig; modelUrl?: string; autoRotate: boolean; rotateSpeed: number }
>(function HandVideo({ config, modelUrl, autoRotate, rotateSpeed }, ref) {
  const { frames } = HAND_VIDEO;
  const [index, setIndex] = useState(frames.length - 1);
  const direction = useRef(-1);
  const drag = useRef<{ x: number; start: number } | null>(null);
  const resumeAt = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const images = useRef<(HTMLImageElement | null)[]>([]);

  // Play through the turn and back again.
  useEffect(() => {
    if (!autoRotate) return;
    const timer = window.setInterval(
      () => {
        if (drag.current || performance.now() < resumeAt.current) return;
        setIndex((i) => {
          if (i + direction.current < 0 || i + direction.current >= frames.length) direction.current *= -1;
          return i + direction.current;
        });
      },
      PLAY_STEP / Math.max(0.25, rotateSpeed),
    );
    return () => window.clearInterval(timer);
  }, [autoRotate, rotateSpeed, frames.length]);

  useImperativeHandle(ref, () => ({
    reset: () => {
      setIndex(frames.length - 1);
      resumeAt.current = performance.now() + RESUME_DELAY;
    },
    zoom: () => {},
    // The frame and the ring, flattened into one picture.
    async snapshot() {
      const img = images.current[index];
      if (!img || !canvas.current) return null;
      const out = document.createElement("canvas");
      out.width = HAND_VIDEO.width;
      out.height = HAND_VIDEO.height;
      const ctx = out.getContext("2d")!;
      ctx.drawImage(img, 0, 0, out.width, out.height);
      ctx.drawImage(canvas.current, 0, 0, out.width, out.height);
      return out.toDataURL("image/png");
    },
  }));

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, start: index };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const steps = Math.round((drag.current.x - e.clientX) / DRAG_STEP);
    setIndex(THREE.MathUtils.clamp(drag.current.start + steps, 0, frames.length - 1));
  };
  const onPointerUp = () => {
    drag.current = null;
    resumeAt.current = performance.now() + RESUME_DELAY;
  };

  return (
    <div className={styles.videoStage}>
      <div
        className={styles.videoFrame}
        style={{ aspectRatio: `${HAND_VIDEO.width} / ${HAND_VIDEO.height}` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {/* Every frame is loaded up front and only the current one shown, so turning never flickers. */}
        {frames.map((_, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            ref={(el) => {
              images.current[i] = el;
            }}
            src={frameSrc(i)}
            alt={i === index ? "A hand wearing your ring" : ""}
            className={styles.videoPhoto}
            data-active={i === index}
            draggable={false}
          />
        ))}
        <Canvas
          ref={canvas}
          className={styles.videoCanvas}
          dpr={[1, 2]}
          gl={{ alpha: true, antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
        >
          <RingOverlay frame={frames[index]} config={config} modelUrl={modelUrl} />
        </Canvas>
      </div>
      <p className={styles.videoHint}>Drag to turn the hand</p>
    </div>
  );
});

export default HandVideo;
