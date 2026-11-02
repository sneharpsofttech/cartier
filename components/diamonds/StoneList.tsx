"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STONE_TYPE_LABELS } from "@/lib/diamonds/grades";
import { DEFAULT_QUERY, toParams, type StoneQuery, type StoneSearchResult } from "@/lib/diamonds/query";
import type { Stone } from "@/lib/diamonds/types";
import Filters from "./Filters";
import Results from "./Results";
import styles from "./StoneList.module.css";

const INTRO: Record<string, string> = {
  natural: "Every natural diamond is certified and hand-selected for brilliance. Filter by the 4Cs, shape and budget.",
  labgrown: "Physically and chemically identical to mined diamonds, at a fraction of the price.",
  gemstone: "Sapphires, rubies, emeralds and more, for a ring with colour and character.",
};

type Props = {
  initialQuery: StoneQuery;
  initialResult: StoneSearchResult;
  initialView: "grid" | "list";
  /** The ring builder's settings so far, carried through to the next step. */
  ring: string;
  shapePaths: Record<string, string>;
  /** Faceted icons for the shape filter. */
  shapeIcons: Record<string, string>;
};

/**
 * Step 1 of the ring creator. Filters live in the URL (same parameters as
 * /api/diamonds), so every view can be bookmarked or shared; results come
 * from the API as filters change.
 */
export default function StoneList({ initialQuery, initialResult, initialView, ring, shapePaths, shapeIcons }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState(initialResult);
  const [view, setView] = useState(initialView);
  const [loading, setLoading] = useState(false);
  const firstRender = useRef(true);
  const resultsTop = useRef<HTMLDivElement>(null);

  const extra = useCallback(
    (): Record<string, string> => ({ view_type: view, ...(ring ? { ring } : {}) }),
    [view, ring],
  );

  // Keep the address bar in step without a server round trip.
  useEffect(() => {
    window.history.replaceState(null, "", `/diamonds?${toParams(query, extra()).toString()}`);
  }, [query, extra]);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/diamonds?${toParams(query).toString()}`, { signal: controller.signal });
        if (res.ok) setResult(await res.json());
      } catch (err) {
        if ((err as Error).name !== "AbortError") console.error(err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 150);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  const update = useCallback((patch: Partial<StoneQuery>) => {
    setQuery((q) => ({ ...q, ...patch }));
    if (patch.page && !Object.keys(patch).some((k) => k !== "page")) {
      resultsTop.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const reset = () => setQuery({ ...DEFAULT_QUERY, type: query.type, colorType: query.colorType, sort: query.sort });

  const detailHref = (stone: Stone) => `/diamonds/${stone.id}${ring ? `?ring=${encodeURIComponent(ring)}` : ""}`;

  return (
    <div className={styles.wrap}>
      {/* Follows the stone type as the visitor switches tabs. */}
      <header className={styles.intro}>
        <p className={styles.introKicker}>Now browsing</p>
        <h2>{STONE_TYPE_LABELS[query.type]}</h2>
        <p>{INTRO[query.type]}</p>
      </header>
      <Filters query={query} bounds={result.bounds} shapeIcons={shapeIcons} onChange={update} onReset={reset} />
      <div ref={resultsTop} className={styles.anchor} />
      <Results
        query={query}
        result={result}
        loading={loading}
        view={view}
        shapePaths={shapePaths}
        detailHref={detailHref}
        onView={setView}
        onChange={update}
      />
    </div>
  );
}
