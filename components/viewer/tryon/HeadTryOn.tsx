"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { CameraControls, useProgress, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { StudioEnvironment } from "../Scene";
import { GemEnvironmentProvider, MetalMaterial } from "../materials";
import JewelryPiece, { pendantHangPoint } from "../JewelryPiece";
import { metalColor } from "../ring/config";
import type { Design, Product } from "@/lib/catalog/products";
import { HEAD_CREDIT, HEAD_MODEL } from "./heads";
import { useHeadGeometry } from "./headGeometry";
import Hair from "./Hair";
import { SKIN_TONES } from "./hands";
import SkinPicker from "./SkinPicker";
import styles from "./HandTryOn.module.css";

/** The viewer's background; the bottom of the bust fades into it. */
const BACKDROP = "#f6f0e8";
/** How long auto-rotation waits after the user lets go. */
const RESUME_DELAY = 2500;
/** How long the opening view holds before the head starts turning. */
const OPENING_HOLD = 5000;
/** Earrings or a necklace: what the camera looks at, and from where. */
type Wear = "ears" | "neck";
const VIEW = {
  // Close in from the side: the ear, its earring and the line of the jaw.
  ears: { focus: new THREE.Vector3(...HEAD_MODEL.focus.ears), offset: new THREE.Vector3(5.4, 0.35, 2.9) },
  // From the front and a little to one side, framing the neck and the top of the chest.
  neck: { focus: new THREE.Vector3(...HEAD_MODEL.focus.neck), offset: new THREE.Vector3(2.4, 0.9, 7.6) },
};
/** Thickness of a necklace chain (head units: 1 is about 4.8 cm). */
const CHAIN_RADIUS = 0.013;

type Props = {
  product: Pick<Product, "design" | "metal" | "gem">;
  skin: string;
  onSkinChange: (id: string) => void;
  /** Start with the skin-tone panel folded away (small viewers). */
  compact?: boolean;
};

/** A colour's components as shown on screen (THREE.Color stores linear values). */
function srgb(color: string) {
  const c = new THREE.Color(color).getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
  return new THREE.Vector3(c.r, c.g, c.b);
}

function Head({ skin, fade, onReady }: { skin: string; fade: readonly [number, number]; onReady: () => void }) {
  const geometry = useHeadGeometry();
  const [map, normalMap] = useTexture([HEAD_MODEL.color, HEAD_MODEL.normal]);
  const material = useMemo(() => {
    // (The scan's maps are stored the usual way up, unlike textures embedded in glTF files.)
    for (const t of [map, normalMap]) t.anisotropy = 8;
    map.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.MeshPhysicalMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.8, 0.8),
      roughness: 0.52,
      sheen: 0.3,
      sheenRoughness: 0.6,
      sheenColor: new THREE.Color("#ffb39b"),
      envMapIntensity: 0.3,
    });
    // Fade the cut-off bottom of the bust into the backdrop.
    m.onBeforeCompile = (shader) => {
      shader.uniforms.backdrop = { value: srgb(BACKDROP) };
      shader.uniforms.fadeStart = { value: fade[0] };
      shader.uniforms.fadeEnd = { value: fade[1] };
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vModelY;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvModelY = position.y;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          "#include <common>\nvarying float vModelY;\nuniform vec3 backdrop;\nuniform float fadeStart;\nuniform float fadeEnd;",
        )
        .replace(
          "#include <dithering_fragment>",
          "#include <dithering_fragment>\ngl_FragColor.rgb = mix(backdrop, gl_FragColor.rgb, smoothstep(fadeEnd, fadeStart, vModelY));",
        );
    };
    return m;
  }, [map, normalMap, fade]);

  // Re-tone the scan's skin: scale its average colour to the chosen tone.
  useEffect(() => {
    const tone = new THREE.Color(skin);
    const [r, g, b] = HEAD_MODEL.meanColor;
    material.color.setRGB(tone.r / r, tone.g / g, tone.b / b);
  }, [material, skin]);

  // Say once the head has been drawn (preparing its shader takes a moment).
  const frames = useRef(0);
  useFrame(() => {
    if (++frames.current === 2) onReady();
  });

  return <mesh geometry={geometry} material={material} castShadow receiveShadow />;
}

/** Turns a stud (out along +Y, length along +Z) to sit on each earlobe, hanging straight down. */
const LOBES = HEAD_MODEL.lobes.map(({ position, out }) => {
  const up = new THREE.Vector3(...out).normalize();
  const down = new THREE.Vector3(0, -1, 0);
  down.sub(up.clone().multiplyScalar(down.dot(up))).normalize();
  const side = new THREE.Vector3().crossVectors(up, down);
  return {
    position,
    quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, down)),
  };
});

/**
 * A pendant on its chain. The chain is draped on the scan: rays cast in towards
 * the neck from all round, along a loop that sits high at the back and low at
 * the front, find the skin, and the chain runs just outside it. The pendant
 * hangs from the front of the chain, lying against the chest.
 */
function Necklace({ product }: { product: Props["product"] }) {
  const geometry = useHeadGeometry();
  const design = product.design as Extract<Design, { kind: "pendant" }>;
  const metal = metalColor(product.metal);
  const { tube, hang, quaternion } = useMemo(() => {
    const mesh = new THREE.Mesh(geometry);
    const { back, front, axisZ } = HEAD_MODEL.chain;
    const ray = new THREE.Raycaster();
    const points: THREE.Vector3[] = [];
    const normals: THREE.Vector3[] = [];
    const steps = 120;
    for (let i = 0; i < steps; i++) {
      const a = (i / steps) * Math.PI * 2;
      const y = back + ((front - back) * (1 + Math.cos(a))) / 2;
      const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
      ray.set(new THREE.Vector3(0, y, axisZ).addScaledVector(dir, 10), dir.clone().negate());
      const hit = ray.intersectObject(mesh, false)[0];
      if (!hit?.face) continue;
      const n = hit.face.normal.clone();
      points.push(hit.point.clone().addScaledVector(n, CHAIN_RADIUS * 2));
      normals.push(n);
    }
    // Even out the scan's small bumps, as a chain would lie over them.
    for (let pass = 0; pass < 2; pass++) {
      const prev = points.map((p) => p.clone());
      prev.forEach((p, i) => {
        const a = prev[(i + prev.length - 1) % prev.length];
        const b = prev[(i + 1) % prev.length];
        points[i].copy(p).multiplyScalar(0.5).addScaledVector(a, 0.25).addScaledVector(b, 0.25);
      });
    }
    const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 480, CHAIN_RADIUS, 8, true);
    // The pendant faces out of the chest at the front of the chain, upright along it.
    const out = normals[0].clone();
    const up = new THREE.Vector3(0, 1, 0).addScaledVector(out, -out.y).normalize();
    const side = new THREE.Vector3().crossVectors(up, out);
    const quaternion = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, out));
    return { tube, hang: points[0], quaternion };
  }, [geometry]);
  const [hangY, hangZ] = pendantHangPoint(design);

  return (
    <>
      <mesh geometry={tube}>
        <MetalMaterial color={metal} />
      </mesh>
      <group position={hang} quaternion={quaternion} scale={HEAD_MODEL.jewelleryScale}>
        <group position={[0, -hangY, -hangZ]}>
          <JewelryPiece product={product} part="piece" />
        </group>
      </group>
    </>
  );
}

function HeadScene({
  product,
  wear,
  skin,
  onReady,
  revealed,
}: {
  product: Props["product"];
  wear: Wear;
  skin: string;
  onReady: () => void;
  /** The loading message has gone and the model is on show. */
  revealed: boolean;
}) {
  const { focus, offset } = VIEW[wear];
  const controls = useRef<CameraControls>(null);
  const dragging = useRef(false);
  // No turning until the model is on show; then hold the opening view (the
  // jewellery towards the camera) for a moment before turning.
  const resumeAt = useRef(Infinity);
  useEffect(() => {
    resumeAt.current = revealed ? performance.now() + OPENING_HOLD : Infinity;
  }, [revealed]);

  useEffect(() => {
    const c = controls.current;
    if (!c) return;
    c.setLookAt(...focus.clone().add(offset).toArray(), ...focus.toArray(), false);
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
  }, [focus, offset]);

  useFrame((_, delta) => {
    const c = controls.current;
    if (!c || dragging.current || performance.now() < resumeAt.current) return;
    // Capped, so a pause (e.g. while a shader compiles) does not jump the view round.
    c.rotate(Math.min(delta, 0.1) * 0.4, 0, false);
  });

  return (
    <>
      <CameraControls
        ref={controls}
        makeDefault
        minDistance={3}
        maxDistance={22}
        smoothTime={0.35}
        draggingSmoothTime={0.12}
      />
      <StudioEnvironment />
      <hemisphereLight args={["#ffffff", "#a07f70", 0.14]} />
      {/* Key from above and to the side models the face; a warm rim lifts the head off the backdrop. */}
      <directionalLight
        position={[12, 14, 10]}
        intensity={3.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      />
      <directionalLight position={[-8, 3, 12]} intensity={0.35} />
      <directionalLight position={[-10, 6, -12]} intensity={1.2} color="#ffe2d4" />

      <GemEnvironmentProvider>
        <Suspense fallback={null}>
          <Head skin={skin} fade={HEAD_MODEL.fade[wear]} onReady={onReady} />
          <Hair />
          {wear === "neck" ? (
            <Necklace product={product} />
          ) : (
            LOBES.map((lobe, i) => (
              <group key={i} position={lobe.position} quaternion={lobe.quaternion} scale={HEAD_MODEL.jewelleryScale}>
                <JewelryPiece product={product} ear />
              </group>
            ))
          )}
        </Suspense>
      </GemEnvironmentProvider>
    </>
  );
}

/**
 * Earrings or a pendant worn on a 3D head-and-shoulders scan: drag to turn it,
 * scroll to zoom, with a choice of skin tone.
 */
export default function HeadTryOn({ product, skin, onSkinChange, compact = false }: Props) {
  const wear: Wear = product.design.kind === "pendant" ? "neck" : "ears";
  const { focus, offset } = VIEW[wear];
  const [pickerOpen, setPickerOpen] = useState(!compact);
  const tone = SKIN_TONES.find((t) => t.id === skin) ?? SKIN_TONES[0];
  const { active, progress } = useProgress();
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <div className={styles.root}>
      <Canvas
        className={styles.canvas}
        dpr={[1, 2]}
        shadows="soft"
        camera={{ position: focus.clone().add(offset).toArray(), fov: 30, near: 0.1, far: 200 }}
        // Neutral tone mapping keeps skin colour true (filmic curves wash it out).
        gl={{ antialias: true, toneMapping: THREE.NeutralToneMapping }}
      >
        <color attach="background" args={[BACKDROP]} />
        <HeadScene product={product} wear={wear} skin={tone.color} onReady={onReady} revealed={ready && !active} />
      </Canvas>

      {(active || !ready) && (
        <div className={styles.loading} role="status">
          <span className={styles.spinner} />
          {active ? `Loading model… ${Math.round(progress)}%` : "Preparing model…"}
        </div>
      )}

      <SkinPicker tone={tone} onChange={onSkinChange} open={pickerOpen} onToggle={() => setPickerOpen((v) => !v)} />

      <a className={styles.credit} href={HEAD_CREDIT.url} target="_blank" rel="noreferrer">
        3D head: {HEAD_CREDIT.name} (CC BY 3.0)
      </a>
    </div>
  );
}
