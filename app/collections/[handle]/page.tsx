import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import ProductCollection from "@/components/catalog/ProductCollection";
import ShopHeader from "@/components/catalog/ShopHeader";
import { SORTS, type SortId } from "@/lib/catalog/sort";
import { collectionProducts, getCollection, productFilters, productItem } from "@/lib/catalog/collections";
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

  return (
    <div className={styles.page}>
      <SiteHeader />
      <main>
        <ShopHeader
          title={collection.title}
          crumb={{ label: "Shop", href: "/collections/fine-jewelry" }}
          intro={collection.intro}
          image={collection.banner}
          count={products.length}
        />
        <div className={`${styles.main} ${styles.shopMain}`}>
          <ProductCollection
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
