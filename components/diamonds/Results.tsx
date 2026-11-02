"use client";

import Link from "next/link";
import { useState } from "react";
import { STONE_TYPE_LABELS, SORTS, SORT_LABELS, type Sort } from "@/lib/diamonds/grades";
import type { StoneQuery, StoneSearchResult } from "@/lib/diamonds/query";
import { formatPrice, stoneTitle, type Stone } from "@/lib/diamonds/types";
import styles from "./StoneList.module.css";

type Props = {
  query: StoneQuery;
  result: StoneSearchResult;
  loading: boolean;
  view: "grid" | "list";
  shapePaths: Record<string, string>;
  detailHref: (stone: Stone) => string;
  onView: (view: "grid" | "list") => void;
  onChange: (patch: Partial<StoneQuery>) => void;
};

export default function Results({ query, result, loading, view, shapePaths, detailHref, onView, onChange }: Props) {
  const first = result.total ? (result.page - 1) * result.pageSize + 1 : 0;
  const lastShown = Math.min(result.page * result.pageSize, result.total);

  return (
    <section className={styles.results} aria-busy={loading}>
      <div className={styles.resultsBar}>
        <p className={styles.count}>
          View {result.total.toLocaleString("en-US")} {STONE_TYPE_LABELS[query.type]}
        </p>
        <div className={styles.resultsTools}>
          <div className={styles.viewToggle}>
            <button aria-label="Grid view" data-active={view === "grid"} onClick={() => onView("grid")}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
                {[3, 10, 17].flatMap((x) => [5, 12].map((y) => <rect key={`${x}${y}`} x={x} y={y} width="5" height="5" rx="1" />))}
              </svg>
            </button>
            <button aria-label="List view" data-active={view === "list"} onClick={() => onView("list")}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
                {[5, 10, 15].map((y) => (
                  <rect key={y} x="3" y={y} width="18" height="2.4" rx="1" />
                ))}
              </svg>
            </button>
          </div>
          <label className={styles.sort}>
            <span>Sort By :</span>
            <select value={query.sort} onChange={(e) => onChange({ sort: e.target.value as Sort, page: 1 })}>
              {SORTS.map((s) => (
                <option key={s} value={s}>
                  {SORT_LABELS[s]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {result.total === 0 ? (
        <div className={styles.empty}>
          <p>No stones match these filters.</p>
          <p>Try widening the carat, budget or grade ranges.</p>
        </div>
      ) : view === "grid" ? (
        <div className={styles.grid} data-loading={loading}>
          {result.items.map((s) => (
            <Link key={s.id} href={detailHref(s)} className={styles.cardLink}>
              <StoneImage stone={s} path={shapePaths[s.shape]} />
              <span className={styles.cardName}>{stoneTitle(s)}</span>
              <span className={styles.cardMeta}>
                {[s.cut && `${s.cut} cut`, `${s.lab} certified`].filter(Boolean).join(" · ")}
              </span>
              <span className={styles.cardPrice}>{formatPrice(s.price)}</span>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.tableWrap} data-loading={loading}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Shape</th>
                <th>Carat</th>
                <th>{query.type === "gemstone" ? "Gem" : "Color"}</th>
                <th>Clarity</th>
                <th>Cut</th>
                <th>Lab</th>
                <th className={styles.num}>Price</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {result.items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className={styles.rowShape}>
                      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden>
                        <path d={shapePaths[s.shape]} />
                      </svg>
                      {s.shape.charAt(0).toUpperCase() + s.shape.slice(1)}
                    </span>
                  </td>
                  <td>{s.carat.toFixed(2)}</td>
                  <td>{s.gem?.variety ?? (s.fancy ? `${s.fancy.intensity} ${s.fancy.color}` : s.color)}</td>
                  <td>{s.clarity ?? "–"}</td>
                  <td>{s.cut ?? "–"}</td>
                  <td>{s.lab}</td>
                  <td className={styles.num}>{formatPrice(s.price)}</td>
                  <td>
                    <Link href={detailHref(s)} className={styles.rowLink}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {result.total > 0 && (
        <div className={styles.pagerRow}>
          <p className={styles.count}>
            Results {first.toLocaleString("en-US")} to {lastShown.toLocaleString("en-US")} of {result.total.toLocaleString("en-US")}
          </p>
          <Pager page={result.page} pageCount={result.pageCount} onPage={(page) => onChange({ page })} />
        </div>
      )}
    </section>
  );
}

/** Rendered photo of the stone; falls back to its outline if the image is missing. */
function StoneImage({ stone, path }: { stone: Stone; path: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={styles.cardImage}>
      {failed ? (
        <svg viewBox="0 0 24 24" width="45%" height="45%" aria-hidden className={styles.fallback}>
          <path d={path} />
        </svg>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={stone.image} alt={stoneTitle(stone)} loading="lazy" onError={() => setFailed(true)} />
      )}
      <span className={styles.badges}>
        <span>{stone.lab}</span>
        {stone.heartsArrows && <span>H&amp;A</span>}
      </span>
      <span className={styles.viewBar} aria-hidden="true">
        View Diamond
      </span>
    </span>
  );
}

function Pager({ page, pageCount, onPage }: { page: number; pageCount: number; onPage: (p: number) => void }) {
  // 1 2 3 … last, keeping the current page and its neighbours visible.
  const pages = new Set([1, 2, 3, page - 1, page, page + 1, pageCount].filter((p) => p >= 1 && p <= pageCount));
  const sorted = [...pages].sort((a, b) => a - b);
  return (
    <nav className={styles.pager} aria-label="Pages">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        ‹
      </button>
      {sorted.map((p, i) => (
        <span key={p} className={styles.pageGroup}>
          {i > 0 && p - sorted[i - 1] > 1 && <span className={styles.gap}>…</span>}
          <button data-active={p === page} aria-current={p === page ? "page" : undefined} onClick={() => onPage(p)}>
            {p.toLocaleString("en-US")}
          </button>
        </span>
      ))}
      <button disabled={page >= pageCount} onClick={() => onPage(page + 1)} aria-label="Next page">
        ›
      </button>
    </nav>
  );
}
