import { NextResponse, type NextRequest } from "next/server";
import { describe, fromSearchParams } from "@/components/viewer/ring/config";
import { SHAPES, shapeById } from "@/components/viewer/ring/shapes";
import { withStone } from "@/lib/diamonds/ring";
import { getStone } from "@/lib/diamonds/store";
import { quoteSetting } from "@/lib/pricing";
import { getSetting, settingConfig } from "@/lib/settings/catalog";

/**
 * GET /api/ring/quote — price a complete ring.
 *
 *   setting    slug of the setting the ring starts from (optional)
 *   stone      stock number of the centre stone (optional)
 *   + the ring builder's own parameters (head, shape, shank, band, metals...),
 *     exactly as they appear in the builder's URL, relative to the setting's design.
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const stoneId = params.get("stone");
  const stone = stoneId ? getStone(stoneId) : null;
  if (stoneId && !stone) return NextResponse.json({ error: `No stone with id ${stoneId}` }, { status: 404 });
  const slug = params.get("setting");
  const ring = slug ? getSetting(slug) : null;
  if (slug && !ring) return NextResponse.json({ error: `No setting called ${slug}` }, { status: 404 });
  const base = ring ? settingConfig(ring) : undefined;
  // The chosen stone decides the centre stone's shape, weight and colour.
  const config = withStone(fromSearchParams(params, { shapes: SHAPES.map((s) => s.id) }, base), stone);

  const setting = quoteSetting(config);
  return NextResponse.json({
    ring: ring ? { slug: ring.slug, name: ring.name, stock: ring.stock } : null,
    stone,
    setting: { description: describe(config, shapeById(config.shape).label), ...setting },
    total: setting.total + (stone?.price ?? 0),
    currency: "USD",
  });
}
