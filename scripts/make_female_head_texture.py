"""
Turns the try-on head scan's skin map (public/models/head/head-color.jpg, a man
with stubble and a shaved scalp) into smooth, softer skin for a female model:
  public/models/head/head-color-female.jpg

- stubble on the chin, jaw and neck, and the shaved scalp's grey shadow, are
  lifted out (a grey closing removes small dark hairs) and warmed back to skin;
- the eyebrows are thinned and lightened;
- the lips and cheeks get a little more rose, with a soft lash line on the eyelids.
Eyes, lips, nostrils and ears are left alone. Regions are in the map's pixels
(1024 x 1024; face in the middle, ears at the sides, scalp along the top).

    python scripts/make_female_head_texture.py
"""

import cv2
import numpy as np

SRC = "public/models/head/head-color.jpg"
OUT = "public/models/head/head-color-female.jpg"


def ellipse(shape, centre, axes, feather):
    m = np.zeros(shape[:2], np.float32)
    cv2.ellipse(m, centre, axes, 0, 0, 360, 1.0, -1)
    return cv2.GaussianBlur(m, (0, 0), feather)


def main():
    img = cv2.imread(SRC).astype(np.float32)
    h, w = img.shape[:2]

    # Features to keep exactly as they are.
    keep = np.maximum.reduce([
        ellipse(img.shape, (432, 305), (62, 26), 4),   # eyes
        ellipse(img.shape, (588, 305), (62, 26), 4),
        ellipse(img.shape, (510, 478), (66, 26), 4),   # lips
        ellipse(img.shape, (512, 405), (44, 26), 4),   # nostrils
        ellipse(img.shape, (255, 370), (60, 95), 6),   # ears
        ellipse(img.shape, (770, 370), (60, 95), 6),
    ])

    # Where hair grows on the scan: beard and neck, and the scalp.
    beard = np.maximum(
        ellipse(img.shape, (515, 585), (230, 240), 30),
        ellipse(img.shape, (512, 730), (170, 90), 30),
    )
    scalp = np.zeros((h, w), np.float32)
    scalp[:330, :] = 1.0
    scalp = cv2.GaussianBlur(scalp, (0, 0), 40)
    scalp *= 1 - ellipse(img.shape, (512, 175), (190, 120), 30)  # the forehead is clean already
    hair = np.clip(np.maximum(beard, scalp) * (1 - keep), 0, 1)

    # A grey closing (dilate, then erode) fills in small dark hairs with the skin around them.
    k = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11))
    closed = cv2.morphologyEx(img, cv2.MORPH_CLOSE, k)
    closed = cv2.morphologyEx(closed, cv2.MORPH_CLOSE, k)

    # Warm it back to skin: match the hair areas' broad colour to the clean cheeks and forehead.
    clean = np.maximum(ellipse(img.shape, (420, 380), (40, 40), 1), ellipse(img.shape, (512, 170), (120, 60), 1))
    skin = (img * clean[..., None]).sum((0, 1)) / clean.sum()
    # Keep only the broad shading of the hair areas (the stubble lives in the finer detail).
    broad = cv2.GaussianBlur(closed, (0, 0), 18)
    warmed = broad * 0.25 + skin * 0.75 + (broad - cv2.GaussianBlur(broad, (0, 0), 60)) * 0.5

    # Fine skin texture from the clean forehead, so the filled areas aren't waxy.
    detail = img - cv2.GaussianBlur(img, (0, 0), 3)
    fh = detail[110:250, 360:660]
    tiles = np.tile(fh, (h // fh.shape[0] + 1, w // fh.shape[1] + 1, 1))[:h, :w]
    smooth = warmed + tiles * 0.8

    out = img * (1 - hair[..., None]) + smooth * hair[..., None]

    # Eyebrows: thinner and lighter (lift the darkest hairs most).
    brows = np.maximum(ellipse(img.shape, (440, 262), (72, 16), 5), ellipse(img.shape, (585, 262), (72, 16), 5))
    lifted = cv2.morphologyEx(out, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (13, 13)))
    out = out * (1 - brows[..., None] * 0.72) + lifted * brows[..., None] * 0.72

    # A little more rose on the lips and cheeks (BGR).
    lips = ellipse(img.shape, (510, 478), (60, 20), 5)
    out = out * (1 - lips[..., None] * 0.35) + (out * np.array([0.86, 0.8, 1.08])) * lips[..., None] * 0.35
    cheeks = np.maximum(ellipse(img.shape, (405, 395), (55, 45), 25), ellipse(img.shape, (618, 395), (55, 45), 25))
    out = out * (1 - cheeks[..., None] * 0.25) + (out * np.array([0.94, 0.93, 1.04])) * cheeks[..., None] * 0.25

    # The scan's red inner eye corners, toned down to skin.
    for c in ((467, 301), (560, 301)):
        dot = ellipse(img.shape, c, (9, 7), 3)
        calm = cv2.morphologyEx(out, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
        calm = cv2.GaussianBlur(calm, (0, 0), 4)
        out = out * (1 - dot[..., None]) + calm * dot[..., None]

    # Soft makeup: a fine lash line along each closed eyelid, and a little deeper rose on the lips.
    for cx in (432, 588):
        lash = np.zeros((h, w), np.float32)
        cv2.ellipse(lash, (cx, 298), (48, 6), 0, 10, 170, 1.0, 2)
        lash = cv2.GaussianBlur(lash, (0, 0), 1.2)
        out = out * (1 - lash[..., None] * 0.55) + np.array([45, 36, 40]) * lash[..., None] * 0.55
    out = out * (1 - lips[..., None] * 0.12) + (out * np.array([0.84, 0.8, 1.05])) * lips[..., None] * 0.12

    cv2.imwrite(OUT, np.clip(out, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])
    print("wrote", OUT)


if __name__ == "__main__":
    main()
