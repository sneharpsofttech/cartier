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
  /**
   * Where the ring sits: at the base of the ring finger, just before it merges
   * into the hand. Following the finger's cross-sections down from the model's
   * origin (which was measured higher up), it stays a free circle of radius
   * about 0.76 until here, and tilts slightly towards the back of the hand.
   * The ring is centred on that circle, turned along the finger, and scaled so
   * its inner radius (0.925) sits just clear of the skin.
   */
  ringAxis: [0.0284, 0.999, 0.0357] as const,
  ringSeat: [0.027, -0.882, -0.307] as const,
  ringScale: 0.838,
  /**
   * The scan's forearm is short and ends in a cut. Past a plane across the arm
   * (through `from`, facing down the arm along `dir`) it is stretched along the
   * arm by `stretch`, so the arm runs out of the frame instead of ending in view.
   * The plane sits well below the wrist, which keeps its true shape for bracelets.
   */
  arm: { from: [-1.83, -10.5, -8.25] as const, dir: [-0.08, -0.94, -0.35] as const, stretch: 4 },
  /**
   * The wrist, where a bracelet is worn (measured across the scan's arm): its
   * centre, the arm's direction (towards the hand), the direction across the
   * wrist from the little-finger side, and the half-widths across and through it.
   */
  wrist: {
    centre: [-0.49, -8.3, -6.09] as const,
    axis: [0.46, 0.56, 0.69] as const,
    across: [-0.84, 0.54, 0.1] as const,
    radii: [2.55, 1.75] as const,
  },
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

/** Where the ring sits in one frame of the turning-hand video, in the frame's pixels. */
export type VideoFrame = {
  /** Centre of the ring finger where the ring sits; null while it is hidden behind the hand. */
  x: number | null;
  y: number | null;
  /** How far the finger leans right of upright, in degrees. */
  lean: number;
  /** How far the ring's head has turned from facing the camera towards the right, in degrees (180 = palm side). */
  yaw: number;
  /** How far the fingertip tips away from the camera, in degrees. */
  pitch: number;
  /** Half the finger's width. */
  r: number;
};

/**
 * Hand try-on video: a hand turning from its back to its palm and back again,
 * the ring it wore painted out of every frame (public/tryon/hand/{index}.webp).
 * The ring being designed is drawn in its place, frame by frame.
 */
export const HAND_VIDEO = {
  width: 1120,
  height: 720,
  frames: [
    { x: 483, y: 306, lean: -24.0, yaw: -8.0, pitch: 28, r: 24.0 },
    { x: 488, y: 306, lean: -24.6, yaw: -7.2, pitch: 28, r: 24.0 },
    { x: 497, y: 305, lean: -25.2, yaw: -6.4, pitch: 28, r: 24.0 },
    { x: 499, y: 305, lean: -25.8, yaw: -5.6, pitch: 28, r: 24.0 },
    { x: 504, y: 305, lean: -26.4, yaw: -4.8, pitch: 28, r: 24.0 },
    { x: 516, y: 303, lean: -27.0, yaw: -4.0, pitch: 28, r: 24.0 },
    { x: 526, y: 301, lean: -28.2, yaw: -1.2, pitch: 28, r: 24.0 },
    { x: 534, y: 299, lean: -29.4, yaw: 1.6, pitch: 28, r: 24.0 },
    { x: 537, y: 300, lean: -30.6, yaw: 4.4, pitch: 28, r: 24.0 },
    { x: 545, y: 299, lean: -31.8, yaw: 7.2, pitch: 28, r: 24.0 },
    { x: 556, y: 297, lean: -33.0, yaw: 10.0, pitch: 28, r: 24.0 },
    { x: 565, y: 296, lean: -33.0, yaw: 18.8, pitch: 28, r: 24.0 },
    { x: 569, y: 302, lean: -32.4, yaw: 48.8, pitch: 28, r: 24.0 },
    { x: 573, y: 303, lean: -31.4, yaw: 54.4, pitch: 28, r: 24.0 },
    { x: 575, y: 303, lean: -30.5, yaw: 60.0, pitch: 28, r: 24.0 },
    { x: 581, y: 304, lean: -29.6, yaw: 65.6, pitch: 28, r: 24.0 },
    { x: 588, y: 304, lean: -28.6, yaw: 71.2, pitch: 28, r: 24.0 },
    { x: 593, y: 304, lean: -27.6, yaw: 76.6, pitch: 12, r: 23.9 },
    { x: 595, y: 303, lean: -26.5, yaw: 81.5, pitch: 12, r: 23.5 },
    { x: 601, y: 302, lean: -25.4, yaw: 86.4, pitch: 12, r: 23.1 },
    { x: 507, y: 311, lean: -22.0, yaw: 160.0, pitch: 12, r: 22.0 },
    { x: 505, y: 309, lean: -19.0, yaw: 166.0, pitch: 12, r: 22.0 },
    { x: 503, y: 307, lean: -16.0, yaw: 172.0, pitch: 12, r: 22.0 },
    { x: 502, y: 306, lean: -13.8, yaw: 170.5, pitch: 12, r: 22.0 },
    { x: 499, y: 306, lean: -11.5, yaw: 169.0, pitch: 12, r: 22.0 },
    { x: 500, y: 305, lean: -9.8, yaw: 168.6, pitch: 12, r: 22.0 },
    { x: 499, y: 305, lean: -9.0, yaw: 170.5, pitch: 12, r: 22.0 },
    { x: 494, y: 307, lean: -8.2, yaw: 172.4, pitch: 12, r: 22.0 },
    { x: 491, y: 307, lean: -7.5, yaw: 174.2, pitch: 12, r: 22.0 },
    { x: 493, y: 306, lean: -6.8, yaw: 176.1, pitch: 12, r: 22.0 },
    { x: 497, y: 303, lean: -6.0, yaw: 178.0, pitch: 12, r: 22.0 },
    { x: 501, y: 300, lean: -6.1, yaw: 177.8, pitch: 12, r: 22.0 },
    { x: 502, y: 299, lean: -6.2, yaw: 177.7, pitch: 12, r: 22.0 },
    { x: 501, y: 299, lean: -6.2, yaw: 177.5, pitch: 12, r: 22.0 },
    { x: 498, y: 299, lean: -6.3, yaw: 177.3, pitch: 12, r: 22.0 },
    { x: 495, y: 299, lean: -6.4, yaw: 177.2, pitch: 12, r: 22.0 },
    { x: 493, y: 299, lean: -6.5, yaw: 177.0, pitch: 12, r: 22.0 },
    { x: 495, y: 299, lean: -6.6, yaw: 176.8, pitch: 12, r: 22.0 },
    { x: 497, y: 299, lean: -6.7, yaw: 176.7, pitch: 12, r: 22.0 },
    { x: 495, y: 299, lean: -6.8, yaw: 176.5, pitch: 12, r: 22.0 },
    { x: 492, y: 299, lean: -6.8, yaw: 176.3, pitch: 12, r: 22.0 },
    { x: 489, y: 299, lean: -6.9, yaw: 176.2, pitch: 12, r: 22.0 },
    { x: 488, y: 299, lean: -7.0, yaw: 176.0, pitch: 12, r: 22.0 },
    { x: 487, y: 301, lean: -9.6, yaw: 174.5, pitch: 12, r: 22.0 },
    { x: 494, y: 301, lean: -12.2, yaw: 173.0, pitch: 12, r: 22.0 },
    { x: 502, y: 300, lean: -14.6, yaw: 171.1, pitch: 12, r: 22.0 },
    { x: 514, y: 298, lean: -16.5, yaw: 168.5, pitch: 12, r: 22.0 },
    { x: 529, y: 295, lean: -18.4, yaw: 165.9, pitch: 12, r: 22.0 },
    { x: 549, y: 289, lean: -17.7, yaw: 160.0, pitch: 12, r: 22.0 },
    { x: 565, y: 284, lean: -15.7, yaw: 152.5, pitch: 12, r: 22.0 },
    { x: null, y: null, lean: -12.6, yaw: 141.1, pitch: 10, r: 21.7 },
    { x: null, y: null, lean: -5.3, yaw: 114.6, pitch: 10, r: 20.9 },
    { x: null, y: null, lean: 2.0, yaw: 88.0, pitch: 10, r: 20.0 },
    { x: null, y: null, lean: 3.0, yaw: 78.0, pitch: 10, r: 20.0 },
    { x: 665, y: 290, lean: 4.0, yaw: 68.0, pitch: 10, r: 20.0 },
    { x: 673, y: 287, lean: 4.0, yaw: 56.0, pitch: 10, r: 20.9 },
    { x: 674, y: 284, lean: 4.0, yaw: 44.0, pitch: 10, r: 21.7 },
    { x: 668, y: 284, lean: 3.5, yaw: 33.8, pitch: 10, r: 22.5 },
    { x: 659, y: 284, lean: 2.8, yaw: 24.4, pitch: 10, r: 23.2 },
    { x: 659, y: 284, lean: 2.0, yaw: 15.0, pitch: 10, r: 24.0 },
    { x: 658, y: 284, lean: 2.0, yaw: 12.5, pitch: 10, r: 24.2 },
    { x: 647, y: 285, lean: 2.0, yaw: 9.9, pitch: 10, r: 24.5 },
    { x: 636, y: 285, lean: 2.0, yaw: 7.4, pitch: 10, r: 24.7 },
    { x: 628, y: 285, lean: 2.0, yaw: 4.8, pitch: 10, r: 24.9 },
  ] as VideoFrame[],
};
