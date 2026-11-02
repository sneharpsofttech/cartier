/**
 * 3D try-on hand: a scanned left hand ("hand" by kevinruiz, CC BY 4.0), prepared
 * by scripts/make_hand_model.py. In the model, fingers point +Y, the back of the
 * hand faces +Z, and the ring seat on the ring finger sits at the origin, scaled
 * so 1 unit is the ring's centre-line radius.
 */

export const HAND_MODEL = {
  url: "/models/hand.glb",
  /** Real skin micro-texture from a photo (scripts/make_skin_detail.py). */
  skinDetail: "/models/skin-detail.png",
  /**
   * Back-of-hand and palm skin, warped onto the model seen straight on
   * (scripts/make_hand_textures.py; values from public/models/hand-textures.json).
   */
  skinTextures: {
    dorsal: "/models/hand-dorsal.jpg",
    palmar: "/models/hand-palmar.jpg",
    /** Model-space rectangle the textures cover: x0, y0, width, height. */
    frame: [-3.4, -9.0, 9.8, 14.9] as const,
    /** Below this the textures have no arm; skin fades to plain. */
    wristY: -7.5,
    /** Average skin colour of each texture (linear RGB), for re-toning. */
    meanDorsal: [0.4963, 0.2985, 0.2199] as const,
    meanPalmar: [0.5019, 0.2943, 0.2328] as const,
  },
  /** Direction of the ring finger at the ring seat (from hand.json). */
  ringAxis: [0.0281, 0.9866, -0.1609] as const,
  /** Centre of the hand (palm), which the camera orbits. */
  focus: [0.6, -3.2, -1.6] as const,
};

export const MODEL_CREDIT = {
  name: "kevinruiz",
  url: "https://sketchfab.com/3d-models/hand-a43c9c9059b24e2aa4af08d1a76f0916",
};

export type SkinTone = { id: string; label: string; color: string };

/** Skin albedo per tone (before lighting), from fair to deep. */
export const SKIN_TONES: SkinTone[] = [
  { id: "fair", label: "Fair", color: "#eccbbb" },
  { id: "light", label: "Light", color: "#ddae92" },
  { id: "medium", label: "Medium", color: "#bd8460" },
  { id: "tan", label: "Tan", color: "#99694a" },
  { id: "brown", label: "Brown", color: "#6c452f" },
  { id: "deep", label: "Deep", color: "#422a1f" },
];
