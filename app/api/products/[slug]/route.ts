import { NextResponse } from "next/server";
import { DESIGNER_LABELS, getProduct, productDesigner, productImage } from "@/lib/catalog/products";

/** GET /api/products/{slug} — one piece of jewellery. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = getProduct(slug);
  if (!product) return NextResponse.json({ error: `No product called ${slug}` }, { status: 404 });
  return NextResponse.json({ ...product, designer: DESIGNER_LABELS[productDesigner(product)], image: productImage(product) });
}
