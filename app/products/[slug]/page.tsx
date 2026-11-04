import { existsSync } from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import ProductGallery from "@/components/product/ProductGallery";
import AddToBag from "@/components/product/AddToBag";
import TrustBar from "@/components/steps/TrustBar";
import { ProductCard } from "@/components/catalog/parts";
import { lifestyleFor, productItem } from "@/lib/catalog/collections";
import {
  DESIGNER_LABELS,
  GEM_LABELS,
  METAL_LABELS,
  PRODUCTS,
  PRODUCT_TYPE_LABELS,
  getProduct,
  productDesigner,
  productImage,
} from "@/lib/catalog/products";
import { formatPrice } from "@/lib/diamonds/types";
import { shapeById } from "@/components/viewer/ring/shapes";
import shell from "../../shell.module.css";
import styles from "@/components/product/Product.module.css";

type Params = { params: Promise<{ slug: string }> };

/** Where each kind of piece lives, for the breadcrumb. */
const TYPE_COLLECTION = {
  earrings: "earrings",
  necklaces: "necklaces",
  bracelets: "bracelets",
  bands: "wedding-bands",
  rings: "gemstone-rings",
} as const;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const product = getProduct((await params).slug);
  return { title: product ? `${product.name} · DAZORA` : "DAZORA", description: product?.description };
}

export default async function ProductPage({ params }: Params) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const image = productImage(product);
  // The main photo, then whichever extra angles have been rendered ({slug}-2 to -4).
  const photos = [
    image,
    ...[2, 3, 4]
      .map((n) => `/jewelry/${product.slug}-${n}.webp`)
      .filter((src) => existsSync(path.join(process.cwd(), "public", src))),
  ];
  const saving = product.compareAt ? product.compareAt - product.price : 0;
  const shape = "shape" in product.design ? shapeById(product.design.shape).label : null;
  const related = PRODUCTS.filter((p) => p.type === product.type && p.slug !== product.slug).slice(0, 4);

  const specs: [string, string][] = [
    ["Designer", DESIGNER_LABELS[productDesigner(product)]],
    ["Category", PRODUCT_TYPE_LABELS[product.type]],
    ["Metal", METAL_LABELS[product.metal]],
  ];
  if (product.ctw > 0) {
    specs.push(["Gemstone", GEM_LABELS[product.gem]], ["Total weight", `${product.ctw.toFixed(2)} ctw`]);
    if (product.gem === "diamond") specs.push(["Diamond origin", product.origin === "lab" ? "Lab grown" : "Natural"]);
  }
  if (shape) specs.push(["Shape", shape]);

  return (
    <div className={shell.page}>
      <SiteHeader />
      <main className={shell.main}>
        <div className={`${styles.layout} ${styles.layoutCompact}`}>
          <ProductGallery
            slug={product.slug}
            photos={photos}
            title={product.name}
            worn={lifestyleFor(product.type, product.slug)}
            tryOn={
              ["ring", "band", "bracelet"].includes(product.design.kind)
                ? "hand"
                : product.design.kind === "studs" || product.design.kind === "pendant"
                  ? "head"
                  : undefined
            }
          />
          <div className={styles.info}>
            <nav className={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/">Home</Link> /{" "}
              <Link href={`/collections/${TYPE_COLLECTION[product.type]}`}>{PRODUCT_TYPE_LABELS[product.type]}</Link> /
            </nav>
            <h1>{product.name}</h1>
            <p className={styles.sku}>{product.sku}</p>
            <p className={styles.price}>
              {saving > 0 && <s>{formatPrice(product.compareAt!)}</s>}
              {formatPrice(product.price)}
              {saving > 0 && <em>Save {formatPrice(saving)}</em>}
            </p>
            <p className={styles.small}>Shipping calculated at checkout.</p>
            <hr />
            <p className={styles.stock}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="m8 12.5 2.6 2.5L16 9.5" />
              </svg>
              In stock, ready to ship in 2–3 business days
            </p>
            <AddToBag
              className={`btn ${styles.cart}`}
              line={{
                id: product.slug,
                title: product.name,
                image,
                href: `/products/${product.slug}`,
                price: product.price,
                detail: [METAL_LABELS[product.metal], product.ctw > 0 && `${product.ctw.toFixed(2)} ctw`].filter(Boolean).join(" · "),
              }}
            />
            <div className={styles.trust}>
              <TrustBar compact />
            </div>
            <p className={styles.description}>{product.description}</p>
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
                <summary>Schedule a Viewing</summary>
                <p>See this piece in person at our studio, or on a video call with one of our jewellers. Call (800) 555-0199 to book.</p>
              </details>
              <details>
                <summary>Care</summary>
                <p>
                  Clean with warm water, a drop of mild soap and a soft brush. Store pieces separately so stones don&apos;t scratch
                  one another, and bring them in once a year for a free inspection and polish.
                </p>
              </details>
              <details>
                <summary>Shipping Info</summary>
                <p>Complimentary insured shipping on every order, with signature on delivery. Returns are free within 30 days.</p>
              </details>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className={styles.related}>
            <h2>You May Also Like</h2>
            <div className={styles.relatedGrid}>
              {related.map((p) => (
                <ProductCard key={p.slug} item={productItem(p)} />
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
