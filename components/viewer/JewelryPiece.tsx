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

/**
 * One stud as worn on an earlobe: the head grows out along +y from the skin at
 * the origin, its length (z) hangs down (a heart's point too), and the post runs
 * into the lobe.
 */
function EarStud(props: StoneProps) {
  return (
    <group rotation={[0, props.shape === "heart" ? Math.PI : 0, 0]}>
      <group position={[0, -BAND_TOP + 0.02, 0]}>
        <Head
          shape={props.shape}
          carat={props.carat}
          type={props.head}
          metal={props.metal}
          gem={props.gem}
          accent={gemColor("diamond")}
          shoulders={false}
        />
        {/* Short, so it ends inside the lobe rather than poking out behind it. */}
        <mesh position={[0, BAND_TOP - 0.13, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.26, 12]} />
          <MetalMaterial color={props.metal} />
        </mesh>
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

/**
 * Where a pendant's bail sits: a slim upright loop rising from behind the
 * stone's top edge (so it looks to grow out of the setting), seen face on,
 * with the chain running through its top.
 */
function pendantBail(p: StoneProps) {
  const { width, extent } = stoneLayout(p.shape, p.carat, p.head);
  const radius = Math.max(0.026, width * 0.1);
  const bottom = extent * 0.78;
  const top = extent + Math.max(0.3, width * 0.95);
  return { width: Math.max(0.14, width * 0.42), bottom, top, radius, z: -Math.max(0.05, width * 0.18) };
}

/** The chain hanging from a pendant's bail, threaded through the top of the loop. */
/** Where a pendant hangs from its chain (the inside top of the bail), in the piece's units: [y, z]. */
export function pendantHangPoint(design: { shape: ShapeId; carat: number; head: HeadType }): [number, number] {
  const bail = pendantBail({ ...design, metal: "", gem: "" });
  return [bail.top - bail.radius, bail.z];
}

function PendantChain({ bail, metal }: { bail: ReturnType<typeof pendantBail>; metal: string }) {
  const chain = useMemo(() => {
    const y = bail.top - bail.radius * 1.6;
    const side = (s: number) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, y, bail.z),
          new THREE.Vector3(s * 0.3, y + 0.55, bail.z - 0.05),
          new THREE.Vector3(s * 0.9, y + 1.95, bail.z - 0.2),
          new THREE.Vector3(s * 1.4, y + 4, bail.z - 0.4),
        ]),
        96,
        0.016,
        8,
        false,
      );
    return [side(-1), side(1)];
  }, [bail]);
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

function Pendant({ chain = true, ...props }: StoneProps & { chain?: boolean }) {
  const bail = pendantBail(props);
  // A tall loop, narrow where it meets the setting and rounded at the top, like a classic pendant bail.
  const loop = useMemo(() => {
    const { width: w, bottom: b, top: t, z } = bail;
    const h = t - b;
    const half = [
      [0.18, 0],
      [0.38, 0.12],
      [0.5, 0.45],
      [0.48, 0.75],
      [0.3, 0.95],
    ];
    const points = [
      new THREE.Vector3(0, b - 0.01, z),
      ...half.map(([x, y]) => new THREE.Vector3(x * w, b + y * h, z)),
      new THREE.Vector3(0, t, z),
      ...half.reverse().map(([x, y]) => new THREE.Vector3(-x * w, b + y * h, z)),
    ];
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points, true), 96, bail.radius, 12, true);
  }, [bail]);
  return (
    <group>
      <FacingStone {...props} />
      <mesh geometry={loop}>
        <MetalMaterial color={props.metal} />
      </mesh>
      {chain && <PendantChain bail={bail} metal={props.metal} />}
    </group>
  );
}

/** A tennis bracelet lying in an oval: a line of stones in round cups with four prongs each. */
function TennisBracelet({
  stone,
  metal,
  gem,
  alternate,
  worn,
}: {
  stone: number;
  metal: string;
  gem: string;
  alternate?: string;
  /**
   * Worn round a wrist (half-widths of the wrist): the stones face outwards
   * around the arm, which runs along +Y, instead of lying flat facing up.
   */
  worn?: readonly [number, number];
}) {
  const layout = useMemo(() => {
    // Worn: a little looser than the wrist, with each cup resting on the skin.
    const a = worn ? worn[0] + 0.25 + stone * 0.6 : 1.9;
    const b = worn ? worn[1] + 0.25 + stone * 0.6 : 1.45;
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
      if (worn) {
        // Stone up = out from the arm; along the bracelet = the ellipse's tangent.
        const along = new THREE.Vector3(d2.x, 0, d2.y).normalize();
        const out = new THREE.Vector3(p2.x / (a * a), 0, p2.y / (b * b)).normalize();
        q.setFromRotationMatrix(new THREE.Matrix4().makeBasis(along, out, new THREE.Vector3().crossVectors(along, out)));
      }
      gems[alternate && i % 2 ? 1 : 0].push(
        new THREE.Matrix4().compose(
          p.clone().add(new THREE.Vector3(0, stone * 0.2, 0).applyQuaternion(q)),
          q,
          new THREE.Vector3(stone, stone, stone),
        ),
      );
      cups.push(
        new THREE.Matrix4().compose(
          p.clone().add(new THREE.Vector3(0, -stone * 0.6, 0).applyQuaternion(q)),
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
  }, [stone, alternate, worn]);

  return (
    <group rotation={[0, worn ? 0 : 0.4, 0]}>
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

/** Three more angles of each kind of piece, for the extra product photos ({slug}-2, -3 and -4). */
export const PIECE_EXTRA_VIEWS: Record<Design["kind"], [number, number, number][]> = {
  // Turned to the right, turned to the left from above, and from above (the posts and depth).
  studs: [
    [3.6, 1.4, 4.6],
    [-2.8, 2.6, 4.8],
    [0, 5.8, 1.8],
  ],
  // Turned either way, then in profile to show the bail and the stone's depth.
  pendant: [
    [3.4, 1.2, 5],
    [-3, 2.2, 4.8],
    [5.8, 0.6, 1.4],
  ],
  // Looking down into the circle, from the side, and from above on the left.
  bracelet: [
    [0, 6.2, 0.5],
    [5.2, 1.6, 2.4],
    [-3.6, 4.2, 2.6],
  ],
  // Low on the left, from above, and in profile.
  band: [
    [-4.6, 0.7, 3.8],
    [0.3, 6.4, 0.9],
    [6, 0.5, 1.2],
  ],
  // From above on the left, in profile, and from above.
  ring: [
    [-4.4, 3.8, 3.2],
    [6.2, 0.9, 0.6],
    [0.3, 6.6, 1.1],
  ],
};

type PieceProps = {
  product: Pick<Product, "design" | "metal" | "gem">;
  /** "piece" leaves out a pendant's chain, "chain" draws only the chain. */
  part?: "all" | "piece" | "chain";
  /** A bracelet worn round a wrist of these half-widths (see TennisBracelet), in try-on units. */
  wrist?: readonly [number, number];
  /** Earrings: a single stud as worn on an earlobe (see EarStud). */
  ear?: boolean;
};

/** Try-on units are larger than the product views': a bracelet's stones scale up with it. */
const WORN_STONE_SCALE = 1.5;

export default function JewelryPiece({ product, part = "all", wrist, ear }: PieceProps) {
  const { design } = product;
  const metal = metalColor(product.metal);
  const gem = gemColor(product.gem);
  if (part === "chain") {
    return design.kind === "pendant" ? (
      <PendantChain bail={pendantBail({ ...design, metal, gem })} metal={metal} />
    ) : null;
  }
  switch (design.kind) {
    case "studs":
      if (ear) return <EarStud shape={design.shape} carat={design.carat} head={design.head} metal={metal} gem={gem} />;
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
          stone={wrist ? design.stone * WORN_STONE_SCALE : design.stone}
          worn={wrist}
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
