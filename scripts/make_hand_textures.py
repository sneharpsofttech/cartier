"""Build the try-on hand's skin textures from a reference picture of a hand.

Usage: python scripts/make_hand_textures.py <composite.webp> <out_dir> [--preview preview.png]

The reference is a 6x2 grid of views of a hand; we use the back-of-hand (dorsal)
and palm views. Each is warped (thin-plate spline through matching landmarks:
fingertips, middle knuckles, finger webs, palm edges, wrist) onto the 3D hand
seen straight on, so veins, creases and nails land on the model's fingers. The
textures are then projected front-to-back onto public/models/hand.glb.
"""
import json
import struct
import sys
from pathlib import Path

import cv2
import numpy as np

# Texture frame in hand-model units (x across, y along the fingers).
FRAME = {"x0": -3.4, "x1": 6.4, "y0": -9.0, "y1": 5.9}
PX_PER_UNIT = 80
# Below this the reference shows no more arm; the shader fades to plain skin.
WRIST_Y = -7.5

# Grid cells of the reference image (column index, top row) and their crop.
VIEWS = {"dorsal": 1, "palmar": 0}

# Landmarks in each view's crop (pixels, 170 x 250), read off the reference.
# Both views show the thumb on the left, so image-left is the model's +X.
IMAGE_POINTS = {
    "dorsal": {
        "thumb_tip": (21, 83), "index_tip": (71, 17), "middle_tip": (97, 8), "ring_tip": (120, 22),
        "little_tip": (148, 52), "index_pip": (72, 60), "middle_pip": (97, 55), "ring_pip": (120, 65),
        "little_pip": (145, 85), "web_thumb": (54, 122), "web_index": (86, 95), "web_middle": (108, 95),
        "web_ring": (130, 102), "edge_little": (137, 150), "edge_thumb": (54, 160),
        "wrist_thumb": (68, 235), "wrist_little": (127, 235),
        # Finger edges at the middle knuckle (thumb side first).
        "index_pip_t": (63, 60), "index_pip_l": (80, 60), "middle_pip_t": (88, 55), "middle_pip_l": (105, 55),
        "ring_pip_t": (110, 65), "ring_pip_l": (128, 65), "little_pip_t": (135, 85), "little_pip_l": (152, 85),
    },
    "palmar": {
        "thumb_tip": (15, 82), "index_tip": (70, 17), "middle_tip": (96, 7), "ring_tip": (120, 20),
        "little_tip": (146, 48), "index_pip": (70, 62), "middle_pip": (96, 55), "ring_pip": (119, 62),
        "little_pip": (142, 80), "web_thumb": (52, 122), "web_index": (86, 82), "web_middle": (107, 80),
        "web_ring": (128, 92), "edge_little": (137, 140), "edge_thumb": (55, 160),
        "wrist_thumb": (62, 235), "wrist_little": (122, 235),
        "index_pip_t": (62, 62), "index_pip_l": (80, 62), "middle_pip_t": (87, 55), "middle_pip_l": (105, 55),
        "ring_pip_t": (110, 62), "ring_pip_l": (128, 62), "little_pip_t": (134, 80), "little_pip_l": (150, 80),
    },
}

# Finger columns on the model (x ranges) for finding tips and joints.
FINGERS = {"little": (-2.3, -0.6), "ring": (-0.7, 0.9), "middle": (1.0, 2.8), "index": (2.9, 4.95)}
WEB_Y = {"little": -0.3, "ring": -0.6, "middle": -0.9, "index": -0.9}


def load_glb(path):
    data = Path(path).read_bytes()
    jlen = struct.unpack("<I", data[12:16])[0]
    gltf = json.loads(data[20 : 20 + jlen])
    binary = data[20 + jlen + 8 :]

    def accessor(i, dtype, cols):
        view = gltf["bufferViews"][gltf["accessors"][i]["bufferView"]]
        raw = binary[view["byteOffset"] : view["byteOffset"] + view["byteLength"]]
        return np.frombuffer(raw, dtype).reshape(-1, cols).astype(np.float64)

    return accessor(0, np.float32, 3), accessor(1, np.float32, 3)


def model_points(p):
    """The same landmarks on the 3D hand, seen from the front (x, y)."""
    pts = {}
    for name, (x0, x1) in FINGERS.items():
        col = p[(p[:, 0] > x0) & (p[:, 0] < x1) & (p[:, 1] > 1.0)]
        tip = col[np.argmax(col[:, 1])]
        pts[f"{name}_tip"] = (tip[0], tip[1])
        pip_y = WEB_Y[name] + 0.55 * (tip[1] - WEB_Y[name])
        ring = col[np.abs(col[:, 1] - pip_y) < 0.15]
        pts[f"{name}_pip"] = (ring[:, 0].mean(), pip_y)
        # Finger edges: the thumb side is +X on the model.
        pts[f"{name}_pip_t"] = (ring[:, 0].max(), pip_y)
        pts[f"{name}_pip_l"] = (ring[:, 0].min(), pip_y)
    pts["thumb_tip"] = (5.2, 1.33)
    pts["web_thumb"] = (4.85, 0.4)
    pts["web_index"] = (2.85, -0.9)
    pts["web_middle"] = (0.93, -0.9)
    pts["web_ring"] = (-0.75, -0.3)

    def edges(y):
        row = p[np.abs(p[:, 1] - y) < 0.15]
        return row[:, 0].min(), row[:, 0].max()

    lo, hi = edges(-3.6)
    pts["edge_little"], pts["edge_thumb"] = (lo, -3.6), (hi, -3.6)
    lo, hi = edges(WRIST_Y)
    pts["wrist_little"], pts["wrist_thumb"] = (lo, WRIST_Y), (hi, WRIST_Y)
    return pts


class ThinPlate:
    """2-D thin-plate spline from model (x, y) to image (u, v)."""

    def __init__(self, src, dst, smooth=1e-3):
        self.src = src
        n = len(src)
        k = self._kernel(src[:, None] - src[None])
        a = np.zeros((n + 3, n + 3))
        a[:n, :n] = k + smooth * np.eye(n)
        a[:n, n] = a[n, :n] = 1
        a[:n, n + 1 :] = src
        a[n + 1 :, :n] = src.T
        rhs = np.zeros((n + 3, 2))
        rhs[:n] = dst
        self.coef = np.linalg.solve(a, rhs)

    @staticmethod
    def _kernel(d):
        r2 = (d**2).sum(-1)
        return np.where(r2 > 0, r2 * np.log(np.maximum(r2, 1e-12)) / 2, 0)

    def __call__(self, pts):
        n = len(self.src)
        k = self._kernel(pts[:, None] - self.src[None])
        return k @ self.coef[:n] + self.coef[n] + pts @ self.coef[n + 1 :]


def crop_view(img, column):
    h, w = img.shape[:2]
    cell = w / 6
    return img[18:268, int(column * cell) : int(column * cell + cell)]


def extend_skin(view):
    """Replace the dark backdrop with nearby skin colour so edges never go grey."""
    gray = cv2.cvtColor(view, cv2.COLOR_BGR2GRAY)
    mask = (gray > 110).astype(np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    # Pull in from the outline: edge pixels are mixed with the dark backdrop.
    mask = cv2.erode(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    out = view.astype(np.float32)
    known = mask.astype(np.float32)
    colour = out * known[..., None]
    for _ in range(60):
        blur_c = cv2.blur(colour, (5, 5))
        blur_k = cv2.blur(known, (5, 5))
        fill = (known == 0) & (blur_k > 0.05)
        colour[fill] = blur_c[fill] / blur_k[fill, None]
        known[fill] = 1
    return colour.clip(0, 255).astype(np.uint8), mask


def main():
    src, out_dir = sys.argv[1], Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    positions, _ = load_glb(out_dir / "hand.glb")
    model = model_points(positions)

    composite = cv2.imread(src)
    w = int((FRAME["x1"] - FRAME["x0"]) * PX_PER_UNIT)
    h = int((FRAME["y1"] - FRAME["y0"]) * PX_PER_UNIT)
    gx, gy = np.meshgrid(
        FRAME["x0"] + (np.arange(w) + 0.5) / PX_PER_UNIT,
        FRAME["y1"] - (np.arange(h) + 0.5) / PX_PER_UNIT,
    )
    grid = np.column_stack([gx.ravel(), gy.ravel()])
    meta = {"frame": FRAME, "wristY": WRIST_Y, "mean": {}}

    for view, column in VIEWS.items():
        names = list(IMAGE_POINTS[view])
        warp = ThinPlate(np.array([model[n] for n in names]), np.array([IMAGE_POINTS[view][n] for n in names], float))
        uv = warp(grid).astype(np.float32).reshape(h, w, 2)
        skin, mask = extend_skin(crop_view(composite, column))
        tex = cv2.remap(skin, uv[..., 0], uv[..., 1], cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REPLICATE)
        cv2.imwrite(str(out_dir / f"hand-{view}.jpg"), tex, [cv2.IMWRITE_JPEG_QUALITY, 90])
        # Mean skin colour (linear RGB) so the shader can re-tone it to any skin.
        lin = (crop_view(composite, column)[mask > 0][:, ::-1] / 255.0) ** 2.2
        meta["mean"][view] = lin.mean(axis=0).round(4).tolist()

    (out_dir / "hand-textures.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps(meta))

    if "--preview" in sys.argv:
        preview(positions, out_dir, sys.argv[sys.argv.index("--preview") + 1])


def preview(p, out_dir, path):
    """Model vertices coloured from each texture, front and back, to check alignment."""
    views = []
    for view, sign in (("dorsal", 1), ("palmar", -1)):
        tex = cv2.imread(str(out_dir / f"hand-{view}.jpg"))
        u = ((p[:, 0] - FRAME["x0"]) * PX_PER_UNIT).astype(int).clip(0, tex.shape[1] - 1)
        v = ((FRAME["y1"] - p[:, 1]) * PX_PER_UNIT).astype(int).clip(0, tex.shape[0] - 1)
        img = np.full((620, 440, 3), 40, np.uint8)
        order = np.argsort(sign * p[:, 2])
        for i in order:
            if p[i, 1] < FRAME["y0"]:
                continue
            x = int((p[i, 0] - FRAME["x0"]) * 42 + 10) if sign > 0 else int((FRAME["x1"] - p[i, 0]) * 42 + 10)
            y = int((FRAME["y1"] - p[i, 1]) * 42)
            if 0 <= x < 440 and 0 <= y < 620:
                img[y, x] = tex[v[i], u[i]]
        views.append(img)
    cv2.imwrite(path, np.hstack(views))


if __name__ == "__main__":
    main()
