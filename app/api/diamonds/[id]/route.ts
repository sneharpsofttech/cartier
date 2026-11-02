import { NextResponse } from "next/server";
import { getStone } from "@/lib/diamonds/store";

/** GET /api/diamonds/{id} — one stone by stock number, e.g. /api/diamonds/LG-100003. */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const stone = getStone(id);
  if (!stone) return NextResponse.json({ error: `No stone with id ${id}` }, { status: 404 });
  return NextResponse.json(stone);
}
