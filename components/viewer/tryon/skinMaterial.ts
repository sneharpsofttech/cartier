import * as THREE from "three";

/**
 * Skin shading for the try-on hand.
 *
 * The scan has no textures, so realism comes from:
 * - back-of-hand and palm skin (veins, creases, nails) from a reference picture,
 *   warped onto the model and projected front-to-back; stored relative to its
 *   average colour, so it works for every skin tone;
 * - soft, uneven patches of tone from a skin photo, wrapped over the surface
 *   (triplanar, no UVs needed);
 * - baked ambient occlusion (vertex colour G), darkening creases and gaps;
 * - baked curvature (vertex colour B): redder knuckles, deeper creases;
 * - warm light bleeding into the shadows, as light does under real skin;
 * - fingernails (vertex colour R): paler, pinker and glossier.
 */

/** Map one photo tile over about 20 mm of skin (1 scene unit is about 8.5 mm). */
const DETAIL_SCALE = 1 / 2.4;

const VERTEX_HEAD = /* glsl */ `
attribute vec4 handData;
varying vec3 vHand;
varying vec3 vObjPos;
varying vec3 vObjNormal;
`;

const VERTEX_BODY = /* glsl */ `
vHand = handData.rgb;
vObjPos = position;
vObjNormal = normal;
`;

const FRAGMENT_HEAD = /* glsl */ `
uniform vec3 nailColor;
uniform sampler2D detailMap;
uniform float detailScale;
uniform sampler2D dorsalMap;
uniform sampler2D palmarMap;
uniform vec4 texFrame;
uniform float wristY;
uniform vec3 meanDorsal;
uniform vec3 meanPalmar;
varying vec3 vHand;
varying vec3 vObjPos;
varying vec3 vObjNormal;

// Sample the skin tile from three directions and blend by the surface normal.
// A positive blur reads from a smaller mipmap: soft variation instead of pores.
float skinDetail(float scale, float blur) {
  vec3 p = vObjPos * scale;
  vec3 w = pow(abs(normalize(vObjNormal)), vec3(4.0));
  w /= w.x + w.y + w.z;
  return texture2D(detailMap, p.yz, blur).r * w.x
       + texture2D(detailMap, p.zx, blur).r * w.y
       + texture2D(detailMap, p.xy, blur).r * w.z;
}
`;

const COLOR_FRAGMENT = /* glsl */ `
float nail = vHand.r;
float ao = vHand.g;
float curv = vHand.b * 2.0 - 1.0;
// The same photo, enlarged and heavily blurred: soft, uneven patches of tone.
float blotch = skinDetail(detailScale * 0.1, 4.5) - 0.5;

// Reference skin, projected front-to-back: back of hand where the surface faces
// the viewer, palm where it faces away, blended across the sides.
vec2 texUv = (vObjPos.xy - texFrame.xy) / texFrame.zw;
vec3 objNormal = normalize(vObjNormal);
float facing = smoothstep(-0.35, 0.35, objNormal.z);
vec3 photo = mix(
  texture2D(palmarMap, texUv).rgb / meanPalmar,
  texture2D(dorsalMap, texUv).rgb / meanDorsal,
  facing
);
// Projected straight on, the picture smears across surfaces that face sideways
// (finger sides, the edge of the hand); use clean skin there instead.
photo = mix(vec3(1.0), photo, smoothstep(0.25, 0.6, abs(objNormal.z)));
float photoMask = smoothstep(wristY - 2.5, wristY + 2.0, vObjPos.y)
  * step(0.0, texUv.x) * step(texUv.x, 1.0) * step(texUv.y, 1.0);

float ridge = smoothstep(0.1, 0.8, curv);
float crease = smoothstep(0.05, 0.7, -curv);
// Plain skin (used past the wrist): photo micro-texture, blotches, flushed
// knuckles and warmer creases.
vec3 plain = vec3(1.0 + blotch * 0.3);
plain = mix(plain, plain * vec3(1.07, 0.86, 0.83), ridge * 0.6);
plain = mix(plain, plain * vec3(0.9, 0.76, 0.72), crease * 0.65);
vec3 skin = diffuseColor.rgb * mix(plain, photo, photoMask);
// The reference already has natural nails; only nudge them where it applies.
diffuseColor.rgb = mix(skin, nailColor, nail * mix(1.0, 0.3, photoMask));
`;

const ROUGHNESS_FRAGMENT = /* glsl */ `
// Knuckles are a touch oilier; nails are glossy.
roughnessFactor = clamp(roughnessFactor - ridge * 0.05, 0.3, 0.85);
roughnessFactor = mix(roughnessFactor, 0.26, nail);
`;

const AO_FRAGMENT = /* glsl */ `
float occlusion = mix(1.0, ao, 0.75);
reflectedLight.indirectDiffuse *= occlusion;
reflectedLight.indirectSpecular *= occlusion;
reflectedLight.directDiffuse *= mix(1.0, ao, 0.25);
`;

const DIFFUSE_TOTAL = /* glsl */ `
// Light scattered under the skin keeps shadows warm instead of grey.
float diffuseLum = dot(totalDiffuse, vec3(0.299, 0.587, 0.114));
totalDiffuse += diffuseColor.rgb * vec3(0.5, 0.16, 0.09) * (1.0 - smoothstep(0.0, 0.55, diffuseLum)) * 0.14 * ao;
`;

export type SkinTextures = {
  dorsal: THREE.Texture;
  palmar: THREE.Texture;
  frame: readonly [number, number, number, number];
  wristY: number;
  meanDorsal: readonly [number, number, number];
  meanPalmar: readonly [number, number, number];
};

export function createSkinMaterial(detailMap: THREE.Texture, textures: SkinTextures) {
  const uniforms = {
    nailColor: { value: new THREE.Color() },
    detailMap: { value: detailMap },
    detailScale: { value: DETAIL_SCALE },
    dorsalMap: { value: textures.dorsal },
    palmarMap: { value: textures.palmar },
    texFrame: { value: new THREE.Vector4(...textures.frame) },
    wristY: { value: textures.wristY },
    meanDorsal: { value: new THREE.Vector3(...textures.meanDorsal) },
    meanPalmar: { value: new THREE.Vector3(...textures.meanPalmar) },
  };

  const material = new THREE.MeshPhysicalMaterial({
    roughness: 0.52,
    ior: 1.4,
    sheen: 0.6,
    sheenRoughness: 0.6,
    // Warm, reddish sheen at grazing angles: the soft glow at the edge of real skin.
    sheenColor: new THREE.Color("#ffb39b"),
    clearcoat: 0.08,
    clearcoatRoughness: 0.55,
    envMapIntensity: 0.4,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_HEAD}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_HEAD}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${COLOR_FRAGMENT}`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n${ROUGHNESS_FRAGMENT}`)
      .replace("#include <aomap_fragment>", `#include <aomap_fragment>\n${AO_FRAGMENT}`)
      .replace(
        "vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;",
        `vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;\n${DIFFUSE_TOTAL}`,
      );
  };

  const setSkin = (color: string) => {
    material.color.set(color);
    // Nail beds: paler and pinker than the skin, but still carrying its tone
    // (on deeper skin they read pinkish-beige, not white).
    uniforms.nailColor.value.set(color).lerp(new THREE.Color("#ecc9bf"), 0.55);
  };

  return { material, setSkin };
}
