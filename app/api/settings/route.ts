import { NextResponse, type NextRequest } from "next/server";
import { parseSettingQuery, searchSettings, settingImage } from "@/lib/settings/catalog";

/**
 * GET /api/settings — ring settings (centre stone not included).
 *
 *   style      comma list: solitaire,bezel,halo,hidden-halo,pave,side-stone,vintage
 *   shape      comma list of centre stone shapes the settings are shown with
 *   designer   comma list: signature,atelier,eclat,heritage
 *   metal      white | yellow | rose | platinum (prices and photos for this metal; default yellow)
 *   price_min, price_max
 *   sort       featured | price-asc | price-desc | name
 */
export function GET(request: NextRequest) {
  const query = parseSettingQuery(request.nextUrl.searchParams);
  const { items, total, bounds } = searchSettings(query);
  return NextResponse.json({
    items: items.map((s) => ({ ...s, price: s.prices[query.metal], image: settingImage(s, query.metal) })),
    total,
    metal: query.metal,
    bounds,
  });
}
