"""Extract real skin micro-texture from the hand photo as a seamless tile.

Usage: python scripts/make_skin_detail.py <photo.jpg> <out.png> [--preview preview.png]

Takes an evenly lit patch of forearm from the photo ("Raised Arm of Woman" by
Vera Emilie, Pexels License), removes its large-scale shading so only the skin
detail is left (pores, fine lines, slight blotchiness), and makes it tile with no
seams. The 3D hand wraps it over its surface as colour variation and bumps.
"""
import sys

import cv2
import numpy as np

# Forearm patch in the full-size photo (x0, y0, size), lit evenly from the front.
PATCH = (1050, 2750, 360)
OUT_SIZE = 256


def seamless(u):
    """Make the tile wrap with no seams, keeping its detail intact.

    Periodic + smooth decomposition (Moisan, 2011): subtract the smooth image
    whose only job is to absorb the jumps across opposite edges.
    """
    m, n = u.shape
    v = np.zeros_like(u)
    v[0, :] += u[-1, :] - u[0, :]
    v[-1, :] += u[0, :] - u[-1, :]
    v[:, 0] += u[:, -1] - u[:, 0]
    v[:, -1] += u[:, 0] - u[:, -1]
    q = np.arange(m).reshape(m, 1)
    r = np.arange(n).reshape(1, n)
    denom = 2 * np.cos(2 * np.pi * q / m) + 2 * np.cos(2 * np.pi * r / n) - 4
    denom[0, 0] = 1
    smooth = np.real(np.fft.ifft2(np.fft.fft2(v) / denom))
    smooth -= smooth.mean()
    return u - smooth


def main():
    src, out = sys.argv[1], sys.argv[2]
    x0, y0, size = PATCH
    img = cv2.imread(src)[y0 : y0 + size, x0 : x0 + size].astype(np.float32)
    lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Soften and downsample first: it averages away the photo's JPEG block artefacts.
    lum = cv2.GaussianBlur(lum, (0, 0), 1.1)
    lum = cv2.resize(lum, (OUT_SIZE, OUT_SIZE), interpolation=cv2.INTER_AREA)
    # Divide out the shading (broad blur) to keep only the skin's own detail.
    detail = lum / np.maximum(cv2.GaussianBlur(lum, (0, 0), 10), 1)
    # Clip outliers (a mole, a stray hair) so no single mark repeats visibly.
    lo, hi = np.percentile(detail, [1.5, 98.5])
    detail = seamless(np.clip(detail, lo, hi))

    # Centre on mid-grey (0.5 = no change) with a fixed contrast.
    detail = (detail - detail.mean()) / (detail.std() * 6) + 0.5
    cv2.imwrite(out, np.clip(detail * 255, 0, 255).astype(np.uint8))

    if "--preview" in sys.argv:
        tiled = np.tile(np.clip(detail, 0, 1), (2, 2))
        cv2.imwrite(sys.argv[sys.argv.index("--preview") + 1], (tiled * 255).astype(np.uint8))
    print(out)


if __name__ == "__main__":
    main()
