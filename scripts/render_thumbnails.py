"""Render the builder's 3D images: style thumbnails and loose-stone photos.

Needs the dev server running (npm run dev) and Microsoft Edge or Chrome.
Usage: python scripts/render_thumbnails.py [styles|stones|settings|products|heroes|all] [name ...] [--base http://localhost:3000] [--views 1,2,3,4]

  styles:   every shank and band style       -> public/thumbs/{kind}-{style}.webp
  stones:   every stone shape and colour     -> public/stones/{shape}-{tint}.webp
  settings: every ring setting in each gold  -> public/rings/{slug}-{metal}.webp
  products: every fine jewellery piece       -> public/jewelry/{slug}.webp, plus {slug}-2/-3/-4.webp from other angles
            (--views picks which of the four, e.g. --views 2,3,4 to leave the main photos alone)
  heroes:   home page shots on a dark backdrop -> public/hero/{name}.webp

Each image is drawn by the dev-only page /dev/thumbnail and screenshotted
headless. Style thumbnails are trimmed to the ring; stone photos keep a fixed
frame so they line up in the stone list grid.
"""
import os
import re
import subprocess
import sys
import tempfile
import time
from pathlib import Path

import json
import urllib.request

import cv2
import numpy as np

# Every shank style is read from SHANK_STYLES in components/viewer/ring/config.ts, so new ones get thumbnails.
_CONFIG = (Path(__file__).resolve().parent.parent / "components/viewer/ring/config.ts").read_text(encoding="utf-8")
_BLOCK = _CONFIG[_CONFIG.index("export const SHANK_STYLES") :]
SHANKS = re.findall(r'\{ id: "(\w+)"', _BLOCK[: _BLOCK.index("];")])
# Keep in step with BAND_STYLES in components/viewer/ring/config.ts.
BANDS = ["plain", "knifeEdge", "eternity", "twist"]
# Keep in step with SHAPES and TINTS in lib/diamonds/grades.ts.
STONE_SHAPES = ["round", "oval", "pear", "emerald", "princess", "radiant", "marquise", "cushion", "asscher", "heart"]
STONE_TINTS = ["white", "yellow", "pink", "blue", "green", "red", "peach"]
STONE_SIZE = 640
# Setting slugs are read from /api/settings; photos cover the gold colours (see photoMetal()).
SETTING_METALS = ["yellow", "white", "rose"]
SETTING_SIZE = 600

SIZE = 240
# Dark-backdrop shots for the home page: (output name, thumbnail page query).
HEROES = [
    ("delphine-yellow", "kind=setting&style=delphine&metal=yellow"),
    ("seraphine-yellow", "kind=setting&style=seraphine&metal=yellow"),
    ("aurora-white", "kind=setting&style=aurora&metal=white"),
    ("pendant", "kind=product&style=14k-white-gold-1-25ctw-sapphire-double-halo-pendant"),
    ("earrings", "kind=product&style=14k-white-gold-1-30ctw-sapphire-and-diamond-halo-earrings"),
    ("bracelet", "kind=product&style=14k-yellow-gold-3-50ctw-emerald-and-diamond-tennis-bracelet"),
]
HERO_BG = (11, 14, 18)  # BGR of #120e0b, the page's HERO_BACKDROP
HERO_SIZE = 900
BROWSERS = [
    os.environ.get("BROWSER_PATH", ""),
    r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    r"C:\Program Files\Google\Chrome\Application\chrome.exe",
]


def screenshot(browser, url, out, profile, window=600, scale=1):
    subprocess.run(
        [
            browser, "--headless=new", "--use-angle=swiftshader", "--enable-unsafe-swiftshader",
            f"--user-data-dir={profile}", f"--window-size={window},{window}", f"--force-device-scale-factor={scale}", "--hide-scrollbars",
            "--virtual-time-budget=25000", f"--screenshot={out}", url,
        ],
        capture_output=True,
    )
    # On Windows the browser launcher can exit before the headless page finishes.
    deadline = time.time() + 90
    while time.time() < deadline:
        if out.exists() and out.stat().st_size > 0:
            time.sleep(0.5)  # let the write finish
            return
        time.sleep(0.5)
    raise RuntimeError(f"No screenshot for {url}")


def trim_square(path, margin=0.08, size=SIZE, bg=(255, 255, 255)):
    """Crop to the piece (pixels that differ from the backdrop), pad to a square and resize."""
    img = cv2.imread(str(path))
    mask = (np.abs(img.astype(np.int16) - np.array(bg, np.int16)).max(axis=2) > 10).astype(np.uint8)
    ys, xs = np.nonzero(mask)
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    side = int(max(x1 - x0, y1 - y0) * (1 + 2 * margin))
    cx, cy = (x0 + x1) // 2, (y0 + y1) // 2
    canvas = np.full((side, side, 3), bg, np.uint8)
    sx0, sy0 = max(0, cx - side // 2), max(0, cy - side // 2)
    crop = img[sy0 : sy0 + side, sx0 : sx0 + side]
    ox, oy = (side - crop.shape[1]) // 2, (side - crop.shape[0]) // 2
    canvas[oy : oy + crop.shape[0], ox : ox + crop.shape[1]] = crop
    return cv2.resize(canvas, (size, size), interpolation=cv2.INTER_AREA)


def stone_photo(path):
    """Keep the centre of the frame (the stone fills it consistently) at a fixed size."""
    img = cv2.imread(str(path))
    h, w = img.shape[:2]
    m = int(min(h, w) * 0.1)
    return cv2.resize(img[m : h - m, m : w - m], (STONE_SIZE, STONE_SIZE), interpolation=cv2.INTER_AREA)


def looks_rendered(photo):
    """A properly lit stone shows facets right across its middle; a flat fallback
    render is one pale, even tone there (only its outline has contrast)."""
    gray = cv2.cvtColor(photo, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    middle = gray[int(h * 0.38) : int(h * 0.62), int(w * 0.38) : int(w * 0.62)]
    return middle.std() > 14


def stone_has_facets(photo):
    """The centre stone sits in the upper middle of a front-on ring photo; when lit it shows dark facets."""
    gray = cv2.cvtColor(photo, cv2.COLOR_BGR2GRAY)
    h, w = gray.shape
    stone = gray[int(h * 0.2) : int(h * 0.6), int(w * 0.35) : int(w * 0.65)]
    return stone.min() < 150


def main():
    base = sys.argv[sys.argv.index("--base") + 1] if "--base" in sys.argv else "http://localhost:3000"
    modes = ("styles", "stones", "settings", "products", "heroes", "all")
    what = next((a for a in sys.argv[1:] if a in modes), "styles")
    # Every other argument (except --base and its value) names what to render.
    only = [a for i, a in enumerate(sys.argv[1:], 1) if a not in modes and not a.startswith("--") and sys.argv[i - 1] not in ("--base", "--views")]
    views = [int(v) for v in sys.argv[sys.argv.index("--views") + 1].split(",")] if "--views" in sys.argv else [1, 2, 3, 4]
    browser = next((b for b in BROWSERS if b and Path(b).exists()), None)
    if not browser:
        sys.exit("No Edge or Chrome found; set BROWSER_PATH.")
    public = Path(__file__).resolve().parent.parent / "public"

    with tempfile.TemporaryDirectory() as tmp:
        if what in ("styles", "all"):
            out_dir = public / "thumbs"
            out_dir.mkdir(parents=True, exist_ok=True)
            for kind, style in [("shank", s) for s in SHANKS] + [("band", b) for b in BANDS]:
                if only and f"{kind}-{style}" not in only:
                    continue
                raw = Path(tmp) / f"{kind}-{style}.png"
                screenshot(browser, f"{base}/dev/thumbnail?kind={kind}&style={style}", raw, Path(tmp) / "profile")
                cv2.imwrite(str(out_dir / f"{kind}-{style}.webp"), trim_square(raw), [cv2.IMWRITE_WEBP_QUALITY, 90])
                print(f"{kind}-{style}.webp")
        if what in ("stones", "all"):
            out_dir = public / "stones"
            out_dir.mkdir(parents=True, exist_ok=True)
            for shape in STONE_SHAPES:
                for tint in STONE_TINTS:
                    if only and f"{shape}-{tint}" not in only:
                        continue
                    # Headless rendering sometimes captures before the gem lighting is
                    # ready, giving a flat, washed-out stone; those are retried.
                    for attempt in range(4):
                        raw = Path(tmp) / f"stone-{shape}-{tint}-{attempt}.png"
                        # Captured at 2x so the listing grid gets a sharp photo on high-density screens.
                        screenshot(browser, f"{base}/dev/thumbnail?kind=stone&shape={shape}&tint={tint}", raw, Path(tmp) / f"profile{attempt}", scale=2)
                        photo = stone_photo(raw)
                        if looks_rendered(photo):
                            break
                    cv2.imwrite(str(out_dir / f"{shape}-{tint}.webp"), photo, [cv2.IMWRITE_WEBP_QUALITY, 88])
                    print(f"stones/{shape}-{tint}.webp (attempt {attempt + 1})", flush=True)
        if what in ("settings", "all"):
            out_dir = public / "rings"
            out_dir.mkdir(parents=True, exist_ok=True)
            with urllib.request.urlopen(f"{base}/api/settings") as response:
                setting_slugs = [item["slug"] for item in json.load(response)["items"]]
            for slug in setting_slugs:
                for metal in SETTING_METALS:
                    if only and f"{slug}-{metal}" not in only:
                        continue
                    # Retry captures taken before the gem lighting was ready (a flat, washed-out stone).
                    for attempt in range(3):
                        raw = Path(tmp) / f"setting-{slug}-{metal}-{attempt}.png"
                        screenshot(browser, f"{base}/dev/thumbnail?kind=setting&style={slug}&metal={metal}", raw, Path(tmp) / f"profile{attempt}", window=1100)
                        # Generous white space around the ring, like a catalogue photo.
                        photo = trim_square(raw, margin=0.07, size=SETTING_SIZE)
                        if stone_has_facets(photo):
                            break
                    cv2.imwrite(str(out_dir / f"{slug}-{metal}.webp"), photo, [cv2.IMWRITE_WEBP_QUALITY, 88])
                    print(f"rings/{slug}-{metal}.webp", flush=True)

        if what in ("products", "all"):
            out_dir = public / "jewelry"
            out_dir.mkdir(parents=True, exist_ok=True)
            with urllib.request.urlopen(f"{base}/api/products") as response:
                slugs = [p["slug"] for p in json.load(response)["items"]]
            for slug in slugs:
                if only and not any(o in slug for o in only):
                    continue
                for view in views:
                    name = slug if view == 1 else f"{slug}-{view}"
                    for attempt in range(3):
                        raw = Path(tmp) / f"product-{name}-{attempt}.png"
                        screenshot(browser, f"{base}/dev/thumbnail?kind=product&style={slug}&view={view}", raw, Path(tmp) / f"profile{attempt}", window=1100)
                        photo = trim_square(raw, margin=0.1, size=SETTING_SIZE)
                        if looks_rendered(photo):
                            break
                    cv2.imwrite(str(out_dir / f"{name}.webp"), photo, [cv2.IMWRITE_WEBP_QUALITY, 88])
                    print(f"jewelry/{name}.webp (attempt {attempt + 1})", flush=True)

        if what in ("heroes", "all"):
            out_dir = public / "hero"
            out_dir.mkdir(parents=True, exist_ok=True)
            for name, query in HEROES:
                if only and name not in only:
                    continue
                raw = Path(tmp) / f"hero-{name}.png"
                screenshot(browser, f"{base}/dev/thumbnail?{query}&bg=dark", raw, Path(tmp) / "profile", window=1100)
                photo = trim_square(raw, margin=0.12, size=HERO_SIZE, bg=HERO_BG)
                cv2.imwrite(str(out_dir / f"{name}.webp"), photo, [cv2.IMWRITE_WEBP_QUALITY, 90])
                print(f"hero/{name}.webp", flush=True)


if __name__ == "__main__":
    main()
