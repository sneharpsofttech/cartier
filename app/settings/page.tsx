import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import StepBar from "@/components/steps/StepBar";
import SettingsList from "@/components/settings/SettingsList";
import { parseSettingQuery } from "@/lib/settings/catalog";
import { getStone } from "@/lib/diamonds/store";
import { stoneTitle } from "@/lib/diamonds/types";
import shell from "../shell.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Diamond Engagement Rings · DAZORA",
  description: "Engagement ring settings in every style, made to order and viewable in 3D with your choice of diamond.",
};

export default async function SettingsPage({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const params = new URLSearchParams(await searchParams);
  const stone = params.get("stone") ? getStone(params.get("stone")!) : null;
  const diamondType = params.get("diamond_type");

  return (
    <div className={shell.page}>
      <SiteHeader />
      <main>
        <div className={shell.main}>
          {/* The step bar only matters once a stone has been chosen in step 1. */}
          {stone && (
            <StepBar
              current={1}
              steps={[
                { label: "Choose stone", detail: stoneTitle(stone), href: `/diamonds?diamond_type=${stone.type}` },
                { label: "Choose setting" },
                { label: "Review" },
              ]}
            />
          )}
          <header className={styles.intro}>
            <h1>Discover Your Perfect Diamond Engagement Ring</h1>
            <p>
              Explore our engagement rings in today&apos;s most-loved styles, from clean solitaires and modern bezels to
              halos and vintage vines. Every ring can be turned, zoomed and tried on a hand in 3D before it is made, so
              you can see exactly how it will look.
            </p>
            <p>
              Each design is a starting point. Choose your centre diamond&apos;s shape and size, natural or lab grown,
              select yellow, white or rose gold or platinum, and change the head, band and details until the ring is
              entirely yours. Every ring is made to order by hand and delivered in two to three weeks.
            </p>
            <p>
              If you are dreaming of something truly one of a kind, start from any setting in our 3D ring builder and
              make it your own.
            </p>
          </header>
        </div>

        <section className={styles.banner}>
          <div>
            <h2>Custom Engagement Rings</h2>
            <p>Begin the journey to create your dream ring.</p>
            <Link href="/settings/aurora" className="btn-outline">
              Learn More
            </Link>
          </div>
        </section>

        <div className={shell.main}>
          <SettingsList
            initial={parseSettingQuery(params)}
            initialDiamondType={diamondType === "natural" || diamondType === "labgrown" ? diamondType : null}
            stone={stone}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
