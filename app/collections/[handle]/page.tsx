import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import ProductCollection from "@/components/catalog/ProductCollection";
import ShopHeader from "@/components/catalog/ShopHeader";
import { SORTS, type SortId } from "@/lib/catalog/sort";
import { collectionProducts, getCollection, productFilters, productItem } from "@/lib/catalog/collections";
import { PRODUCT_TYPE_LABELS, type ProductType } from "@/lib/catalog/products";
import styles from "../../shell.module.css";

type Params = { params: Promise<{ handle: string }>; searchParams: Promise<Record<string, string | string[]>> };

// Filters can arrive in the URL (?gem=sapphire), so render per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const collection = getCollection((await params).handle);
  return { title: collection ? `${collection.title} · DAZORA` : "Collection · DAZORA", description: collection?.intro };
}

export default async function CollectionPage({ params, searchParams }: Params) {
  const collection = getCollection((await params).handle);
  if (!collection) notFound();
  const raw = await searchParams;
  const one = (k: string) => (Array.isArray(raw[k]) ? raw[k][0] : raw[k]) ?? "";

  const products = collectionProducts(collection);
  const filters = productFilters(products);
  const selected = Object.fromEntries(
    filters.map((g) => [
      g.id,
      one(g.id)
        .split(",")
        .filter((v) => g.options.some((o) => o.id === v)),
    ]),
  );
  const lo = Number(one("price_min"));
  const hi = Number(one("price_max"));
  const sort = (SORTS.some((s) => s.id === one("sort")) ? one("sort") : "featured") as SortId;

  // A link that opens the collection filtered (?gem=diamond) gets a title that says so:
  // "Diamond Wedding Bands", "White Gold Fine Jewelry", "Lab Grown Earrings".
  const only = (id: string) => (selected[id]?.length === 1 ? selected[id][0] : null);
  const label = (id: string) => filters.find((g) => g.id === id)?.options.find((o) => o.id === only(id))?.label;
  const prefix = [
    label("metal"),
    only("origin") === "lab" ? "Lab Grown" : undefined,
    only("gem") && only("gem") !== "diamond" ? label("gem") : only("gem") === "diamond" ? "Diamond" : undefined,
  ].filter(Boolean);
  const noun = only("type") ? PRODUCT_TYPE_LABELS[only("type") as ProductType] : collection.title;
  const filtered = prefix.length > 0 || noun !== collection.title;
  const title = filtered ? [...prefix, noun.replace(/ Collection$/, "")].join(" ") : collection.title;

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main>
        <ShopHeader
          title={title}
          crumb={
            filtered
              ? { label: collection.title, href: `/collections/${collection.handle}` }
              : { label: "Shop", href: "/collections/fine-jewelry" }
          }
          intro={collection.intro}
          image={collection.banner}
          focus={collection.bannerFocus}
        />
        <div className={`${styles.main} ${styles.shopMain}`}>
          {/* Keyed on the URL: following another menu link to this collection starts its filters afresh. */}
          <ProductCollection
            key={JSON.stringify(raw)}
            items={products.map(productItem)}
            filters={filters}
            initial={{ selected, price: lo > 0 && hi > lo ? [lo, hi] : null, sort }}
            path={`/collections/${collection.handle}`}
          />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
