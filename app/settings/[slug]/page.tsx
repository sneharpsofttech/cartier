import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { existsSync } from "node:fs";
import path from "node:path";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import StepBar from "@/components/steps/StepBar";
import SettingImage from "@/components/settings/SettingImage";
import RingViewer from "@/components/viewer/ViewerClient";
import { METAL_OPTIONS } from "@/components/viewer/ring/config";
import {
  SETTINGS,
  SETTING_STYLE_LABELS,
  getSetting,
  settingConfig,
  settingDetailUrl,
  settingImage,
} from "@/lib/settings/catalog";
import { getStone } from "@/lib/diamonds/store";
import { formatPrice, stoneTitle } from "@/lib/diamonds/types";
import { stoneListUrl } from "@/lib/diamonds/ring";
import styles from "./page.module.css";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> };

const MODEL = "/models/ring.glb";

export async function generateStaticParams() {
  return SETTINGS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const setting = getSetting((await params).slug);
  return { title: setting ? `The ${setting.name} · ${SETTING_STYLE_LABELS[setting.style]} Setting · DAZORA` : "Setting not found" };
}

/** Setting detail: the only page where the 3D ring builder opens. */
export default async function SettingPage({ params, searchParams }: Props) {
  const setting = getSetting((await params).slug);
  if (!setting) notFound();
  const query = new URLSearchParams(await searchParams);
  const stone = query.get("stone") ? getStone(query.get("stone")!) : null;
  // A GLB at public/models/ring.glb replaces the procedural ring.
  const hasModel = existsSync(path.join(process.cwd(), "public", MODEL));

  const similar = SETTINGS.filter((s) => s.slug !== setting.slug && (s.style === setting.style || s.shank === setting.shank)).slice(0, 4);
  const ring = new URLSearchParams(query);
  ring.delete("stone");
  ring.set("setting", setting.slug);

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main className={styles.main}>
        <StepBar
          current={1}
          steps={[
            {
              label: "Choose stone",
              detail: stone ? stoneTitle(stone) : undefined,
              href: stoneListUrl(ring.toString(), stone ? { diamond_type: stone.type } : {}),
            },
            { label: "Choose setting", detail: `The ${setting.name}` },
            { label: "Review" },
          ]}
        />

        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link>
          <span>/</span>
          <Link href={`/settings${stone ? `?stone=${stone.id}` : ""}`}>Engagement rings</Link>
          <span>/</span>
          <span>The {setting.name}</span>
        </nav>

        <section className={styles.studio} aria-label={`The ${setting.name} in 3D`}>
          <RingViewer
            modelUrl={hasModel ? MODEL : undefined}
            product={{
              slug: setting.slug,
              name: setting.name,
              stock: setting.stock,
              styleLabel: `${SETTING_STYLE_LABELS[setting.style]} setting`,
              base: settingConfig(setting),
            }}
          />
        </section>

        <section className={styles.details}>
          <div className={styles.lead}>
            <p className={styles.eyebrow}>{SETTING_STYLE_LABELS[setting.style]} setting</p>
            <h2>The {setting.name}</h2>
            <p className={styles.tagline}>{setting.tagline}</p>
            <p className={styles.description}>{setting.description}</p>
          </div>

          <dl className={styles.facts}>
            <div>
              <dt>Stock number</dt>
              <dd>{setting.stock}</dd>
            </div>
            <div>
              <dt>Ring type</dt>
              <dd>{SETTING_STYLE_LABELS[setting.style]} engagement ring</dd>
            </div>
            <div>
              <dt>Metals</dt>
              <dd>{METAL_OPTIONS.map((m) => m.label).join(", ")}</dd>
            </div>
            <div>
              <dt>Setting price</dt>
              <dd>
                from {formatPrice(Math.min(...Object.values(setting.prices)))} (14K gold) · {formatPrice(setting.prices.platinum)}{" "}
                in platinum
              </dd>
            </div>
            <div>
              <dt>Centre stone</dt>
              <dd>Fits every shape, 0.25 to 5 ct (sold separately)</dd>
            </div>
            <div>
              <dt>Side stones</dt>
              <dd>
                {setting.sideStones
                  ? `${setting.sideStones.count} round diamonds, approx. ${setting.sideStones.carats.toFixed(2)} ct total`
                  : "None: a clean, polished band"}
              </dd>
            </div>
          </dl>

          <div className={styles.craft}>
            <h3>Crafting &amp; delivery</h3>
            <p>
              Your ring is made to order in your size, metal and centre stone, then hand-finished and inspected.
              Allow two to three weeks. Shipping is free and insured, and the first resize is on us.
            </p>
          </div>
        </section>

        {similar.length > 0 && (
          <section className={styles.similar}>
            <h3>You may also like</h3>
            <div className={styles.similarGrid}>
              {similar.map((s) => (
                <Link key={s.slug} href={settingDetailUrl(s.slug, stone ? `stone=${stone.id}` : "")} className={styles.card}>
                  <SettingImage src={settingImage(s, "yellow")} alt={`The ${s.name}`} />
                  <span className={styles.cardName}>The {s.name}</span>
                  <span className={styles.cardPrice}>from {formatPrice(s.prices.yellow)}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
