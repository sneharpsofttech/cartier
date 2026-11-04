/**
 * Earring try-on photos: a model seen from four sides (public/tryon/model/,
 * made by scripts/make_tryon_model.py from the supplied model picture, with the
 * earrings she wore painted out). For each: its size, where the earlobe is (in
 * the photo's pixels), how big the earring is drawn there (pixels per ring unit;
 * from the size of her ear, at about 8.9 mm a unit), and which way the earlobe
 * faces (degrees from facing the camera towards the right of the picture).
 */
export type EarPhoto = {
  id: string;
  label: string;
  src: string;
  width: number;
  height: number;
  lobe: readonly [number, number];
  scale: number;
  yaw: number;
};

export const EAR_PHOTOS: EarPhoto[] = [
  {
    id: "portrait",
    label: "Portrait",
    src: "/tryon/model/portrait.jpg",
    width: 859,
    height: 928,
    lobe: [595, 405],
    scale: 25,
    yaw: 12,
  },
  {
    id: "ear",
    label: "Close-up",
    src: "/tryon/model/ear.jpg",
    width: 760,
    height: 776,
    lobe: [282, 540],
    scale: 62,
    yaw: 6,
  },
  {
    id: "profile",
    label: "Profile",
    src: "/tryon/model/profile.jpg",
    width: 760,
    height: 512,
    lobe: [474, 286],
    scale: 28,
    yaw: 4,
  },
  {
    id: "back",
    label: "From behind",
    src: "/tryon/model/back.jpg",
    width: 760,
    height: 534,
    lobe: [530, 238],
    scale: 28,
    yaw: 62,
  },
];
