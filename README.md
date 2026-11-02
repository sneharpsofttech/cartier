# DAZORA ring creator (Next.js + React Three Fiber)

The brand name "DAZORA" appears in `components/steps/SiteHeader.tsx`,
`SiteFooter.tsx` and the page titles.

Pages:

| Page | What it is |
| --- | --- |
| `/` | Home: bridal hero, category cards, custom ring banner, shop by category, best sellers |
| `/collections/{handle}` | Fine jewelry collections (`fine-jewelry`, `earrings`, `necklaces`, `bracelets`, `wedding-bands`, `gemstone-rings`, `lab-grown-jewelry`, `gemstone-jewelry`, `sale`, `gifts-under-1000`, `gifts-under-2000`) with a filter sidebar |
| `/products/{slug}` | Jewelry product page: photo, interactive 3D view, add to bag |
| `/search?q=` | Search across settings and jewelry |
| `/settings` | Engagement ring settings: 24 designs, filter by style, metal and price |
| `/settings/{slug}` | Setting product page with the 3D builder and hand try-on |
| `/diamonds`, `/diamonds/{id}` | Stone list and stone detail |
| `/review` | The finished ring, priced and totalled |

The theme is a warm cream boutique: cream pages, beige bands, square black buttons, a
brown accent and footer, and Marcellus (bundled from `@fontsource`) for headings and text.
Black is used sparingly through the `.noir` class, which redefines the colour tokens for its
section. Colours are tokens at the top of `app/globals.css`; `.ghost` draws the large pale
words behind section titles.

Every page shares one storefront look: announcement bar, contact strip, centred logo,
navigation with mega menus (`lib/catalog/menu.ts`), a bag drawer (kept in the browser's
localStorage; checkout is not connected) and a dark footer.

The 3D builder only opens on a setting's product page. Each setting is a starting
design (head and shank) that the builder can change from there.

The 3D builder is an interactive ring configurator: the ring slowly auto-rotates on a white studio
background with a soft floor shadow, and you can drag to orbit or scroll to zoom.
The Ring Builder panel rebuilds the ring live:

- **Head:** type (classic prong, hidden halo, single halo, double halo), 10 stone
  shapes, carat size (0.25 to 5 ct), centre gem, head metal
- **Shank:** 11 styles (solitaire, knife edge, pavé, graduated, double row, channel,
  split shank, twist, marquise vine, marquise side stones, tapered baguette),
  accent gems, shank metal
- **Band:** optional stacked wedding band (plain, knife edge, pavé eternity, twist)

Every build is saved in the URL, so **Share** copies a link that reopens it exactly.

## Ring creator: stone, setting, review

The site is a three-step ring creator:

1. **Choose stone:** `/diamonds`. Browse natural diamonds, lab-grown diamonds and
   coloured gemstones. You can filter by shape, carat, colour (white D–J or fancy),
   clarity, cut, budget, Hearts & Arrows, and advanced filters (polish, symmetry,
   fluorescence, lab, depth, table). Results show in a grid or list, with sorting
   and pages. Each stone has a detail page at `/diamonds/{id}`.
2. **Choose setting:** `/settings`, then a setting's page `/settings/{slug}`, which
   has the 3D builder. A chosen stone sets the centre stone's shape, size and colour.
3. **Review:** `/review`, with the stone, setting and band priced and totalled.

Every step keeps its state in the URL, so any page can be bookmarked or shared,
and moving between steps never loses earlier choices.

### API

| Endpoint | What it returns |
| --- | --- |
| `GET /api/diamonds` | Search results: `items`, `total`, `page`, `pageSize`, `pageCount`, and slider `bounds` |
| `GET /api/diamonds/{id}` | One stone by stock number (404 if unknown) |
| `GET /api/diamonds/options` | Every accepted filter value, best grade first |
| `GET /api/products` | Fine jewelry; takes `collection`, `type`, `gem`, `metal`, `origin`, `shape`, `style`, `accent`, `designer`, `price_min`, `price_max` |
| `GET /api/products/{slug}` | One jewelry piece |
| `GET /api/collections` | Every collection with its product count |
| `GET /api/settings` | Setting list; takes `style`, `metal`, `price_min`, `price_max`, `sort` |
| `GET /api/settings/{slug}` | One setting with its prices and builder design |
| `GET /api/ring/quote` | Price of a complete ring: `stone`, `setting`, `total` |

`/api/diamonds` takes the same parameters as the stone list's URL:

```
/api/diamonds?diamond_type=labgrown&color_type=White&shape=oval,pear
  &carat_min=1&carat_max=2&color_min=D&color_max=G&clarity_min=VVS2&clarity_max=VS2
  &cut_min=Ideal&cut_max=Excellent&price_min=500&price_max=3000
  &sort=price-asc&page=1&page_size=12
```

All parameters are optional. The full list is in `app/api/diamonds/route.ts`.
`/api/ring/quote` takes the builder's URL parameters plus `stone`, for example
`/api/ring/quote?setting=delphine&stone=ND-117794&band=eternity`.

### Inventory

The stones come from a built-in demo inventory of about 8,300 stones with
realistic grading and pricing (`lib/diamonds/generate.ts`). It's the same on every
run. To sell real stock, replace `generateInventory()` in `lib/diamonds/store.ts`
with your supplier's feed (for example Nivoda, RapNet or VDB) and map each record
to the `Stone` type in `lib/diamonds/types.ts`. The API, filters and pages need
no other changes. Setting prices are in `lib/pricing.ts`.

Stone photos (`public/stones/{shape}-{tint}.webp`) are 3D renders of each shape
and colour, made with `python scripts/render_thumbnails.py stones`.

## Hand try-on

The hand button in the viewer toolbar shows the ring on a 3D hand that spins and
zooms like the ring view, with a skin tone picker (Fair, Light, Medium, Tan, Brown,
Deep). Links can open straight into it: `?view=hand&skin=brown`.

- **Hand shape:** a scanned left hand, "hand" by
  [kevinruiz](https://sketchfab.com/3d-models/hand-a43c9c9059b24e2aa4af08d1a76f0916)
  (CC BY 4.0, via Wikimedia Commons), prepared by `scripts/make_hand_model.py`. That
  script stands the hand up, finds the ring finger and scales the hand so the ring
  fits it, marks the fingernails, and bakes shading into the creases.
- **Skin of the hand:** the back-of-hand and palm views from your reference picture
  (`scripts/hand-source/hand-reference.webp`) are warped onto the model by
  `scripts/make_hand_textures.py`, matching fingertips, knuckles, finger webs and
  wrist, so veins, creases and nails land on the right fingers. They're stored
  relative to their average colour, so every skin tone keeps the detail.
- **Fine skin texture and the forearm:** real pores and fine lines from a photo,
  made by `scripts/make_skin_detail.py` ("Raised Arm of Woman" by Vera Emilie on
  [Pexels](https://www.pexels.com/photo/20805371/)). It's all combined in the skin
  shader in `components/viewer/tryon/skinMaterial.ts`.

To rebuild the hand (needs `numpy` and `opencv-python`):

```bash
python scripts/make_hand_model.py 3D_model_of_a_human_hand.stl public/models
python scripts/make_skin_detail.py scripts/hand-source/pexels-20805371-vera-emilie.jpg public/models/skin-detail.png
python scripts/make_hand_textures.py scripts/hand-source/hand-reference.webp public/models
```

To use a different reference picture, update the landmark positions at the top
of `make_hand_textures.py` and the averages it prints into
`components/viewer/tryon/hands.ts`.

The STL is at
https://commons.wikimedia.org/wiki/File:3D_model_of_a_human_hand.stl.

## Using your own ring model

Put a GLB file at `public/models/ring.glb`, then restart the dev server (or rebuild).
The viewer re-skins it with its own materials, sorting meshes by mesh or material name:

| Name contains                                  | Material            |
| ---------------------------------------------- | ------------------- |
| `gem`, `diamond`, `stone`, `ruby`, `crystal`…  | Centre gem          |
| …plus `side`, `melee`, `accent`, `pave`        | Side gems           |
| anything else                                  | Metal               |

Without a model, the ring is generated from the builder settings. With a model,
the panel only offers the gem and metal colours, since the geometry comes from the file.

## Where things live

- `app/page.tsx`: home page; `components/steps/`: header, footer, step bar
- `lib/catalog/`: jewelry products, collections, menu; `components/catalog/`: collection grid and
  filter sidebar; `components/product/`: jewelry product page parts
- `components/viewer/JewelryPiece.tsx`: earrings, pendants, bracelets, bands and gemstone rings
  built from the ring builder's 3D parts
- `app/settings/`, `components/settings/`, `lib/settings/catalog.ts`: setting list,
  setting product pages and the settings catalog
- `components/viewer/RingViewer.tsx`: 3D studio layout, toolbar, settings, URL sync
- `components/viewer/BuilderPanel.tsx`: the Ring Builder editing panel
- `components/viewer/Scene.tsx`: camera, auto-rotation, studio lighting, shadow
- `components/viewer/materials.tsx`: metal and refractive gem materials
- `components/viewer/ring/config.ts`: all builder options, defaults and presets
- `components/viewer/ring/shapes.ts`: stone outlines and faceted cut geometry
- `components/viewer/ring/Head.tsx`, `Shank.tsx`: the ring parts
- `components/viewer/tryon/`: 3D hand try-on and skin shader
- `app/diamonds/`, `components/diamonds/`: stone list and stone detail pages
- `app/review/`: review page (step 3)
- `app/api/`: the diamond, settings and quote API
- `lib/diamonds/`: grades, inventory, search and links between the steps

## Style thumbnails

The shank and band style pictures in the builder (`public/thumbs/`) are real
renders of each style. After changing a style's geometry, re-render them with the
dev server running:

```bash
python scripts/render_thumbnails.py styles
```

(needs `numpy`, `opencv-python`, and Edge or Chrome). It screenshots the dev-only
page `/dev/thumbnail?kind=shank&style=pave` for each style.

Ring photos for the setting list (`public/rings/{slug}-{metal}.webp`, yellow, white
and rose gold) and the loose stone images (`public/stones/`) come from the same
script:

```bash
python scripts/render_thumbnails.py settings
python scripts/render_thumbnails.py stones
python scripts/render_thumbnails.py products
```

`products` renders every jewelry piece to `public/jewelry/{slug}.webp`.

Add names to render only some, for example `settings aurora-yellow delphine-rose`.
