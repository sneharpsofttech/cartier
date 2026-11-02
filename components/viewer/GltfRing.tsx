"use client";

import { forwardRef, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { GemMaterial, MetalMaterial } from "./materials";

const GEM_NAME = /gem|diamond|stone|ruby|sapphire|emerald|crystal|melee/i;
const SIDE_NAME = /side|melee|accent|pave|small/i;

/** Real ring height in scene units, so any model frames like the procedural one. */
const TARGET_SIZE = 2.9;

type Part = { key: string; geometry: THREE.BufferGeometry; matrix: THREE.Matrix4; kind: "metal" | "gem" | "side" };

/**
 * Loads a jewellery GLB and re-skins it with the viewer's metal and gem materials.
 * Meshes are classified by mesh or material name, e.g. "Diamond_Center", "Metal_Band".
 */
const GltfRing = forwardRef<THREE.Group, { url: string; metal: string; gem: string; side: string }>(
  function GltfRing({ url, metal, gem, side }, ref) {
    const { scene } = useGLTF(url);

    const { parts, transform } = useMemo(() => {
      scene.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const scale = TARGET_SIZE / Math.max(size.x, size.y, size.z);

      const found: Part[] = [];
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (!mesh.isMesh) return;
        const materialName = Array.isArray(mesh.material) ? "" : mesh.material?.name ?? "";
        const name = `${mesh.name} ${materialName}`;
        const kind = !GEM_NAME.test(name) ? "metal" : SIDE_NAME.test(name) ? "side" : "gem";
        found.push({ key: mesh.uuid, geometry: mesh.geometry, matrix: mesh.matrixWorld.clone(), kind });
      });

      return {
        parts: found,
        transform: { scale, position: center.multiplyScalar(-scale).add(new THREE.Vector3(0, 0.35, 0)) },
      };
    }, [scene]);

    return (
      <group ref={ref}>
        <group scale={transform.scale} position={transform.position}>
          {parts.map((part) => (
            <mesh
              key={part.key}
              geometry={part.geometry}
              matrixAutoUpdate={false}
              matrix={part.matrix}
              castShadow
            >
              {part.kind === "metal" ? (
                <MetalMaterial color={metal} />
              ) : (
                <GemMaterial color={part.kind === "gem" ? gem : side} />
              )}
            </mesh>
          ))}
        </group>
      </group>
    );
  },
);

export default GltfRing;
