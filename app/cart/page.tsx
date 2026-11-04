import type { Metadata } from "next";
import SiteHeader from "@/components/steps/SiteHeader";
import SiteFooter from "@/components/steps/SiteFooter";
import CartView from "@/components/cart/CartView";
import { productItem } from "@/lib/catalog/collections";
import { PRODUCTS } from "@/lib/catalog/products";
import shell from "../shell.module.css";

export const metadata: Metadata = { title: "Shopping Bag · DAZORA" };

/** The shopping bag as a full page: each piece with its quantity, the order summary and a few suggestions. */
export default function CartPage() {
  // One of each kind of piece, so the suggestions don't all look alike.
  const picks = ["earrings", "necklaces", "bracelets", "bands", "rings"]
    .map((type) => PRODUCTS.find((p) => p.type === type))
    .filter((p) => p !== undefined)
    .concat(PRODUCTS.slice(5, 8))
    .map(productItem);

  return (
    <div className={shell.page}>
      <SiteHeader />
      <main className={shell.main}>
        <CartView suggestions={picks} />
      </main>
      <SiteFooter />
    </div>
  );
}
