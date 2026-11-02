import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import { ProductCard } from "@/components/catalog/parts";
import { productItem, type GridItem } from "@/lib/catalog/collections";
import { GEM_LABELS, METAL_LABELS, PRODUCTS, PRODUCT_TYPE_LABELS } from "@/lib/catalog/products";
import { SETTINGS, SETTING_STYLE_LABELS, settingDetailUrl, settingImage } from "@/lib/settings/catalog";
import shell from "../shell.module.css";
import styles from "@/components/catalog/Collection.module.css";

export const metadata: Metadata = { title: "Search · DAZORA" };

/** Every word of the query must appear somewhere in the piece's text. */
const matches = (text: string, words: string[]) => words.every((w) => text.includes(w));

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);

  const items: GridItem[] = words.length
    ? [
        ...SETTINGS.filter((s) =>
          matches(`the ${s.name} ${SETTING_STYLE_LABELS[s.style]} engagement ring setting ${s.tagline}`.toLowerCase(), words),
        ).map((s) => ({
          href: settingDetailUrl(s.slug),
          image: settingImage(s, "yellow"),
          title: `The ${s.name} ${SETTING_STYLE_LABELS[s.style]} Engagement Ring`,
          price: s.prices.yellow,
          from: true,
          facets: {},
        })),
        ...PRODUCTS.filter((p) =>
          matches(
            `${p.name} ${PRODUCT_TYPE_LABELS[p.type]} ${GEM_LABELS[p.gem]} ${METAL_LABELS[p.metal]} ${p.description}`.toLowerCase(),
            words,
          ),
        ).map(productItem),
      ]
    : [];

  return (
    <div className={shell.page}>
      <SiteHeader />
      <main className={shell.main}>
        <header className={shell.intro}>
          <nav className={shell.crumbs} aria-label="Breadcrumb">
            <Link href="/">Home</Link> /
          </nav>
          <h1>{q ? `Search results for “${q}”` : "Search"}</h1>
          <p>
            {q
              ? `${items.length} ${items.length === 1 ? "result" : "results"}`
              : "Search engagement rings, earrings, necklaces, bracelets and bands."}
          </p>
          <form action="/search" className={styles.searchForm}>
            <input name="q" defaultValue={q} placeholder="Search" aria-label="Search" />
            <button className="btn">Search</button>
          </form>
        </header>
        {q && items.length === 0 && <p className={styles.empty}>Nothing matched. Try “halo”, “sapphire” or “rose gold”.</p>}
        <div className={styles.grid}>
          {items.map((item) => (
            <ProductCard key={item.href} item={item} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
