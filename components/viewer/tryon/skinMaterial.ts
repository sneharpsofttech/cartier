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
 * - warm light bleeding into the shadows, as light does under real skin, and a
 *   red glow where light turns to shadow;
 * - pores and fine lines as a light bump, so highlights break up like skin;
 * - the reference picture's broad colour zones (rosier joints, golden back of hand);
 * - fingernails (vertex colour R): paler, pinker and glossier.
 */

/** Map one photo tile over about 20 mm of skin (1 scene unit is about 8.5 mm). */
const DETAIL_SCALE = 1 / 2.4;
/** How much of the reference's knuckle creases and tendons show, and how deep gaps and creases go. */
const SKIN_PHOTO = "0.55";
const SKIN_AO = "0.42";

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
uniform vec3 backdrop;
uniform float armFadeStart;
uniform float armFadeEnd;
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

// Bump mapping from a height that varies over the surface (as three.js does for
// bump maps): tilts the normal with the height's screen-space slope.
vec3 bumpNormal(vec3 surfPos, vec3 surfNormal, float height, float strength) {
  vec2 dH = vec2(dFdx(height), dFdy(height)) * strength;
  vec3 sigmaX = dFdx(surfPos);
  vec3 sigmaY = dFdy(surfPos);
  vec3 r1 = cross(sigmaY, surfNormal);
  vec3 r2 = cross(surfNormal, sigmaX);
  float det = dot(sigmaX, r1);
  vec3 grad = sign(det) * (dH.x * r1 + dH.y * r2);
  return normalize(abs(det) * surfNormal - grad);
}
`;

const COLOR_FRAGMENT = /* glsl */ `
#define SKIN_PHOTO ${SKIN_PHOTO}
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
// Keep only the picture's fine detail (creases, veins, knuckle lines): divide it
// by a heavily blurred copy of itself, so its smeared patches of colour drop out.
vec3 dorsalFine = texture2D(dorsalMap, texUv).rgb / max(texture2D(dorsalMap, texUv, 4.0).rgb, vec3(0.02));
vec3 palmarFine = texture2D(palmarMap, texUv).rgb / max(texture2D(palmarMap, texUv, 4.0).rgb, vec3(0.02));
vec3 photo = mix(palmarFine, dorsalFine, facing);
// Mostly light and shade, keeping a little of the picture's own colour (pinker
// knuckles, bluish veins), and gentler than the raw picture.
float photoLum = dot(photo, vec3(0.299, 0.587, 0.114));
photo = mix(vec3(1.0), mix(vec3(photoLum), photo, 0.35), 0.85);
// The broad tone of the picture, very faint: warmer knuckles, a slightly darker back of hand.
vec3 broad = mix(texture2D(palmarMap, texUv, 4.0).rgb / meanPalmar, texture2D(dorsalMap, texUv, 4.0).rgb / meanDorsal, facing);
photo *= mix(vec3(1.0), broad, 0.25);
// Wider still: the natural colour zones of a real hand (rosier knuckles and
// finger joints, a slightly golden back of hand), with no grain left at all.
vec3 zones = mix(texture2D(palmarMap, texUv, 6.0).rgb / meanPalmar, texture2D(dorsalMap, texUv, 6.0).rgb / meanDorsal, facing);
zones = mix(vec3(1.0), zones, 0.55);
// Enough of it to show knuckle creases and tendons, without the picture's grain.
photo = mix(vec3(1.0), photo, SKIN_PHOTO);
// Projected straight on, the picture smears across surfaces that face sideways
// (finger sides, the edge of the hand); use clean skin there instead.
photo = mix(vec3(1.0), photo, smoothstep(0.25, 0.6, abs(objNormal.z)));
float photoMask = smoothstep(wristY - 2.5, wristY + 2.0, vObjPos.y)
  * step(0.0, texUv.x) * step(texUv.x, 1.0) * step(texUv.y, 1.0);

float ridge = smoothstep(0.1, 0.8, curv);
float crease = smoothstep(0.05, 0.7, -curv);
// Plain skin (used past the wrist): photo micro-texture, blotches, flushed
// knuckles and warmer creases.
vec3 plain = vec3(1.0 + blotch * 0.12);
plain = mix(plain, plain * vec3(1.05, 0.9, 0.87), ridge * 0.55);
plain = mix(plain, plain * vec3(0.9, 0.8, 0.76), crease * 0.65);
vec3 skin = diffuseColor.rgb * plain * mix(vec3(1.0), photo * zones, photoMask);
// Nails: a pink nail plate with a soft, darker cuticle line around it and a
// paler free edge at the tip, where the plate overhangs and turns towards +Y.
float nailEdge = nail * (1.0 - nail) * 4.0;
float freeEdge = nail * smoothstep(0.3, 0.75, objNormal.y);
vec3 nails = mix(nailColor, nailColor * vec3(1.18, 1.12, 1.1) + 0.06, freeEdge);
diffuseColor.rgb = mix(skin, nails, smoothstep(0.35, 0.8, nail));
diffuseColor.rgb *= 1.0 - nailEdge * 0.16;
`;

const NORMAL_FRAGMENT = /* glsl */ `
// Pores and fine skin lines: a light bump from the skin photo at two scales, so
// highlights break up on the surface instead of sliding over smooth plastic.
float pores = skinDetail(detailScale * 2.6, 0.0) * 0.6 + skinDetail(detailScale * 0.9, 0.0) * 0.4;
normal = bumpNormal(-vViewPosition, normal, pores, mix(0.0045, 0.0015, vHand.r));
`;

const ROUGHNESS_FRAGMENT = /* glsl */ `
// Knuckles are a touch oilier; nails are glossy.
roughnessFactor = clamp(roughnessFactor - ridge * 0.05 + (skinDetail(detailScale * 1.3, 1.0) - 0.5) * 0.12, 0.3, 0.85);
roughnessFactor = mix(roughnessFactor, 0.16, smoothstep(0.35, 0.8, nail));
`;

const AO_FRAGMENT = /* glsl */ `
#define SKIN_AO ${SKIN_AO}
float occlusion = mix(1.0, ao, 0.75);
reflectedLight.indirectDiffuse *= occlusion;
reflectedLight.indirectSpecular *= occlusion;
reflectedLight.directDiffuse *= mix(1.0, ao, SKIN_AO);
`;

const ARM_FADE = /* glsl */ `
// The scan ends in a cut-off arm. Fade the forearm into the backdrop before it
// gets there, so the hand reads as reaching in from out of frame.
float armFade = smoothstep(armFadeEnd, armFadeStart, vObjPos.y);
gl_FragColor.rgb = mix(backdrop, gl_FragColor.rgb, armFade);
`;

const DIFFUSE_TOTAL = /* glsl */ `
// Light scattered under the skin keeps shadows warm instead of grey.
float diffuseLum = dot(totalDiffuse, vec3(0.299, 0.587, 0.114));
totalDiffuse += diffuseColor.rgb * vec3(0.5, 0.16, 0.09) * (1.0 - smoothstep(0.0, 0.55, diffuseLum)) * 0.14 * ao;
// Where light gives way to shadow, real skin glows red (light scattered under
// the surface comes back out there); a soft band around mid-tones.
float terminator = smoothstep(0.06, 0.28, diffuseLum) * (1.0 - smoothstep(0.28, 0.6, diffuseLum));
totalDiffuse += diffuseColor.rgb * vec3(0.32, 0.07, 0.035) * terminator * 0.55;
`;

export type SkinTextures = {
  dorsal: THREE.Texture;
  palmar: THREE.Texture;
  frame: readonly [number, number, number, number];
  wristY: number;
  meanDorsal: readonly [number, number, number];
  meanPalmar: readonly [number, number, number];
  /** The viewer's background colour, which the forearm fades into. */
  backdrop: string;
};

/** A colour's components as shown on screen. */
function srgb(color: string) {
  const c = new THREE.Color(color).getRGB({ r: 0, g: 0, b: 0 }, THREE.SRGBColorSpace);
  return new THREE.Vector3(c.r, c.g, c.b);
}

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
    // The viewer's background as displayed (sRGB, after tone mapping), and where along the arm it takes over.
    // (sRGB components: THREE.Color stores linear values, which would fade the arm to a darker beige.)
    backdrop: { value: srgb(textures.backdrop) },
    // Long and low on the (lengthened) arm, so it fades out towards the edge of the frame.
    armFadeStart: { value: textures.wristY - 4.5 },
    armFadeEnd: { value: textures.wristY - 13 },
  };

  const material = new THREE.MeshPhysicalMaterial({
    roughness: 0.48,
    ior: 1.4,
    sheen: 0.35,
    sheenRoughness: 0.6,
    // Warm, reddish sheen at grazing angles: the soft glow at the edge of real skin.
    sheenColor: new THREE.Color("#ffb39b"),
    clearcoat: 0.04,
    clearcoatRoughness: 0.55,
    // Low, so the key light shapes the hand rather than the all-round studio glow.
    envMapIntensity: 0.26,
  });

  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", `#include <common>\n${VERTEX_HEAD}`)
      .replace("#include <begin_vertex>", `#include <begin_vertex>\n${VERTEX_BODY}`);
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\n${FRAGMENT_HEAD}`)
      .replace("#include <color_fragment>", `#include <color_fragment>\n${COLOR_FRAGMENT}`)
      .replace("#include <normal_fragment_maps>", `#include <normal_fragment_maps>\n${NORMAL_FRAGMENT}`)
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\n${ROUGHNESS_FRAGMENT}`)
      .replace("#include <aomap_fragment>", `#include <aomap_fragment>\n${AO_FRAGMENT}`)
      .replace(
        "vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;",
        `vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;\n${DIFFUSE_TOTAL}`,
      )
      .replace("#include <dithering_fragment>", `#include <dithering_fragment>\n${ARM_FADE}`);
  };

  const setSkin = (color: string) => {
    material.color.set(color);
    // Nail beds: paler and pinker than the skin, but still carrying its tone
    // (on deeper skin they read pinkish-beige, not white).
    // Deeper skin gets a smaller step, so its nails stay pinkish-brown rather than glowing pale.
    const tone = new THREE.Color(color);
    const lightness = tone.getHSL({ h: 0, s: 0, l: 0 }).l;
    uniforms.nailColor.value
      .copy(tone)
      .lerp(new THREE.Color("#f0bcb2"), THREE.MathUtils.mapLinear(lightness, 0.15, 0.85, 0.2, 0.5));
  };

  return { material, setSkin };
}
