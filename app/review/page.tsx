import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import StepBar from "@/components/steps/StepBar";
import CopyLinkButton from "@/components/steps/CopyLinkButton";
import SettingImage from "@/components/settings/SettingImage";
import { BAND_STYLES, METAL_OPTIONS, describe, fromSearchParams } from "@/components/viewer/ring/config";
import { SHAPES, shapeById } from "@/components/viewer/ring/shapes";
import { settingUrl, stoneListUrl, withStone } from "@/lib/diamonds/ring";
import { getStone } from "@/lib/diamonds/store";
import { formatPrice, stoneTitle } from "@/lib/diamonds/types";
import { SETTING_STYLE_LABELS, getSetting, settingConfig, settingImage } from "@/lib/settings/catalog";
import { quoteSetting } from "@/lib/pricing";
import styles from "./page.module.css";

export const metadata: Metadata = { title: "Review Your Ring · DAZORA" };

const label = (options: { id: string; label: string }[], id: string) => options.find((o) => o.id === id)?.label ?? id;

export default async function ReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const raw = await searchParams;
  const params = new URLSearchParams(
    Object.entries(raw).flatMap(([k, v]) => (Array.isArray(v) ? v.map((x) => [k, x]) : [[k, v]])),
  );
  const setting = params.get("setting") ? getSetting(params.get("setting")!) : null;
  const stone = params.get("stone") ? getStone(params.get("stone")!) : null;
  // The setting's own design is the starting point; the URL holds what was changed.
  const base = setting ? settingConfig(setting) : undefined;
  const config = withStone(fromSearchParams(params, { shapes: SHAPES.map((s) => s.id) }, base), stone);
  const quote = quoteSetting(config);
  const total = quote.total + (stone?.price ?? 0);

  const ring = new URLSearchParams(params);
  ring.delete("stone");
  const chooseStone = stoneListUrl(ring.toString(), stone ? { diamond_type: stone.type } : {});
  const editSetting = setting ? settingUrl(setting.slug, params) : `/settings${stone ? `?stone=${stone.id}` : ""}`;

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <StepBar
          current={2}
          steps={[
            { label: "Choose stone", detail: stone ? stoneTitle(stone) : undefined, href: chooseStone },
            { label: "Choose setting", detail: setting ? `The ${setting.name}` : undefined, href: editSetting },
            { label: "Review", detail: "Complete ring" },
          ]}
        />

        <header className={styles.head}>
          <p className={styles.eyebrow}>Your design</p>
          <h1>{setting ? `The ${setting.name}` : "Your ring"}</h1>
          {stone && (
            <p className={styles.sub}>
              with {/^[aeiou]/i.test(stoneTitle(stone)) ? "an" : "a"} {stoneTitle(stone)}
            </p>
          )}
        </header>

        <div className={styles.layout}>
          <div className={styles.items}>
            <article className={styles.item}>
              {setting ? (
                <>
                  <div className={styles.thumb}>
                    <SettingImage src={settingImage(setting, config.shankMetal)} alt="" />
                  </div>
                  <div className={styles.itemBody}>
                    <p className={styles.kicker}>Setting</p>
                    <h2>The {setting.name}</h2>
                    <p className={styles.meta}>
                      {SETTING_STYLE_LABELS[setting.style]} · {label(METAL_OPTIONS, config.shankMetal)} · Size {config.ringSize} ·{" "}
                      {setting.stock}
                    </p>
                    <div className={styles.links}>
                      <Link href={editSetting}>Edit in 3D</Link>
                    </div>
                  </div>
                  <p className={styles.price}>{formatPrice(quote.setting)}</p>
                </>
              ) : (
                <div className={styles.itemBody}>
                  <p className={styles.kicker}>Setting</p>
                  <h2>No setting chosen yet</h2>
                  <p className={styles.meta}>Choose from {24} designs and see them in 3D with your stone.</p>
                  <div className={styles.links}>
                    <Link href={editSetting}>Choose a setting</Link>
                  </div>
                </div>
              )}
            </article>

            <article className={styles.item}>
              {stone ? (
                <>
                  <div className={styles.thumb}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={stone.image} alt="" />
                  </div>
                  <div className={styles.itemBody}>
                    <p className={styles.kicker}>Centre stone</p>
                    <h2>{stoneTitle(stone)}</h2>
                    <p className={styles.meta}>
                      {[stone.cut && `${stone.cut} cut`, `${stone.lab} certified`, stone.id].filter(Boolean).join(" · ")}
                    </p>
                    <div className={styles.links}>
                      <Link href={`/diamonds/${stone.id}?ring=${encodeURIComponent(ring.toString())}`}>Details</Link>
                      <Link href={chooseStone}>Change stone</Link>
                    </div>
                  </div>
                  <p className={styles.price}>{formatPrice(stone.price)}</p>
                </>
              ) : (
                <div className={styles.itemBody}>
                  <p className={styles.kicker}>Centre stone</p>
                  <h2>No stone chosen yet</h2>
                  <p className={styles.meta}>Pick a natural or lab-grown diamond, or a coloured gemstone.</p>
                  <div className={styles.links}>
                    <Link href={chooseStone}>Choose a stone</Link>
                  </div>
                </div>
              )}
            </article>

            {config.band !== "none" && (
              <article className={styles.item}>
                <div className={styles.thumb}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/thumbs/band-${config.band}.webp`} alt="" />
                </div>
                <div className={styles.itemBody}>
                  <p className={styles.kicker}>Wedding band</p>
                  <h2>{label(BAND_STYLES, config.band)}</h2>
                  <p className={styles.meta}>{label(METAL_OPTIONS, config.bandMetal)}</p>
                  <div className={styles.links}>
                    <Link href={editSetting}>Edit in 3D</Link>
                  </div>
                </div>
                <p className={styles.price}>{formatPrice(quote.band)}</p>
              </article>
            )}
          </div>

          <aside className={styles.summary}>
            <h2>Summary</h2>
            <dl>
              <div>
                <dt>Setting</dt>
                <dd>{formatPrice(quote.setting)}</dd>
              </div>
              <div>
                <dt>Centre stone</dt>
                <dd>{stone ? formatPrice(stone.price) : "–"}</dd>
              </div>
              {quote.band > 0 && (
                <div>
                  <dt>Wedding band</dt>
                  <dd>{formatPrice(quote.band)}</dd>
                </div>
              )}
              <div className={styles.total}>
                <dt>Total</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>
            <p className={styles.config}>{describe(config, shapeById(config.shape).label)}</p>
            <Link href={editSetting} className={styles.primary}>
              View in 3D &amp; try on
            </Link>
            <CopyLinkButton className={styles.secondary} />
            <p className={styles.small}>
              Prices are estimates. <a href={`/api/ring/quote?${params.toString()}`}>Quote as JSON</a>
            </p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
