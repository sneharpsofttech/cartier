import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import SettingGallery from "@/components/product/SettingGallery";
import TrustBar from "@/components/steps/TrustBar";
import { ProductCard } from "@/components/catalog/parts";
import { METAL_OPTIONS } from "@/components/viewer/ring/config";
import { lifestyleFor } from "@/lib/catalog/collections";
import { stoneListUrl } from "@/lib/diamonds/ring";
import { getStone } from "@/lib/diamonds/store";
import { formatPrice, stoneTitle } from "@/lib/diamonds/types";
import {
  SETTINGS,
  SETTING_STYLE_LABELS,
  getSetting,
  settingDetailUrl,
  settingImage,
  settingTitle,
} from "@/lib/settings/catalog";
import shell from "../../shell.module.css";
import styles from "@/components/product/Product.module.css";

type Params = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string>> };

export function generateStaticParams() {
  return SETTINGS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const setting = getSetting((await params).slug);
  return {
    title: setting ? `${settingTitle(setting, "yellow")} · DAZORA` : "DAZORA",
    description: setting?.description,
  };
}

/**
 * An engagement-ring setting's product page: photos in each gold, price, the
 * details and what comes with it. Designing it (metal, stone, band) happens in
 * the 3D builder, one click away; the cards in the shop lead here first.
 */
export default async function SettingDetailPage({ params, searchParams }: Params) {
  const setting = getSetting((await params).slug);
  if (!setting) notFound();
  const query = new URLSearchParams(await searchParams);
  const metal = METAL_OPTIONS.some((m) => m.id === query.get("headMetal")) ? query.get("headMetal")! : "yellow";
  const stone = query.get("stone") ? getStone(query.get("stone")!) : null;

  const title = settingTitle(setting, metal);
  const style = SETTING_STYLE_LABELS[setting.style];
  const lifestyle = lifestyleFor("rings", setting.slug);
  const images = [
    { src: settingImage(setting, metal), label: METAL_OPTIONS.find((m) => m.id === metal)!.label },
    ...["yellow", "white", "rose"]
      .filter((m) => m !== metal && !(metal === "platinum" && m === "white"))
      .map((m) => ({ src: settingImage(setting, m), label: METAL_OPTIONS.find((o) => o.id === m)!.label })),
    ...(lifestyle ? [{ src: lifestyle, label: "Worn" }] : []),
  ];

  /** The same page in another metal, keeping everything else. */
  const withMetal = (id: string) => {
    const p = new URLSearchParams(query);
    for (const k of ["headMetal", "shankMetal", "bandMetal"]) p.set(k, id);
    return settingDetailUrl(setting.slug, p);
  };
  const metalQuery = new URLSearchParams(query);
  for (const k of ["headMetal", "shankMetal", "bandMetal"]) metalQuery.set(k, metal);
  const builder = `/settings/${setting.slug}?${metalQuery.toString()}`;
  const ringQuery = new URLSearchParams(metalQuery);
  ringQuery.delete("stone");
  ringQuery.set("setting", setting.slug);
  const chooseStone = stoneListUrl(ringQuery.toString());

  const related = SETTINGS.filter((s) => s.slug !== setting.slug && s.style === setting.style).slice(0, 4);
  const specs: [string, string][] = [
    ["Style", `${style} engagement ring`],
    ["Metal", METAL_OPTIONS.find((m) => m.id === metal)!.label],
    ["Shown with", `${setting.shape.charAt(0).toUpperCase()}${setting.shape.slice(1)} centre stone`],
    ["Centre stone", "Any shape, 0.25 to 5 ct (sold separately)"],
    [
      "Side stones",
      setting.sideStones
        ? `${setting.sideStones.count} diamonds, approx. ${setting.sideStones.carats.toFixed(2)} ct total`
        : "None: a clean, polished band",
    ],
    ["Stock number", setting.stock],
  ];

  return (
    <div className={shell.page}>
      <SiteHeader />
      <main className={shell.main}>
        <div className={styles.layout}>
          <SettingGallery images={images} title={title} />
          <div className={styles.info}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/">Home</Link> / <Link href="/settings">Engagement Rings</Link> /
            </nav>
            <h1>{title}</h1>
            <p className={styles.sku}>
              {style} setting · {setting.tagline}
            </p>
            <p className={styles.price}>{formatPrice(setting.prices[metal])}</p>
            <p className={styles.small}>Setting only · centre stone sold separately.</p>
            <hr />

            <div className={styles.metalPick}>
              <span>
                Metal: <strong>{METAL_OPTIONS.find((m) => m.id === metal)!.label}</strong>
              </span>
              <div>
                {METAL_OPTIONS.map((m) => (
                  <Link
                    key={m.id}
                    href={withMetal(m.id)}
                    replace
                    scroll={false}
                    aria-label={m.label}
                    title={m.label}
                    data-active={m.id === metal}
                    style={{ background: m.preview }}
                  />
                ))}
              </div>
            </div>

            {stone && (
              <p className={styles.stock}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="m8 12.5 2.6 2.5L16 9.5" />
                </svg>
                Your stone: {stoneTitle(stone)}
              </p>
            )}

            <div className={styles.ctaRow}>
              <Link href={builder} className={`btn ${styles.cart}`}>
                Customise in 3D
              </Link>
              {!stone && (
                <Link href={chooseStone} className={styles.ghost}>
                  Choose a diamond
                </Link>
              )}
            </div>
            <p className={styles.small}>
              Change the metal, centre stone, band and more, and see your ring turn in 3D before it is made.
            </p>

            <div className={styles.trust}>
              <TrustBar compact />
            </div>
            <p className={styles.description}>{setting.description}</p>
            <dl className={styles.specs}>
              {specs.map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
            <div className={styles.accordions}>
              <details>
                <summary>Crafting &amp; Delivery</summary>
                <p>
                  Made to order in your size, metal and centre stone, then hand-finished and inspected. Allow two to three
                  weeks. Shipping is free and insured, and the first resize is on us.
                </p>
              </details>
              <details>
                <summary>Schedule a Viewing</summary>
                <p>See this setting in person at our studio, or on a video call with one of our jewellers. Call (800) 555-0199 to book.</p>
              </details>
              <details>
                <summary>Care</summary>
                <p>
                  Clean with warm water, a drop of mild soap and a soft brush, and bring your ring in once a year for a free
                  check of the claws and a polish.
                </p>
              </details>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className={styles.related}>
            <h2>You May Also Like</h2>
            <div className={styles.relatedGrid}>
              {related.map((s) => (
                <ProductCard
                  key={s.slug}
                  item={{
                    href: settingDetailUrl(s.slug, metal === "yellow" ? "" : `headMetal=${metal}&shankMetal=${metal}&bandMetal=${metal}`),
                    image: settingImage(s, metal),
                    title: settingTitle(s, metal),
                    price: s.prices[metal],
                    facets: {},
                    hoverImage: lifestyleFor("rings", s.slug),
                  }}
                />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
