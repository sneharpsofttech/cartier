"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import Scene, { HOME, type SceneHandle } from "./Scene";
import { BACKGROUNDS } from "./options";
import BuilderPanel from "./BuilderPanel";
import {
    GEM_OPTIONS,
  METAL_OPTIONS,
  fromSearchParams,
  toSearchParams,
  type RingConfig,
} from "./ring/config";
import { SHAPES } from "./ring/shapes";
import HandTryOn, { type HandTryOnHandle } from "./tryon/HandTryOn";
import { SKIN_TONES } from "./tryon/hands";
import {
  CameraIcon,
  ExpandIcon,
  FitIcon,
  HandIcon,
  MinusIcon,
  PlusIcon,
  ResetIcon,
  RotateIcon,
  SettingsIcon,
} from "./icons";
import { reviewUrl, stoneListUrl } from "@/lib/diamonds/ring";
import { type Stone } from "@/lib/diamonds/types";
import styles from "./RingViewer.module.css";

export type ProductInfo = {
  slug: string;
  name: string;
  stock: string;
  styleLabel: string;
  /** The setting's own design, which the builder starts from and resets to. */
  base: RingConfig;
};

type Props = {
  title?: string;
  /** The setting being viewed (the builder only opens on a setting's page). */
  product: ProductInfo;
  /** Optional GLB in /public. Without it the configurable procedural ring is shown. */
  modelUrl?: string;
};

const labelOf = (options: { id: string; label: string }[], id: string) =>
  options.find((o) => o.id === id)?.label;

export default function RingViewer({ title: titleProp, modelUrl, product }: Props) {
  const title = titleProp ?? `The ${product.name}`;
  const scene = useRef<SceneHandle>(null);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const hand = useRef<HandTryOnHandle>(null);

  // Start from the shared link, if any (the viewer only renders in the browser).
  const [config, setConfig] = useState<RingConfig>(() =>
    fromSearchParams(new URLSearchParams(window.location.search), { shapes: SHAPES.map((s) => s.id) }, product.base),
  );
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateSpeed, setRotateSpeed] = useState(1);
  const [shadow, setShadow] = useState(true);
  const [background, setBackground] = useState<string>(BACKGROUNDS[0].color);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ready, setReady] = useState(false);
  // Try-on view and skin tone also live in the URL (?view=hand&skin=brown).
  const [tryOn, setTryOn] = useState(
    () => new URLSearchParams(window.location.search).get("view") === "hand",
  );
  const [skin, setSkin] = useState(() => {
    const id = new URLSearchParams(window.location.search).get("skin");
    return SKIN_TONES.some((t) => t.id === id) ? id! : SKIN_TONES[0].id;
  });
  // Centre stone chosen in step 1 (stock number in the URL, details from the API).
  const [stoneId] = useState(() => new URLSearchParams(window.location.search).get("stone"));
  // Diamond type picked on the setting list (natural or lab-grown), used when choosing a stone next.
  const [diamondType] = useState(() => {
    const t = new URLSearchParams(window.location.search).get("diamond_type");
    return t === "natural" || t === "labgrown" ? t : null;
  });
  const [stone, setStone] = useState<Stone | null>(null);

  useEffect(() => {
    if (!stoneId) return;
    fetch(`/api/diamonds/${encodeURIComponent(stoneId)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then(setStone)
      .catch(() => setStone(null));
  }, [stoneId]);

  const updateConfig = useCallback(
    (patch: Partial<RingConfig>) => setConfig((c) => ({ ...c, ...patch })),
    [],
  );

  // The setting and its options (plus the stone): what steps 1 and 3 need.
  const ringParams = toSearchParams(config, product.base);
  ringParams.set("setting", product.slug);
  const settingOnly = ringParams.toString();
  const ringQuery = new URLSearchParams(settingOnly);
  if (stoneId) ringQuery.set("stone", stoneId);

  // Keep the URL in step so any build can be shared or bookmarked.
  useEffect(() => {
    const params = toSearchParams(config, product.base);
    if (stoneId) params.set("stone", stoneId);
    else if (diamondType) params.set("diamond_type", diamondType);
    if (tryOn) {
      params.set("view", "hand");
      if (skin !== SKIN_TONES[0].id) params.set("skin", skin);
    }
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [config, tryOn, skin, stoneId, diamondType, product.base]);

  const snapshot = async () => {
    const url = tryOn ? await hand.current?.snapshot() : canvas.current?.toDataURL("image/png");
    if (!url) return;
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "-")}${tryOn ? "-on-hand" : ""}.png`;
    a.click();
  };

  const fullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else root.current?.requestFullscreen();
  };

  return (
    <div className={styles.shell}>
      <div className={styles.layout}>
        <div
          ref={root}
          className={styles.viewer}
          style={{ background }}
          // A text selection elsewhere on the page would otherwise be dragged along when turning the ring.
          onPointerDownCapture={() => window.getSelection()?.removeAllRanges()}
          onDragStart={(e) => e.preventDefault()}
        >
          {tryOn ? (
            <HandTryOn
              ref={hand}
              config={config}
              modelUrl={modelUrl}
              skin={skin}
              onSkinChange={setSkin}
              autoRotate={autoRotate}
              rotateSpeed={rotateSpeed}
            />
          ) : (
            <Canvas
              ref={canvas}
              className={`${styles.canvas} ${ready ? styles.canvasReady : ""}`}
              dpr={[1, 2]}
              camera={{ position: HOME.position.toArray(), fov: 32, near: 0.1, far: 100 }}
              gl={{ antialias: true, preserveDrawingBuffer: true, toneMapping: THREE.ACESFilmicToneMapping }}
              onCreated={() => setReady(true)}
            >
              <color attach="background" args={[background]} />
              <Scene
                ref={scene}
                modelUrl={modelUrl}
                config={config}
                autoRotate={autoRotate}
                rotateSpeed={rotateSpeed}
                shadow={shadow}
              />
            </Canvas>
          )}

          <header className={styles.header}>
            <span className={styles.mark}>✦</span>
            <div>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.subtitle}>
                {labelOf(METAL_OPTIONS, config.headMetal)} · {labelOf(GEM_OPTIONS, config.centerGem)} centre
              </p>
            </div>
          </header>

          <nav className={styles.toolbar} aria-label="Viewer controls">
            <ToolButton label="Settings" active={settingsOpen} onClick={() => setSettingsOpen((v) => !v)}>
              <SettingsIcon />
            </ToolButton>
            <ToolButton
              label="Reset view"
              onClick={() => (tryOn ? hand.current?.reset() : scene.current?.reset())}
            >
              <ResetIcon />
            </ToolButton>
            <ToolButton
              label={
                autoRotate
                  ? tryOn
                    ? "Stop movement"
                    : "Stop rotation"
                  : tryOn
                    ? "Start movement"
                    : "Start rotation"
              }
              active={autoRotate}
              onClick={() => setAutoRotate((v) => !v)}
            >
              <RotateIcon />
            </ToolButton>
            {!tryOn && (
              <ToolButton label="Fit object" onClick={() => scene.current?.fit()}>
                <FitIcon />
              </ToolButton>
            )}
            <ToolButton
              label={tryOn ? "Back to 3D view" : "Hand try-on"}
              active={tryOn}
              onClick={() => {
                setSettingsOpen(false);
                setReady(false);
                setTryOn((v) => !v);
              }}
            >
              <HandIcon />
            </ToolButton>
            <ToolButton label="Fullscreen" onClick={fullscreen}>
              <ExpandIcon />
            </ToolButton>
            <ToolButton label="Snapshot" onClick={snapshot}>
              <CameraIcon />
            </ToolButton>
          </nav>

          {settingsOpen && (
            <div className={styles.settings}>
              <label className={styles.field}>
                <span>{tryOn ? "Movement speed" : "Rotation speed"}</span>
                <input
                  type="range"
                  min={0.2}
                  max={3}
                  step={0.1}
                  value={rotateSpeed}
                  onChange={(e) => setRotateSpeed(Number(e.target.value))}
                />
              </label>
              {!tryOn && (
                <>
                  <label className={styles.check}>
                    <input type="checkbox" checked={shadow} onChange={(e) => setShadow(e.target.checked)} />
                    <span>Floor shadow</span>
                  </label>
                  <div className={styles.field}>
                    <span>Background</span>
                    <div className={styles.bgRow}>
                      {BACKGROUNDS.map((b) => (
                        <button
                          key={b.id}
                          className={styles.bgChip}
                          data-active={background === b.color}
                          style={{ background: b.color }}
                          onClick={() => setBackground(b.color)}
                          title={b.label}
                          aria-label={b.label}
                        />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className={styles.zoom}>
            <ToolButton
              label="Zoom out"
              onClick={() => (tryOn ? hand.current?.zoom(-1) : scene.current?.zoom(-1))}
            >
              <MinusIcon />
            </ToolButton>
            <ToolButton
              label="Zoom in"
              onClick={() => (tryOn ? hand.current?.zoom(1) : scene.current?.zoom(1))}
            >
              <PlusIcon />
            </ToolButton>
          </div>

          {!tryOn && <p className={styles.hint}>Drag to rotate · Scroll to zoom</p>}
        </div>
        <BuilderPanel
          config={config}
          onChange={updateConfig}
          onReset={() => setConfig(product.base)}
        product={product}
          coloursOnly={Boolean(modelUrl)}
          stone={stone}
          stoneHref={stoneListUrl(
            settingOnly,
            stone ? { diamond_type: stone.type } : diamondType ? { diamond_type: diamondType } : {},
          )}
          reviewHref={reviewUrl(ringQuery.toString())}
        />
      </div>
    </div>
  );
}

function ToolButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button className={styles.tool} data-active={active} onClick={onClick} title={label} aria-label={label}>
      {children}
    </button>
  );
}
