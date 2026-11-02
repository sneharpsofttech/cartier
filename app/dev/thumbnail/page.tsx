import { notFound } from "next/navigation";
import ThumbnailStage from "@/components/viewer/ThumbnailStage";

/** Keep in step with HERO_BG in scripts/render_thumbnails.py. */
const HERO_BACKDROP = "#120e0b";

/**
 * Renders one shank or band style, or one loose stone, in a fixed studio shot
 * for scripts/render_thumbnails.py to screenshot. Development only.
 *
 *   ?kind=shank&style=pave   ?kind=band&style=eternity   ?kind=stone&shape=oval&tint=white
 *   ?kind=setting&style=aurora&metal=rose   ?kind=product&style=<product slug>
 *   add &bg=dark for the dark backdrop used by the home page's hero shots
 */
export default async function ThumbnailPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string; style?: string; shape?: string; tint?: string; metal?: string; bg?: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { kind = "shank", style = "solitaire", shape = "round", tint = "white", metal = "yellow", bg } = await searchParams;
  const background = bg === "dark" ? HERO_BACKDROP : undefined;
  if (kind === "stone") return <ThumbnailStage kind="stone" shape={shape} tint={tint} />;
  // A ring setting product: style is the setting's slug.
  if (kind === "product") return <ThumbnailStage kind="product" style={style} background={background} />;
  if (kind === "setting") return <ThumbnailStage kind="setting" style={style} metal={metal} background={background} />;
  return <ThumbnailStage kind={kind === "band" ? "band" : "shank"} style={style} />;
}
