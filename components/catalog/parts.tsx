"use client";

import Link from "next/link";
import { Children, isValidElement, useEffect, useState } from "react";
import { formatPrice } from "@/lib/diamonds/types";
import type { GridItem } from "@/lib/catalog/collections";
import SettingImage from "@/components/settings/SettingImage";
import { SORTS, type SortId } from "@/lib/catalog/sort";
import { addToBag } from "@/lib/bag";
import styles from "./Collection.module.css";

const PAGE_SIZE = 12;

/** A sidebar section with a serif heading; the heading folds it away. */
export function FilterSection({
  title,
  children,
  open: initial = true,
}: {
  title: string;
  children: React.ReactNode;
  open?: boolean;
}) {
  const [open, setOpen] = useState(initial);
  return (
    <section className={styles.section}>
      <button className={styles.sectionHead} aria-expanded={open} onClick={() => setOpen(!open)}>
        {title}
        <span className={styles.caret} data-open={open} aria-hidden="true" />
      </button>
      {open && <div className={styles.sectionBody}>{children}</div>}
    </section>
  );
}

/** Rows of options with their counts on the right; a chosen row turns brown. */
export function CheckList({
  options,
  selected,
  onToggle,
}: {
  options: { id: string; label: string; count?: number }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <ul className={styles.checks}>
      {options.map((o) => (
        <li key={o.id}>
          <label data-checked={selected.includes(o.id)}>
            <input type="checkbox" checked={selected.includes(o.id)} onChange={() => onToggle(o.id)} />
            <span>{o.label}</span>
            {o.count !== undefined && <small>({o.count})</small>}
          </label>
        </li>
      ))}
    </ul>
  );
}

/** Black tag chips that switch a filter on and off. */
export function TagChips({
  tags,
  isOn,
  onToggle,
}: {
  tags: { key: string; label: string }[];
  isOn: (key: string) => boolean;
  onToggle: (key: string) => void;
}) {
  return (
    <div className={styles.tags}>
      {tags.map((t) => (
        <button key={t.key} data-on={isOn(t.key)} aria-pressed={isOn(t.key)} onClick={() => onToggle(t.key)}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function ProductCard({ item }: { item: GridItem }) {
  const saving = item.compareAt ? item.compareAt - item.price : 0;
  const percent = saving > 0 ? Math.round((saving / item.compareAt!) * 1000) / 10 : 0;
  const [added, setAdded] = useState(false);

  return (
    <div className={styles.card}>
      <div className={styles.photo}>
        <Link href={item.href} tabIndex={-1} aria-hidden="true" draggable={false}>
          <SettingImage src={item.image} alt="" />
          {item.hoverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.hoverImage} alt="" loading="lazy" className={styles.hoverImg} draggable={false} />
          )}
        </Link>
        <span className={styles.badges}>
          {percent > 0 && <span className={styles.off}>{percent}% Off</span>}
          {saving > 0 && <span className={styles.badge}>Sale</span>}
        </span>
        {item.cartId ? (
          <button
            className={styles.hoverBar}
            onClick={() => {
              addToBag({ id: item.cartId!, title: item.title, image: item.image, href: item.href, price: item.price });
              setAdded(true);
              window.dispatchEvent(new Event("bag-open"));
            }}
          >
            {added ? "Added To Cart" : "Add To Cart"}
          </button>
        ) : (
          <Link href={item.href} className={styles.hoverBar}>
            Select Options
          </Link>
        )}
      </div>
      <Link href={item.href} className={styles.title}>
        {item.title}
      </Link>
      <span className={styles.price}>
        {saving > 0 && <s>{formatPrice(item.compareAt!)}</s>}
        {item.from && "From "}
        {formatPrice(item.price)}
      </span>
    </div>
  );
}

/** The dark promotion card at the foot of the shop sidebar. */
function PromoCard() {
  return (
    <Link href="/settings" className={styles.promo}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/home/model-sapphire-set.webp" alt="" loading="lazy" />
      <span className={styles.promoBig}>Design in 3D</span>
      <span className={styles.promoSmall}>Handcrafted Sparkle</span>
      <span className={styles.promoLine}>Your Ring, Your Way</span>
      <span className={styles.promoBtn}>
        Shop Now <span aria-hidden="true">→</span>
      </span>
      <span className={styles.promoUrl}>DAZORA Fine Jewellery</span>
    </Link>
  );
}

const itemOf = (child: React.ReactNode): GridItem | undefined =>
  isValidElement<{ item?: GridItem }>(child) ? child.props.item : undefined;

/** Sidebar + results layout shared by every collection page. */
export function CollectionLayout({
  sidebar,
  count,
  sort,
  onSort,
  onClear,
  children,
  columns = 3,
}: {
  sidebar: React.ReactNode;
  count: number;
  sort: SortId;
  onSort: (s: SortId) => void;
  onClear?: () => void;
  children: React.ReactNode;
  columns?: 3 | 4;
}) {
  const [refine, setRefine] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);

  // Keyword search narrows the cards already chosen by the filters.
  const words = keyword.toLowerCase().split(/\s+/).filter(Boolean);
  const all = Children.toArray(children).filter((child) => {
    const title = itemOf(child)?.title.toLowerCase() ?? "";
    return words.every((w) => title.includes(w));
  });
  const total = words.length ? all.length : count;
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const shown = all.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const first = total ? (current - 1) * PAGE_SIZE + 1 : 0;
  const last = Math.min(current * PAGE_SIZE, total);

  // Back to the first page whenever the filters, sort or search change.
  useEffect(() => setPage(1), [count, sort, keyword]);

  const goTo = (p: number) => {
    setPage(p);
    document.getElementById("shop-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className={styles.layout}>
      <button className={styles.refine} onClick={() => setRefine(!refine)} aria-expanded={refine}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
          <circle cx="16" cy="7" r="2" />
          <circle cx="8" cy="17" r="2" />
        </svg>
        Refine
      </button>
      <aside className={styles.sidebar} data-open={refine}>
        <div className={styles.panel}>
          <label className={styles.keyword}>
            <input
              type="search"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Enter Keyword"
              aria-label="Search these products"
            />
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m15.5 15.5 5 5" />
            </svg>
          </label>
          {sidebar}
          {onClear && (
            <button className="btn" onClick={onClear}>
              Clear Filters
            </button>
          )}
        </div>
        <PromoCard />
      </aside>
      <div className={styles.results} id="shop-results">
        <div className={styles.resultsBar}>
          <p>
            Showing {first}–{last} Of {total} {total === 1 ? "Result" : "Results"}
          </p>
          <div className={styles.barTools}>
            <div className={styles.views} role="group" aria-label="Layout">
              <button
                data-on={view === "grid"}
                aria-pressed={view === "grid"}
                aria-label="Grid"
                onClick={() => setView("grid")}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 2h5v5H2zM9 2h5v5H9zM2 9h5v5H2zM9 9h5v5H9z" />
                </svg>
              </button>
              <button
                data-on={view === "list"}
                aria-pressed={view === "list"}
                aria-label="List"
                onClick={() => setView("list")}
              >
                <svg viewBox="0 0 16 16" aria-hidden="true">
                  <path d="M2 3h12v2H2zM2 7h12v2H2zM2 11h12v2H2z" />
                </svg>
              </button>
            </div>
            <select value={sort} onChange={(e) => onSort(e.target.value as SortId)} aria-label="Sort">
              {SORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {total === 0 ? (
          <p className={styles.empty}>No products match these filters.</p>
        ) : (
          <>
            <div className={styles.grid} data-columns={columns} data-view={view}>
              {shown}
            </div>
            {pages > 1 && (
              <nav className={styles.pager} aria-label="Pages">
                {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    data-on={p === current}
                    aria-current={p === current ? "page" : undefined}
                    onClick={() => goTo(p)}
                  >
                    {p}
                  </button>
                ))}
                {current < pages && (
                  <button aria-label="Next page" onClick={() => goTo(current + 1)}>
                    →
                  </button>
                )}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
