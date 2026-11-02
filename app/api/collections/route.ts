import { NextResponse } from "next/server";
import { COLLECTIONS, collectionProducts } from "@/lib/catalog/collections";

/** GET /api/collections — every collection with its product count. */
export function GET() {
  return NextResponse.json(
    COLLECTIONS.map((c) => ({ handle: c.handle, title: c.title, intro: c.intro, count: collectionProducts(c).length })),
  );
}
