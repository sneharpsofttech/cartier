"use client";

import { useMemo } from "react";
import * as THREE from "three";
import Head from "./ring/Head";
import Shank from "./ring/Shank";
import ConfigurableRing from "./ring/ConfigurableRing";
import { InstancedGems, InstancedMetal, UNIT_SPHERE, BAND_TOP } from "./ring/parts";
import { DEFAULT_CONFIG, gemColor, metalColor, type HeadType } from "./ring/config";
import { areaFactor, createCutGeometry, pavilionDepth, shapeById, type ShapeId } from "./ring/shapes";
import { MetalMaterial } from "./materials";
import type { Design, Product } from "@/lib/catalog/products";

const ONE_CARAT_RADIUS = 0.37;
const ROUND = createCutGeometry(shapeById("round"));
/** Round, slightly tapered cup under each bracelet stone; curved sides keep the metal bright. */
const CUP = new THREE.CylinderGeometry(1, 0.78, 1, 28);

/** Matches Head's own sizing, so a stone can be centred on the origin. */
function stoneLayout(shape: ShapeId, carat: number, head: HeadType) {
  const def = shapeById(shape);
  const width = (ONE_CARAT_RADIUS * Math.cbrt(carat)) / Math.sqrt(areaFactor(def));
  const girdleY = BAND_TOP + pavilionDepth(def) * width + 0.06 + (head === "hiddenHalo" ? 0.05 : 0);
  const halo = head === "halo" ? 0.11 : head === "doubleHalo" ? 0.22 : 0;
  return { width, girdleY, extent: width * 1.2 + halo };
}

type StoneProps = {
  shape: ShapeId;
  carat: number;
  head: HeadType;
  metal: string;
  gem: string;
};

/** One set stone, turned so its table faces the camera, with an earring post behind. */
function FacingStone({ shape, carat, head, metal, gem, post }: StoneProps & { post?: boolean }) {
  const { girdleY } = stoneLayout(shape, carat, head);
  return (
    // Head grows along +y; tip it towards the camera (+z), a little from above.
    // Hearts are then turned in the picture plane so the point hangs down.
    <group rotation={[0, 0, shape === "heart" ? Math.PI : 0]}>
      <group rotation={[1.32, 0, 0]}>
        <group position={[0, -girdleY, 0]}>
          <Head
            shape={shape}
            carat={carat}
            type={head}
            metal={metal}
            gem={gem}
            accent={gemColor("diamond")}
            shoulders={false}
          />
          {post && (
            <mesh position={[0, BAND_TOP - 0.3, 0]}>
              <cylinderGeometry args={[0.022, 0.022, 0.55, 12]} />
              <MetalMaterial color={metal} />
            </mesh>
          )}
        </group>
      </group>
    </group>
  );
}

function Studs(props: StoneProps) {
  const { extent } = stoneLayout(props.shape, props.carat, props.head);
  const gap = extent + 0.14;
  return (
    <group>
      <group position={[-gap, 0, 0]}>
        <FacingStone {...props} post />
      </group>
      <group position={[gap, 0, 0]} rotation={[0, -0.35, 0]}>
        <FacingStone {...props} post />
      </group>
    </group>
  );
}

/** The chain hanging from a pendant's bail. */
function PendantChain({ top, metal }: { top: number; metal: string }) {
  const chain = useMemo(() => {
    const side = (s: number) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, top + 0.16, 0),
          new THREE.Vector3(s * 0.35, top + 0.75, -0.05),
          new THREE.Vector3(s * 0.95, top + 2.1, -0.2),
          new THREE.Vector3(s * 1.45, top + 4.2, -0.4),
        ]),
        96,
        0.016,
        8,
        false,
      );
    return [side(-1), side(1)];
  }, [top]);
  return (
    <>
      {chain.map((g, i) => (
        <mesh key={i} geometry={g}>
          <MetalMaterial color={metal} />
        </mesh>
      ))}
    </>
  );
}

const pendantTop = (p: StoneProps) => stoneLayout(p.shape, p.carat, p.head).extent + 0.02;

function Pendant({ chain = true, ...props }: StoneProps & { chain?: boolean }) {
  const top = pendantTop(props);
  return (
    <group>
      <FacingStone {...props} />
      {/* Bail: the loop the chain runs through. */}
      <mesh position={[0, top + 0.1, 0]} rotation={[0, Math.PI / 2, 0]}>
        <torusGeometry args={[0.075, 0.022, 12, 32]} />
        <MetalMaterial color={props.metal} />
      </mesh>
      {chain && <PendantChain top={top} metal={props.metal} />}
    </group>
  );
}

/** A tennis bracelet lying in an oval: a line of stones in round cups with four prongs each. */
function TennisBracelet({
  stone,
  metal,
  gem,
  alternate,
}: {
  stone: number;
  metal: string;
  gem: string;
  alternate?: string;
}) {
  const layout = useMemo(() => {
    const a = 1.9;
    const b = 1.45;
    // Even spacing along the ellipse by arc length.
    const curve = new THREE.EllipseCurve(0, 0, a, b, 0, Math.PI * 2, false, 0);
    const count = Math.floor(curve.getLength() / (stone * 2.3));
    const gems: THREE.Matrix4[][] = [[], []];
    const cups: THREE.Matrix4[] = [];
    const prongs: THREE.Matrix4[] = [];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < count; i++) {
      const t = i / count;
      const p2 = curve.getPointAt(t);
      const d2 = curve.getTangentAt(t);
      const p = new THREE.Vector3(p2.x, 0, p2.y);
      const angle = Math.atan2(-d2.y, d2.x);
      const q = new THREE.Quaternion().setFromAxisAngle(up, angle);
      gems[alternate && i % 2 ? 1 : 0].push(
        new THREE.Matrix4().compose(
          p.clone().add(new THREE.Vector3(0, stone * 0.2, 0)),
          q,
          new THREE.Vector3(stone, stone, stone),
        ),
      );
      cups.push(
        new THREE.Matrix4().compose(
          p.clone().add(new THREE.Vector3(0, -stone * 0.6, 0)),
          q,
          new THREE.Vector3(stone * 1.12, stone * 1.1, stone * 1.12),
        ),
      );
      for (const [u, v] of [
        [1, 1],
        [1, -1],
        [-1, 1],
        [-1, -1],
      ]) {
        const offset = new THREE.Vector3(u * stone * 0.78, stone * 0.3, v * stone * 0.78).applyQuaternion(q);
        prongs.push(
          new THREE.Matrix4().compose(
            p.clone().add(offset),
            q,
            new THREE.Vector3(1, 0.8, 1).multiplyScalar(stone * 0.2),
          ),
        );
      }
    }
    return { gems, cups, prongs };
  }, [stone, alternate]);

  return (
    <group rotation={[0, 0.4, 0]}>
      <InstancedMetal geometry={CUP} matrices={layout.cups} color={metal} />
      <InstancedMetal geometry={UNIT_SPHERE} matrices={layout.prongs} color={metal} />
      <InstancedGems geometry={ROUND} matrices={layout.gems[0]} color={gem} />
      {alternate && <InstancedGems geometry={ROUND} matrices={layout.gems[1]} color={alternate} />}
    </group>
  );
}

/** Which way the camera looks at each kind of piece (it is then moved to fit). */
export const PIECE_VIEW: Record<Design["kind"], [number, number, number]> = {
  studs: [0, 0.4, 6],
  pendant: [0, 0.3, 6],
  bracelet: [0, 3.2, 5.4],
  band: [2.6, 3.1, 5.6],
  ring: [3.6, 2.6, 6.1],
};

type PieceProps = {
  product: Pick<Product, "design" | "metal" | "gem">;
  /** "piece" leaves out a pendant's chain, "chain" draws only the chain. */
  part?: "all" | "piece" | "chain";
};

export default function JewelryPiece({ product, part = "all" }: PieceProps) {
  const { design } = product;
  const metal = metalColor(product.metal);
  const gem = gemColor(product.gem);
  if (part === "chain") {
    return design.kind === "pendant" ? (
      <PendantChain top={pendantTop({ ...design, metal, gem })} metal={metal} />
    ) : null;
  }
  switch (design.kind) {
    case "studs":
      return <Studs shape={design.shape} carat={design.carat} head={design.head} metal={metal} gem={gem} />;
    case "pendant":
      return (
        <Pendant
          shape={design.shape}
          carat={design.carat}
          head={design.head}
          metal={metal}
          gem={gem}
          chain={part === "all"}
        />
      );
    case "bracelet":
      return (
        <TennisBracelet
          stone={design.stone}
          metal={metal}
          gem={gem}
          alternate={design.alternate && gemColor(design.alternate)}
        />
      );
    case "band":
      return <Shank style={design.shank} eternity={design.eternity} metal={metal} accent={gem} />;
    case "ring":
      return (
        <ConfigurableRing
          config={{
            ...DEFAULT_CONFIG,
            head: design.head,
            shape: design.shape,
            carat: design.carat,
            centerGem: product.gem,
            accentGem: "diamond",
            headMetal: product.metal,
            shankMetal: product.metal,
            shank: design.shank,
            band: "none",
          }}
        />
      );
  }
}
