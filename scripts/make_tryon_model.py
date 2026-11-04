"""
Prepares the earring try-on model photos (public/tryon/model/*.jpg) from the
supplied model picture: cuts out its four views (portrait, ear close-up,
profile and back; the small ones enlarged 2x) and paints out the earrings she wears in them, so the
earring being viewed can be drawn on each earlobe instead.

    python scripts/make_tryon_model.py <source image>
"""

import sys
import cv2
import numpy as np

# Each view: its box in the source picture, and the earring there (centre and radius, in the view's pixels).
VIEWS = {
    "portrait": ((0, 0, 859, 928), (595, 405), 32),
    "ear": ((874, 0, 1254, 388), (141, 270), 36),
    "profile": ((874, 398, 1254, 654), (237, 143), 15),
    "back": ((874, 663, 1254, 930), (270, 121), 17),
}

# Small bits of the old earring left showing (its post and back, from behind): centre and radius.
EXTRA = {"back": [((256, 118), 5), ((269, 110), 5), ((272, 131), 5)]}


def paint_out(img, centre, radius):
    """Fill the earring with the skin around it: its bright, grey stones and metal, found by colour, then grown a little."""
    h, w = img.shape[:2]
    disc = np.zeros((h, w), np.uint8)
    cv2.circle(disc, centre, int(radius * 1.4), 255, -1)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    # Skin is warm and saturated; the earring is pale and grey, or dark in its shadows.
    pale = (hsv[..., 1] < 70) & (hsv[..., 2] > 120)
    shade = hsv[..., 2] < 70
    mask = ((pale | shade) & (disc > 0)).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
    grow = max(4, radius // 3)
    mask = cv2.dilate(mask, np.ones((grow, grow), np.uint8))
    filled = cv2.inpaint(img, mask, max(3, radius // 4), cv2.INPAINT_TELEA)
    # The fill is smooth; give it back the photo's fine grain so it doesn't read as a smudge.
    grain = img.astype(np.float32) - cv2.GaussianBlur(img, (0, 0), 1.5).astype(np.float32)
    ring = cv2.dilate(mask, np.ones((radius, radius), np.uint8)) - mask
    sigma = grain[ring > 0].std() if (ring > 0).any() else 2
    if radius < 20:
        sigma = 0
    # The same in every channel (grain is in brightness, not colour), and gentler than measured.
    noise = np.random.default_rng(1).normal(0, sigma * 0.6, img.shape[:2]).astype(np.float32)[..., None]
    soft = cv2.GaussianBlur(mask, (0, 0), 1.2)[..., None].astype(np.float32) / 255
    out = filled.astype(np.float32) + noise * soft
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    src = cv2.imread(sys.argv[1])
    for name, ((x0, y0, x1, y1), centre, radius) in VIEWS.items():
        view = src[y0:y1, x0:x1].copy()
        view = paint_out(view, centre, radius)
        for spot, r in EXTRA.get(name, []):
            mask = np.zeros(view.shape[:2], np.uint8)
            cv2.circle(mask, spot, r, 255, -1)
            view = cv2.inpaint(view, mask, 4, cv2.INPAINT_TELEA)
        # The small views are enlarged 2x (with a light sharpen), so they hold up at the gallery's size.
        if view.shape[1] < 500:
            view = cv2.resize(view, None, fx=2, fy=2, interpolation=cv2.INTER_LANCZOS4)
            blur = cv2.GaussianBlur(view, (0, 0), 1.4)
            view = cv2.addWeighted(view, 1.45, blur, -0.45, 0)
        cv2.imwrite(f"public/tryon/model/{name}.jpg", view, [cv2.IMWRITE_JPEG_QUALITY, 94])
        print(name, view.shape[1], view.shape[0])


if __name__ == "__main__":
    main()
