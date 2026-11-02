import { NextResponse, type NextRequest } from "next/server";
import { DESIGNER_LABELS, PRODUCTS, productDesigner, productImage } from "@/lib/catalog/products";
import { getCollection, productItem } from "@/lib/catalog/collections";

/**
 * GET /api/products — the fine jewellery catalogue.
 *
 *   collection   a collection handle, e.g. earrings, wedding-bands, sale (see /api/collections)
 *   type         comma list: earrings,necklaces,bracelets,bands,rings
 *   gem, metal, origin, shape, style, accent, designer   comma lists, as on the collection page
 *   price_min, price_max
 */
export function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const handle = params.get("collection");
  const collection = handle ? getCollection(handle) : null;
  if (handle && !collection) return NextResponse.json({ error: `No collection called ${handle}` }, { status: 404 });

  const list = (key: string) => (params.get(key) ?? "").split(",").filter(Boolean);
  const facets = ["type", "gem", "metal", "origin", "shape", "style", "accent", "designer"].map((key) => [key, list(key)] as const);
  const lo = Number(params.get("price_min")) || 0;
  const hi = Number(params.get("price_max")) || Infinity;

  const items = PRODUCTS.filter(
    (p) =>
      (!collection || collection.includes(p)) &&
      facets.every(([key, wanted]) => !wanted.length || wanted.some((v) => productItem(p).facets[key].includes(v))) &&
      p.price >= lo &&
      p.price <= hi,
  );
  return NextResponse.json({
    items: items.map((p) => ({ ...p, designer: DESIGNER_LABELS[productDesigner(p)], image: productImage(p) })),
    total: items.length,
  });
}
