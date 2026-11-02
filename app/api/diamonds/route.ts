import { NextResponse, type NextRequest } from "next/server";
import { parseQuery, searchStones } from "@/lib/diamonds/query";
import { getInventory } from "@/lib/diamonds/store";

/**
 * GET /api/diamonds — search the stone inventory.
 *
 * Query parameters (all optional):
 *   diamond_type   natural | labgrown | gemstone            (default natural)
 *   color_type     White | Fancy                             (diamonds)
 *   shape          comma list: round,oval,pear,emerald,...
 *   carat_min, carat_max, price_min, price_max
 *   color_min, color_max       D..J
 *   clarity_min, clarity_max   FL..I1
 *   cut_min, cut_max           Ideal..Good
 *   fancy_color    comma list: Yellow,Pink,Blue,Green        (color_type=Fancy)
 *   variety        comma list: Sapphire,Ruby,Emerald,...     (gemstones)
 *   hearts_arrows  1
 *   polish, symmetry           minimum grade: Excellent | Very Good | Good
 *   fluorescence   comma list: None,Faint,Medium,Strong
 *   lab            comma list: GIA,IGI
 *   depth_min, depth_max, table_min, table_max   (percent)
 *   sort           price-asc | price-desc | carat-asc | carat-desc | newest
 *   page, page_size            (page_size max 60)
 */
export function GET(request: NextRequest) {
  const query = parseQuery(request.nextUrl.searchParams);
  const result = searchStones(getInventory(), query);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
