/**
 * 3D try-on head and shoulders: "Infinite, 3D Head Scan" by Lee Perry-Smith
 * (Infinite-Realities, CC BY 3.0; public/models/head/LICENSE.txt), made into a
 * female model: smooth skin (scripts/make_female_head_texture.py) and a slimmer
 * neck, softer jaw and narrower, sloping shoulders (see `shape`, applied as the
 * model loads). In the model, Y is up and the face looks along +Z; the ears are
 * at about ±1.6 on X.
 */
export const HEAD_MODEL = {
  url: "/models/head/head.glb",
  /** Skin colour and surface detail maps that come with the scan. */
  color: "/models/head/head-color-female.jpg",
  normal: "/models/head/head-normal.jpg",
  /** Average colour of the skin map (linear RGB), for re-toning it to a chosen skin tone. */
  meanColor: [0.535, 0.3207, 0.2634] as const,
  /**
   * Earlobes, where a stud sits (on the outer face, a little above the lobe's
   * edge), with the direction out of the skin there.
   */
  lobes: [
    { position: [1.56, 0.86, 0.1] as const, out: [0.85, -0.1, 0.3] as const },
    { position: [-1.69, 0.82, 0.36] as const, out: [-0.85, -0.1, 0.35] as const },
  ],
  /**
   * Reshaping the scan towards a female figure, as factors applied between
   * heights (model Y): the neck's width and depth, the jaw's width, the chin's
   * reach, and the shoulders' width and slope. Each eases in and out smoothly.
   */
  shape: {
    centreX: -0.08,
    neck: { from: -1.65, to: -0.25, plateau: [-1.25, -0.55] as const, width: 0.84, depth: 0.9 },
    jaw: { from: -0.75, to: 0.5, plateau: [-0.55, 0.15] as const, width: 0.93 },
    chin: { from: -0.85, to: 0.1, reach: 0.85, start: 1.5 },
    shoulders: { below: -1.4, full: -2.2, width: 0.9, slope: 0.14 },
    /**
     * Softer features, on the middle of the face (within `halfWidth` of it): a
     * lower brow ridge, a smaller nose, and slightly fuller lips. Each pulls the
     * surface in towards (or out from) the depth `base` by `amount`.
     */
    brow: { from: 1.95, plateau: [2.05, 2.3] as const, to: 2.45, halfWidth: 1.0, base: 1.9, amount: 0.82 },
    nose: {
      from: 0.85,
      plateau: [0.95, 1.6] as const,
      to: 1.85,
      halfWidth: 0.45,
      base: 2.2,
      amount: 0.72,
      width: 0.88,
    },
    lips: { from: 0.35, plateau: [0.45, 0.65] as const, to: 0.75, halfWidth: 0.45, base: 2.15, push: 0.04 },
  },
  /** Jewellery is modelled in ring units (1 = a ring's centre-line radius); this scales it to the head. */
  jewelleryScale: 0.185,
  /**
   * The scan stops below the shoulders; it fades into the backdrop between these
   * heights (lower for a necklace, so the pendant on the chest stays clear).
   */
  fade: { ears: [-1.9, -2.6] as const, neck: [-2.9, -3.9] as const },
  /**
   * How a necklace drapes: a loop round the neck, resting on the skin, that sits
   * this high at the back and this low at the front, round an axis at this depth.
   */
  chain: { back: -1.0, front: -2.2, axisZ: -0.35 },
  /** What the camera orbits: beside the ear for earrings (a close ear-and-jawline view), the base of the neck for a necklace. */
  focus: { ears: [1.1, 0.45, 0.35] as const, neck: [0.05, -1.65, 0.2] as const },
};

/**
 * The model's hair: pulled back into a low bun (components/viewer/tryon/Hair.tsx).
 * Positions are in the head model's space.
 */
export const HAIR = {
  color: "#6b4630",
  /** The dense layer under the strands, darker, as hair is in its own shade. */
  underColor: "#2c1a10",
  /** Warm tint of the hair's broad highlight. */
  sheen: "#c8906e",
  /** The key light's direction, for the highlight (matches the scene's main light). */
  keyLight: [12, 14, 10] as const,
  /**
   * The strands: how many, how long each step along one is, how far they lie off
   * the scalp (at the root, and building up by the bun), the waves of a strand
   * and of its lock, the share of stray flyaways, and how many coil the bun.
   */
  strands: {
    count: 30000,
    step: 0.14,
    lift: [0.015, 0.11] as const,
    wave: 0.006,
    lockWave: 0.018,
    flyaways: 0.025,
    bunStrands: 9000,
    opacity: 0.7,
  },
  /** Height of the point inside the head from which the scalp is mapped for the strands. */
  fieldY: 1.5,
  /** The head's vertical axis (x, z), round which the hairline is measured. */
  centre: [-0.08, 0.2] as const,
  /** Height of the axis from the face back to the bun, round which strands lie side by side. */
  axisY: 2.0,
  /**
   * The hairline: its height at angles round the head (0 at the front, π/2 at
   * the ears, π at the back), high on the forehead, over the ears, down to the nape.
   */
  hairline: [
    [0, 3.05],
    [0.45, 2.98],
    [0.8, 2.72],
    [1.1, 2.42],
    [1.35, 2.26],
    [1.5, 2.18],
    [1.65, 1.6],
    [1.85, 0.85],
    [2.3, 0.55],
    [Math.PI, 0.5],
  ] as const,
  /** How soft the hairline is, either side of it. */
  feather: 0.12,
  /**
   * Kept clear of hair: the ears, an oval seen from the side (centre and radii
   * as height, depth), for points out from the axis beyond x.
   */
  ears: { x: 1.42, centre: [1.42, 0.02] as const, radii: [0.72, 0.4] as const },
  /** How far the hair stands off the scalp: at the hairline, and over the crown. */
  thickness: [0.004, 0.012] as const,
  /** The bun at the nape. */
  bun: { centre: [-0.08, 1.05, -2.0] as const, radius: 0.55, scale: [1.15, 0.92, 0.72] as const },
};

export const HEAD_CREDIT = {
  name: "Lee Perry-Smith, Infinite-Realities",
  url: "https://www.ir-ltd.net/",
};
