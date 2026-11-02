import { NextResponse } from "next/server";
import { SETTING_METALS, getSetting, settingImage } from "@/lib/settings/catalog";

/** GET /api/settings/{slug} — one ring setting with its photos per metal, e.g. /api/settings/aurora. */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const setting = getSetting(slug);
  if (!setting) return NextResponse.json({ error: `No setting called ${slug}` }, { status: 404 });
  return NextResponse.json({
    ...setting,
    images: Object.fromEntries(SETTING_METALS.map((m) => [m, settingImage(setting, m)])),
  });
}
