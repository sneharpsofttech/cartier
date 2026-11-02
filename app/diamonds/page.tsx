import type { Metadata } from "next";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import StepBar from "@/components/steps/StepBar";
import StoneHero from "@/components/diamonds/StoneHero";
import StoneList from "@/components/diamonds/StoneList";
import { SHAPES } from "@/lib/diamonds/grades";
import { parseQuery, searchStones } from "@/lib/diamonds/query";
import { getInventory } from "@/lib/diamonds/store";
import { reviewUrl, settingUrl } from "@/lib/diamonds/ring";
import { getSetting } from "@/lib/settings/catalog";
import { shapeById, shapeFacetPath, shapePath } from "@/components/viewer/ring/shapes";
import styles from "../shell.module.css";

export const metadata: Metadata = {
  title: "Choose Your Stone · DAZORA",
  description: "Browse natural and lab-grown diamonds and coloured gemstones for your engagement ring.",
};

/** Shape outlines for the filter icons, computed here so the page ships no 3D code. */
const SHAPE_PATHS = Object.fromEntries(SHAPES.map((s) => [s, shapePath(shapeById(s))]));
/** Faceted face-up drawings for the shape filter. */
const SHAPE_ICONS = Object.fromEntries(SHAPES.map((s) => [s, shapeFacetPath(shapeById(s))]));

export default async function DiamondsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const raw = await searchParams;
  const params = new URLSearchParams(
    Object.entries(raw).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]])),
  );
  const query = parseQuery(params);
  // The page offers one shape at a time (the API still accepts a list).
  query.shapes = query.shapes.slice(0, 1);
  const inventory = getInventory();
  const result = searchStones(inventory, query);
  const counts = {
    natural: inventory.filter((s) => s.type === "natural").length,
    labgrown: inventory.filter((s) => s.type === "labgrown").length,
    gemstone: inventory.filter((s) => s.type === "gemstone").length,
  };
  const ring = params.get("ring") ?? "";
  const ringParams = new URLSearchParams(ring);
  const setting = ringParams.get("setting") ? getSetting(ringParams.get("setting")!) : null;

  return (
    <div className={styles.page}>
      <SiteHeader />
      <StoneHero counts={counts} />
      <main className={styles.main}>
        <StepBar
          current={0}
          steps={[
            { label: "Choose stone" },
            {
              label: "Choose setting",
              detail: setting ? `The ${setting.name}` : undefined,
              href: setting ? settingUrl(setting.slug, ringParams) : "/settings",
            },
            { label: "Review", href: setting ? reviewUrl(ring) : undefined },
          ]}
        />
        <StoneList
          initialQuery={query}
          initialResult={result}
          initialView={params.get("view_type") === "list" ? "list" : "grid"}
          ring={ring}
          shapePaths={SHAPE_PATHS}
          shapeIcons={SHAPE_ICONS}
        />
      </main>
      <SiteFooter />
    </div>
  );
}
