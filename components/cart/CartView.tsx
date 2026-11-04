"use client";

import Link from "next/link";
import { useState } from "react";
import SettingImage from "@/components/settings/SettingImage";
import TrustBar from "@/components/steps/TrustBar";
import { ProductCard } from "@/components/catalog/parts";
import { removeFromBag, setBagQty, useBag, useBagReady } from "@/lib/bag";
import type { GridItem } from "@/lib/catalog/collections";
import { formatPrice } from "@/lib/diamonds/types";
import styles from "./Cart.module.css";

/**
 * The bag's lines with quantity steppers and line totals beside an order
 * summary. There is no checkout backend, so the summary ends at a disabled
 * "Proceed to Checkout", as in the bag drawer.
 */
export default function CartView({ suggestions }: { suggestions: GridItem[] }) {
  const bag = useBag();
  const ready = useBagReady();
  const [gift, setGift] = useState(false);
  const [note, setNote] = useState("");

  const count = bag.reduce((n, l) => n + l.qty, 0);
  const subtotal = bag.reduce((n, l) => n + l.qty * l.price, 0);
  const inBag = new Set(bag.map((l) => l.href));
  const more = suggestions.filter((s) => !inBag.has(s.href)).slice(0, 4);

  return (
    <>
      <header className={styles.head}>
        <nav className={styles.crumbs} aria-label="Breadcrumb">
          <Link href="/">Home</Link> / <span>Shopping Bag</span>
        </nav>
        <h1>Shopping Bag</h1>
        {ready && bag.length > 0 && (
          <p>
            {count} {count === 1 ? "piece" : "pieces"} · complimentary insured shipping on every order
          </p>
        )}
      </header>

      {!ready ? (
        <div className={styles.loading} aria-hidden="true" />
      ) : bag.length === 0 ? (
        <section className={styles.empty}>
          <svg viewBox="0 0 48 48" aria-hidden="true">
            <path d="M10 16h28l-2.4 24H12.4z" />
            <path d="M18 16v-3a6 6 0 0 1 12 0v3" />
          </svg>
          <h2>Your bag is empty</h2>
          <p>Find something you&rsquo;ll love, or design an engagement ring of your own and see it in 3D.</p>
          <div className={styles.emptyCtas}>
            <Link href="/collections/fine-jewelry" className={`btn ${styles.primary}`}>
              Shop Fine Jewelry
            </Link>
            <Link href="/settings/aurora" className={styles.ghost}>
              Design a Custom Ring
            </Link>
          </div>
        </section>
      ) : (
        <div className={styles.layout}>
          <section aria-label="Pieces in your bag">
            <div className={styles.cols} aria-hidden="true">
              <span>Product</span>
              <span>Price</span>
              <span>Quantity</span>
              <span>Total</span>
            </div>
            <ul className={styles.lines}>
              {bag.map((l) => (
                <li key={l.id} className={styles.line}>
                  <Link href={l.href} className={styles.thumb} tabIndex={-1} aria-hidden="true">
                    <SettingImage src={l.image} alt="" />
                  </Link>
                  <div className={styles.about}>
                    <Link href={l.href} className={styles.title}>
                      {l.title}
                    </Link>
                    {l.detail && <p className={styles.detail}>{l.detail}</p>}
                    <p className={styles.ship}>Ships in 2–3 business days</p>
                    <button className={styles.remove} onClick={() => removeFromBag(l.id)}>
                      Remove
                    </button>
                  </div>
                  <p className={styles.price}>
                    <span className={styles.label}>Price</span>
                    {formatPrice(l.price)}
                  </p>
                  <div className={styles.qty} role="group" aria-label={`Quantity of ${l.title}`}>
                    <button onClick={() => setBagQty(l.id, l.qty - 1)} disabled={l.qty <= 1} aria-label="One fewer">
                      <svg viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M2.5 6h7" />
                      </svg>
                    </button>
                    <output aria-live="polite">{l.qty}</output>
                    <button onClick={() => setBagQty(l.id, l.qty + 1)} disabled={l.qty >= 10} aria-label="One more">
                      <svg viewBox="0 0 12 12" aria-hidden="true">
                        <path d="M2.5 6h7M6 2.5v7" />
                      </svg>
                    </button>
                  </div>
                  <p className={styles.total}>
                    <span className={styles.label}>Total</span>
                    {formatPrice(l.price * l.qty)}
                  </p>
                </li>
              ))}
            </ul>

            <div className={styles.gift}>
              <label>
                <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} />
                <span>
                  <strong>This is a gift</strong>
                  <small>Complimentary signature box and ribbon, with prices left off the packing slip.</small>
                </span>
              </label>
              {gift && (
                <textarea
                  value={note}
                  maxLength={200}
                  rows={3}
                  placeholder="Add a handwritten note (optional)"
                  onChange={(e) => setNote(e.target.value)}
                />
              )}
            </div>

            <Link href="/collections/fine-jewelry" className={styles.back}>
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M10 3 5 8l5 5" />
              </svg>
              Continue Shopping
            </Link>
          </section>

          <aside className={styles.summary}>
            <h2>Order Summary</h2>
            <dl>
              <div>
                <dt>Subtotal</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
              <div>
                <dt>Insured shipping</dt>
                <dd>Free</dd>
              </div>
              {gift && (
                <div>
                  <dt>Gift packaging</dt>
                  <dd>Free</dd>
                </div>
              )}
              <div>
                <dt>Estimated tax</dt>
                <dd>At checkout</dd>
              </div>
              <div className={styles.grand}>
                <dt>Total</dt>
                <dd>{formatPrice(subtotal)}</dd>
              </div>
            </dl>
            <button className={`btn ${styles.checkout}`} disabled title="Checkout is not connected in this demo">
              Proceed to Checkout
            </button>
            <p className={styles.note}>Checkout is not connected in this demo.</p>
            <p className={styles.secure}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <rect x="5" y="10.5" width="14" height="10" rx="1.5" />
                <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
              </svg>
              Secure, encrypted checkout
            </p>
            <div className={styles.help}>
              <strong>Need a hand?</strong>
              <p>
                Our jewellers can help with sizing, engraving and gifts. Call <a href="tel:+18005550199">(800) 555-0199</a>.
              </p>
            </div>
          </aside>
        </div>
      )}

      <div className={styles.trust}>
        <TrustBar />
      </div>

      {more.length > 0 && (
        <section className={styles.more}>
          <h2>{bag.length ? "Complete the Look" : "Popular Right Now"}</h2>
          <div className={styles.moreGrid}>
            {more.map((item) => (
              <ProductCard key={item.href} item={item} />
            ))}
          </div>
        </section>
      )}
    </>
  );
}
