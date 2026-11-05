/**
 * 3D try-on head and shoulders: "Infinite, 3D Head Scan" by Lee Perry-Smith
 * (Infinite-Realities, CC BY 3.0; public/models/head/LICENSE.txt), made into a
 * female model with plain, untextured skin and a slimmer neck, softer jaw and
 * narrower, sloping shoulders (see `shape`, applied as the model loads). In the model, Y is up and the face looks along +Z; the ears are
 * at about ±1.6 on X.
 */
export const HEAD_MODEL = {
  url: "/models/head/head.glb",
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
    jaw: { from: -0.75, to: 0.5, plateau: [-0.55, 0.15] as const, width: 0.87 },
    chin: { from: -0.85, to: 0.1, reach: 0.75, start: 1.5 },
    /** Under the chin: the fullness between the chin and the throat, drawn back (in front of depth `start`). */
    under: { from: -1.15, plateau: [-0.85, -0.45] as const, to: -0.2, start: 0.8, amount: 0.78 },
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
    lips: { from: 0.35, plateau: [0.45, 0.65] as const, to: 0.75, halfWidth: 0.45, base: 2.15, push: 0.06 },
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
 * The model's hair: swept back from the face, with volume over the crown, into
 * a large twisted bun high on the back of the head, and a fine loose lock at
 * each temple (components/viewer/tryon/Hair.tsx).
 * Positions are in scene units round the try-on bust (BUST_MODEL, shown with
 * its ears at about ±2 on X and its eyes at Y 1.3).
 */
export const HAIR = {
  color: "#6e4a2e",
  /** The dense layer under the strands, darker, as hair is in its own shade. */
  underColor: "#45301e",
  /** Warm tint of the hair's broad highlight. */
  sheen: "#e6c094",
  /** The key light's direction, for the highlight (matches the scene's main light). */
  keyLight: [12, 14, 10] as const,
  /**
   * The strands: how many, how long each step along one is, how far they lie off
   * the scalp (at the root, and building up by the bun), the waves of a strand
   * and of its lock, the share of stray flyaways, and how many coil the bun.
   */
  strands: {
    count: 42000,
    step: 0.13,
    lift: [0.03, 0.55] as const,
    /** How far along a strand (from its root) it takes to rise to full volume; and the heights over which the volume builds up. */
    rise: 3.4,
    crown: [1.4, 3.4] as const,
    /** Most steps a strand takes from its root to the bun. */
    maxSteps: 90,
    /** How much the hair rises and falls in soft waves off the head. */
    ripple: 0.07,
    wave: 0.014,
    lockWave: 0.05,
    flyaways: 0.035,
    /**
     * Face-framing locks falling from the temples in front of the ears: per side, how many locks, strands in
     * each and how wide a lock is; the angles round the head where they start; their length, waves and how far
     * they stand off the face.
     */
    curls: {
      locks: 0,
      strands: 4,
      width: 0.12,
      around: [1.12, 1.22] as const,
      length: 1.9,
      turns: 1.1,
      radius: 0.16,
      standOff: 0.12,
      /** How far each strand of a wisp strays on its own towards its end, so they read as single fine hairs. */
      stray: 0.3,
      /** Lighter than the rest: single hairs catch the light. */
      tone: 0.35,
    },
    /**
     * Brushed up and out from the forehead and temples (within these angles round the head) before turning back
     * to the bun: how strongly, over how much of the strand's length, the parting's offset to one side, and how
     * much the hair goes out sideways as well as up.
     */
    sweep: { amount: 0.35, around: [0.9, 1.45] as const, length: 1.3, part: 0.35, out: 0.6 },
    bunStrands: 22000,
    /** Share of the bun's strands that come loose from it in fine arcs. */
    bunFlyaways: 0.035,
    opacity: 0.7,
  },
  /** Height of the point inside the head from which the scalp is mapped for the strands. */
  fieldY: 1.2,
  /** The head's vertical axis (x, z), round which the hairline is measured. */
  centre: [0, 0.3] as const,
  /** Height of the axis from the face back to the bun, round which strands lie side by side. */
  axisY: 1.65,
  /**
   * The hairline: its height at angles round the head (0 at the front, π/2 at
   * the ears, π at the back), high on the forehead, over the ears, down to the nape.
   */
  hairline: [
    [0, 2.86],
    [0.3, 2.82],
    [0.6, 2.68],
    [0.85, 2.45],
    [1.1, 2.12],
    [1.35, 1.92],
    [1.5, 1.8],
    [1.65, 1.25],
    [1.85, 0.55],
    [2.2, 0.15],
    [2.6, -0.06],
    [Math.PI, -0.24],
  ] as const,
  /** How soft the hairline is, either side of it. */
  feather: 0.15,
  /** How far behind the hairline the dense under-layer starts, so the hairline itself is fine strands on skin. */
  capInset: 0.3,
  /**
   * Kept clear of hair: the ears, an oval seen from the side (centre and radii
   * as height, depth), for points out from the axis beyond x.
   */
  ears: { x: 1.62, centre: [0.95, 0.12] as const, radii: [0.86, 0.52] as const },
  /** How far the hair stands off the scalp: at the hairline, and over the crown. */
  thickness: [0.004, 0.012] as const,
  /**
   * The bun, high on the back of the head and a little to one side. Its core:
   * centre, size, and stretch across and along its axis (the way it stands out
   * of the head). Round the core, the gathered hair is twisted into a rope and
   * wound on itself: the rope's turns, from the outer edge at the base to the
   * middle at the top (radii, in units of the size), the height it climbs, how
   * thick it is (at the start and the end), and how many times it twists round
   * itself in each turn.
   */
  bun: {
    centre: [0.22, 3.23, -1.99] as const,
    radius: 0.95,
    scale: [1.15, 1.05, 0.8] as const,
    axis: [0.075, 0.52, -0.85] as const,
    coil: {
      turns: 2.6,
      outer: 0.82,
      inner: 0.16,
      /** Wider across than up and down, so it is not a ball. */
      stretch: 1.2,
      base: -0.35,
      height: 0.8,
      rope: [0.4, 0.22] as const,
      twist: 2.2,
    },
  },
};

/**
 * The try-on bust (public/models/bust/bust.glb): head and shoulders with eyes,
 * brows and lashes. It is modelled in metres, Y up, facing +Z,
 * with the base of the bust at Y 0. Everything here is in those metres; the
 * scene shows it `scale` times larger (so 1 scene unit is about 4.8 cm) with
 * `origin` at the centre.
 */
export const BUST_MODEL = {
  url: "/models/bust/bust.glb",
  scale: 1 / 0.048,
  origin: [0, 0.22, 0.03] as const,
  /**
   * Mesh names in the file: the skin (coloured with the chosen skin tone); fine
   * hairs (brows and lashes); the eyes; and what is left out (the file's cap of
   * hair, replaced by strand hair, see HAIR).
   */
  skin: "bust_skin",
  fibres: ["eyebrow_hair", "eyelash_upper", "eyelash_lower"],
  eyes: ["eye_sclera", "eye_iris"],
  hidden: ["bust_hair", "eyebrow_hair", "eyelash_upper", "eyelash_lower"],
  /**
   * Eyelashes grown along the lid edges (traced from the file's lash meshes, which are left out): upper
   * lashes (how many per eye, length at the inner end and towards the outer corner in metres, how much they
   * curl up), lower lashes, how far out from the lid edge they start, and their look.
   */
  lashes: {
    upper: { count: 100, length: [0.0025, 0.0058] as const, curl: 0.65, shift: 0.0002 },
    lower: { count: 24, length: [0.0006, 0.0012] as const, shift: 0.0002 },
    lift: 0.0003,
    color: "#2a1b12",
    sheen: "#5a4030",
    spec: 0.15,
    opacity: 0.8,
    /** Fainter from further away (camera distance where the fade starts and ends, and how faint they get). */
    fade: [4.5, 12, 0.16] as const,
  },
  /**
   * Softer, more feminine features, applied to the skin as it loads (metres): a narrower jaw and chin
   * (between heights, eased in and out, kept clear of the ears and the back of the neck) and slimmer nose
   * wings; and colour where the face has it, a rosy tint on the lips and a light warmth on the cheeks
   * (centre, radii, colour multiplier and strength).
   */
  face: {
    jaw: {
      band: [0.14, 0.17, 0.2, 0.25] as const,
      width: 0.9,
      frontZ: [-0.03, 0.02] as const,
      clearOfEars: [0.078, 0.088] as const,
    },
    nose: {
      band: [0.224, 0.23, 0.252, 0.262] as const,
      halfWidth: [0.022, 0.03] as const,
      minZ: [0.14, 0.15] as const,
      width: 0.86,
    },
    lips: {
      centre: [0, 0.2015] as const,
      radii: [0.022, 0.0105] as const,
      minZ: [0.14, 0.15] as const,
      tint: [1, 0.78, 0.78] as const,
      amount: 0.6,
    },
    /**
     * The lower face made smooth and even (cheeks, jaw, chin, front of the neck): between these heights
     * (eased in and out), within this distance of the middle (easing out before the ears), in front of a
     * depth; clear of the mouth and nose (ovals: half width, half height, centre height). Folds filled in:
     * how many passes, and how far a point in a dip moves out towards its neighbours each time.
     */
    smooth: {
      band: [0.09, 0.11, 0.238, 0.252] as const,
      across: [0.074, 0.086] as const,
      minZ: [-0.02, 0.02] as const,
      mouth: [0.023, 0.0105, 0.2015] as const,
      nose: [0.024, 0.018, 0.244] as const,
      passes: 160,
      lambda: 0.8,
    },
    cheeks: {
      centre: [0.046, 0.243] as const,
      radii: [0.022, 0.018] as const,
      minZ: [0.08, 0.11] as const,
      tint: [1, 0.88, 0.86] as const,
      amount: 0.55,
    },
  },
  /**
   * The eyebrows: the file's brow patch is kept as a faint shadow under fine single hairs grown over it
   * (its spiky hair clumps are left out). How many hairs a brow, how long (metres), the angle they grow at
   * along the brow (0 the inner end, 1 the tail), how much it narrows towards the tail, how far they lie off
   * the skin, their colour, and how strongly the patch shows.
   */
  brows: {
    base: "eyebrow_base",
    count: 620,
    length: [0.004, 0.0068] as const,
    angles: [
      [0, 0.7],
      [0.12, 0.42],
      [0.3, 0.2],
      [0.6, 0.05],
      [1, -0.28],
    ] as const,
    /** Thick, rounded inner end, a slim even body and a fine tail (metres). */
    thickness: [
      [0, 0.0052],
      [0.25, 0.0046],
      [0.6, 0.0036],
      [0.85, 0.0022],
      [1, 0.001],
    ] as const,
    span: 0.94,
    arch: 0.0022,
    lift: 0.0005,
    color: "#7a5a42",
    sheen: "#8a6a52",
    /** Strength of the fibres' bright glint (low: brows are matte). */
    spec: 0.1,
    opacity: 0.55,
    /** The file's brow patch is wider and higher than this brow, so it is not shown. */
    baseOpacity: 0,
  },
  /** The irises sit just behind the front of the eyeballs in the file; brought forward this far (metres) so they show. */
  irisForward: 0.0009,
  /** And raised this far (metres), so the upper lid rests over the top of the iris, as in a relaxed eye. */
  irisRaise: 0.0009,
  /**
   * The eyes' look. The irises are painted in code (warm brown, lighter amber round the pupil, a dark rim,
   * fine radial fibres); pupil and rim sizes are shares of the iris's radius. The whites are warmed a
   * little (a colour multiplier). On the skin: the eyeballs (centre per side, radius), a dark lash line
   * along the lid edges (upper and lower strength), and a soft crease in the upper lid (an oval round the
   * eye: half width, half height, raised by; and its strength).
   */
  eyeLook: {
    iris: {
      pupil: 0.3,
      colours: ["#22140a", "#a0744a", "#7f5838", "#5c3e26", "#24160c"] as const,
      fibre: "#c49a6c",
      crypt: "#2a180c",
      /** The catchlight: where it sits (shares of the radius from the centre, across and down) and its size. */
      glint: [-0.3, 0.24, 0.15] as const,
    },
    sclera: [0.95, 0.9, 0.87] as const,
    centre: [0.0357, 0.2817, 0.1282] as const,
    radius: 0.0115,
    lashLine: { upper: 0.8, lower: 0.12 },
    /** A soft rosy tint along the lower lid's edge (colour multiplier and strength). */
    waterline: { tint: [1, 0.8, 0.78] as const, amount: 0.7 },
    crease: { radii: [0.0152, 0.0104] as const, raise: 0.0012, amount: 0.55 },
  },
  /** Earlobes: where a stud sits on the outer face of each, and the direction out of the skin there. */
  lobes: [
    { position: [0.0925, 0.2385, 0.0345] as const, out: [0.9, -0.2, 0.25] as const },
    { position: [-0.0925, 0.2385, 0.0345] as const, out: [-0.9, -0.2, 0.25] as const },
  ],
  /** Jewellery is modelled in ring units (1 = a ring's centre-line radius); this scales it to the bust. */
  jewelleryScale: 0.185 * 0.048,
  /** The bust's base fades into the backdrop between these heights (lower for a necklace). */
  fade: { ears: [0.075, 0.03] as const, neck: [0.035, 0.0] as const },
  /** A necklace: a loop round the neck this high at the back and this low at the front, round an axis at this depth. */
  chain: { back: 0.146, front: 0.09, axisZ: 0.012 },
  /** What the camera orbits: beside the ear for earrings, the base of the neck for a necklace. */
  focus: { ears: [0.07, 0.218, 0.048] as const, neck: [0, 0.112, 0.06] as const },
};

export const HEAD_CREDIT = {
  name: "Lee Perry-Smith, Infinite-Realities",
  url: "https://www.ir-ltd.net/",
};
