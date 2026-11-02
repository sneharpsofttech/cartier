"""Turn the hand scan (STL) into the try-on hand: public/models/hand.glb + hand.json.

Usage: python scripts/make_hand_model.py <hand.stl> <out_dir> [--preview preview.png]

Source: "hand" by kevinruiz (https://sketchfab.com/3d-models/hand-a43c9c9059b24e2aa4af08d1a76f0916),
via Wikimedia Commons, CC BY 4.0. It is a left hand.

Steps: weld vertices, stand the hand up (fingers +Y, back of hand +Z, thumb +X),
find the ring finger from cross-sections, scale so that finger matches the
ring's inner radius (1 scene unit = the ring's centre-line radius), mark the
fingernails, bake ambient occlusion and curvature, and write a GLB with smooth
normals.
"""
import json
import struct
import sys
from pathlib import Path

import numpy as np

# Ring geometry in scene units (see components/viewer/ring/parts.tsx).
BAND_RADIUS = 1.0
BAND_TUBE = 0.075
# Leave a sliver of air between finger and band.
RING_CLEARANCE = 0.97

# Scan axes -> display axes: back of hand (+X) faces the camera (+Z),
# fingertips (-Y) point up (+Y), thumb (+Z) to the viewer's right (+X).
ORIENT = np.array([[0, 0, 1], [0, -1, 0], [1, 0, 0]], np.float64)


def load_stl(path):
    data = Path(path).read_bytes()
    n = struct.unpack("<I", data[80:84])[0]
    rec = np.dtype([("n", "<f4", 3), ("v", "<f4", (3, 3)), ("a", "<u2")])
    tris = np.frombuffer(data[84 : 84 + 50 * n], rec)["v"].astype(np.float64)
    verts, faces = np.unique(np.round(tris.reshape(-1, 3), 6), axis=0, return_inverse=True)
    return verts, faces.reshape(-1, 3)


def vertex_normals(v, f):
    fn = np.cross(v[f[:, 1]] - v[f[:, 0]], v[f[:, 2]] - v[f[:, 0]])  # area-weighted
    n = np.zeros_like(v)
    for k in range(3):
        np.add.at(n, f[:, k], fn)
    return n / (np.linalg.norm(n, axis=1, keepdims=True) + 1e-12)


def clusters_1d(xs, gap):
    """Split sorted 1-D values wherever consecutive values are further apart than `gap`."""
    order = np.argsort(xs)
    breaks = np.nonzero(np.diff(xs[order]) > gap)[0]
    return np.split(order, breaks + 1)


def finger_sections(v, y, band=0.012, gap=0.02):
    """Separate fingers at height y: clusters of vertices along x, thumb side last."""
    idx = np.nonzero(np.abs(v[:, 1] - y) < band)[0]
    groups = [idx[g] for g in clusters_1d(v[idx, 0], gap)]
    return sorted([g for g in groups if len(g) > 30], key=lambda g: v[g, 0].mean())


def ring_finger_axis(v):
    """Centroids of the ring finger (second from the little-finger side) up its length."""
    y_lo, y_hi = v[:, 1].min(), v[:, 1].max()
    centres = []
    for y in np.linspace(y_lo + 0.55 * (y_hi - y_lo), y_hi - 0.04 * (y_hi - y_lo), 40):
        secs = finger_sections(v, y)
        if len(secs) >= 4:  # little, ring, middle, index (thumb is lower down)
            centres.append(v[secs[1]].mean(axis=0))
    centres = np.array(centres)
    mean = centres.mean(axis=0)
    _, _, vt = np.linalg.svd(centres - mean)
    axis = vt[0] if vt[0][1] > 0 else -vt[0]
    return centres, mean, axis


def ring_seat(v, centres, axis):
    """Where the ring sits: at the base of the finger, just above the web."""
    y = centres[0][1] + 0.01  # lowest slice where the ring finger stands free
    ring = finger_sections(v, y, band=0.02)[1]
    pts = v[ring]
    centre = pts.mean(axis=0)
    # Cross-section measured perpendicular to the finger.
    rel = pts - centre
    radial = rel - np.outer(rel @ axis, axis)
    radius = np.percentile(np.linalg.norm(radial, axis=1), 97)
    return centre, radius


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def nail_mask(v, n, seat_y):
    """Soft mask over the nail plates: the back of each fingertip.

    Works in the unscaled, upright scan (fingers +Y, back of hand +Z, thumb +X).
    """
    mask = np.zeros(len(v))
    # The four fingers, separated where they stand free.
    for sec in finger_sections(v, seat_y + 0.17)[:4]:
        x0, x1 = v[sec, 0].min() - 0.01, v[sec, 0].max() + 0.01
        col = (v[:, 0] > x0) & (v[:, 0] < x1) & (v[:, 1] > seat_y + 0.1)
        tip_y = v[col, 1].max()
        mid_z = v[col & (v[:, 1] > tip_y - 0.15), 2].mean()
        length = 0.12  # about a nail's length at this scale
        # From the nail's base up to just short of the tip (the free edge curls over).
        w = smoothstep(tip_y - length, tip_y - length * 0.65, v[:, 1])
        w *= 1 - smoothstep(tip_y - 0.025, tip_y - 0.008, v[:, 1])
        w *= smoothstep(0.45, 0.75, n[:, 2]) * (v[:, 2] > mid_z)
        mask = np.maximum(mask, np.where(col, w, 0))

    # Thumb: right of the index finger and lower down. It is turned about 90 degrees
    # from the fingers, so its nail faces outward (+X) rather than back (+Z).
    thumb = (v[:, 0] > 0.47) & (v[:, 1] < seat_y + 0.22)
    tip_y = v[thumb, 1].max()
    facing = n @ (np.array([1.0, 0, 0.25]) / np.linalg.norm([1.0, 0, 0.25]))
    w = smoothstep(tip_y - 0.13, tip_y - 0.08, v[:, 1])
    w *= 1 - smoothstep(tip_y - 0.025, tip_y - 0.008, v[:, 1])
    w *= smoothstep(0.5, 0.78, facing) * thumb
    return np.maximum(mask, w)


def neighbour_mean(values, f, iterations=1):
    """Average each vertex's value with its mesh neighbours (light smoothing)."""
    edges = np.concatenate([f[:, [0, 1]], f[:, [1, 2]], f[:, [2, 0]]])
    edges = np.concatenate([edges, edges[:, ::-1]])
    count = np.bincount(edges[:, 0], minlength=len(values)).astype(np.float64)
    for _ in range(iterations):
        acc = np.zeros_like(values)
        np.add.at(acc, edges[:, 0], values[edges[:, 1]])
        shape = (-1,) + (1,) * (values.ndim - 1)
        values = 0.5 * values + 0.5 * acc / np.maximum(count, 1).reshape(shape)
    return values


def bake_ao(v, n, f, voxel=0.1, rays=32, reach=3.0):
    """Ambient occlusion per vertex: how much of the sky each point can see.

    Rays are marched through a voxelised copy of the surface; creases between the
    fingers and under the knuckles see less sky and come out darker.
    """
    lo = v.min(0) - reach - voxel
    dims = np.ceil((v.max(0) + reach + voxel - lo) / voxel).astype(int)
    grid = np.zeros(dims, bool)
    samples = np.concatenate([v, v[f].mean(axis=1)] + [v[f[:, a]] * 0.5 + v[f[:, b]] * 0.5 for a, b in ((0, 1), (1, 2), (2, 0))])
    idx = ((samples - lo) / voxel).astype(int)
    grid[idx[:, 0], idx[:, 1], idx[:, 2]] = True

    # Cosine-weighted directions over a hemisphere (Fibonacci spiral).
    k = np.arange(rays) + 0.5
    r = np.sqrt(k / rays)
    phi = k * np.pi * (3 - np.sqrt(5))
    local = np.column_stack([r * np.cos(phi), r * np.sin(phi), np.sqrt(1 - r * r)])

    steps = np.arange(0.25, reach, voxel * 0.8)
    falloff = 1 - steps / reach
    ao = np.ones(len(v))
    for start in range(0, len(v), 3000):
        nn = n[start : start + 3000]
        helper = np.where(np.abs(nn[:, [0]]) < 0.9, [[1.0, 0, 0]], [[0, 1.0, 0]])
        t1 = np.cross(nn, helper)
        t1 /= np.linalg.norm(t1, axis=1, keepdims=True)
        t2 = np.cross(nn, t1)
        dirs = local[None, :, 0, None] * t1[:, None] + local[None, :, 1, None] * t2[:, None] + local[None, :, 2, None] * nn[:, None]
        occluded = np.zeros(dirs.shape[:2])
        alive = np.ones(dirs.shape[:2], bool)
        for t, w in zip(steps, falloff):
            p = ((v[start : start + 3000, None] + dirs * t - lo) / voxel).astype(int)
            hit = grid[p[..., 0], p[..., 1], p[..., 2]] & alive
            occluded += hit * w
            alive &= ~hit
        ao[start : start + 3000] = 1 - occluded.mean(axis=1)
    return neighbour_mean(ao, f, 2)


def bake_curvature(v, n, f):
    """Signed curvature per vertex: +1 on ridges (knuckles), -1 in creases."""
    lap = neighbour_mean(v, f, 1) - v  # points inward on bumps, outward in dips
    edge = np.linalg.norm(v[f[:, 0]] - v[f[:, 1]], axis=1).mean()
    curv = -(lap * n).sum(axis=1) / edge
    # Fingers are cylinders, so nearly everything is convex; measure against the
    # typical value so only real ridges and creases stand out.
    curv -= np.median(curv)
    curv = np.clip(curv / np.percentile(np.abs(curv), 95), -1, 1)
    return neighbour_mean(curv, f, 3)


def write_glb(path, positions, normals, colors, faces):
    pos = positions.astype(np.float32).tobytes()
    nor = normals.astype(np.float32).tobytes()
    col = (np.clip(colors, 0, 1) * 255).astype(np.uint8).tobytes()
    idx = faces.astype(np.uint32).tobytes()
    pad = lambda b: b + b"\0" * (-len(b) % 4)
    chunks = [pad(pos), pad(nor), pad(col), pad(idx)]
    offsets = np.cumsum([0] + [len(c) for c in chunks])
    n = len(positions)
    gltf = {
        "asset": {"version": "2.0", "generator": "make_hand_model.py", "copyright": "hand by kevinruiz, CC BY 4.0"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"mesh": 0, "name": "Hand"}],
        "meshes": [{"name": "Hand", "primitives": [{
            "attributes": {"POSITION": 0, "NORMAL": 1, "COLOR_0": 2},
            "indices": 3,
        }]}],
        "buffers": [{"byteLength": int(offsets[-1])}],
        "bufferViews": [
            {"buffer": 0, "byteOffset": int(offsets[0]), "byteLength": len(pos), "target": 34962},
            {"buffer": 0, "byteOffset": int(offsets[1]), "byteLength": len(nor), "target": 34962},
            {"buffer": 0, "byteOffset": int(offsets[2]), "byteLength": len(col), "byteStride": 4, "target": 34962},
            {"buffer": 0, "byteOffset": int(offsets[3]), "byteLength": len(idx), "target": 34963},
        ],
        "accessors": [
            {"bufferView": 0, "componentType": 5126, "count": n, "type": "VEC3",
             "min": positions.min(0).tolist(), "max": positions.max(0).tolist()},
            {"bufferView": 1, "componentType": 5126, "count": n, "type": "VEC3"},
            {"bufferView": 2, "componentType": 5121, "normalized": True, "count": n, "type": "VEC4"},
            {"bufferView": 3, "componentType": 5125, "count": int(faces.size), "type": "SCALAR"},
        ],
    }
    js = json.dumps(gltf, separators=(",", ":")).encode()
    js += b" " * (-len(js) % 4)
    bin_ = b"".join(chunks)
    total = 12 + 8 + len(js) + 8 + len(bin_)
    with open(path, "wb") as fh:
        fh.write(struct.pack("<III", 0x46546C67, 2, total))
        fh.write(struct.pack("<II", len(js), 0x4E4F534A) + js)
        fh.write(struct.pack("<II", len(bin_), 0x004E4942) + bin_)


def preview(v, mask, path):
    """Front and side point views with the nail mask in red, for checking."""
    import cv2

    def view(px, py, depth):
        img = np.full((520, 520, 3), 30, np.uint8)
        lo, hi = min(px.min(), py.min()), max(px.max(), py.max())
        k = 500 / (hi - lo)
        for i in np.argsort(depth):
            x, y = int((px[i] - lo) * k + 10), int((hi - py[i]) * k + 10)
            m = mask[i]
            img[y, x] = (int(180 * (1 - m)), int(180 * (1 - m)), int(180 + 75 * m))
        return img

    cv2.imwrite(path, np.hstack([view(v[:, 0], v[:, 1], v[:, 2]), view(-v[:, 2], v[:, 1], v[:, 0])]))


def main():
    src, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)

    v, f = load_stl(src)
    v = v @ ORIENT.T
    centres, _, axis = ring_finger_axis(v)
    seat, radius = ring_seat(v, centres, axis)

    # Nails are found on the unscaled scan, then everything is scaled so the
    # ring finger fills the ring's inner radius, with the ring seat at the origin.
    mask = nail_mask(v, vertex_normals(v, f), seat[1])
    inner = (BAND_RADIUS - BAND_TUBE) * RING_CLEARANCE
    scale = inner / radius
    v = (v - seat) * scale
    n = vertex_normals(v, f)
    # Vertex colour channels: R = nail mask, G = ambient occlusion, B = curvature (0.5 = flat).
    ao = bake_ao(v, n, f)
    curv = bake_curvature(v, n, f)
    colors = np.column_stack([mask, ao, 0.5 + 0.5 * curv, np.ones_like(mask)])

    if "--preview" in sys.argv:
        preview(v, mask, sys.argv[sys.argv.index("--preview") + 1])

    write_glb(out_dir / "hand.glb", v, n, colors, f)
    meta = {
        "source": "hand by kevinruiz, Sketchfab / Wikimedia Commons, CC BY 4.0",
        "ringAxis": axis.tolist(),
        "bounds": {"min": v.min(0).round(4).tolist(), "max": v.max(0).round(4).tolist()},
        "scale": scale,
        "fingerRadius": radius * scale,
        "vertices": int(len(v)),
        "triangles": int(len(f)),
    }
    (out_dir / "hand.json").write_text(json.dumps(meta, indent=2))
    print(json.dumps(meta, indent=2))


if __name__ == "__main__":
    main()
