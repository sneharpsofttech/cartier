"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { METAL_OPTIONS } from "@/components/viewer/ring/config";
import { RangeSlider } from "@/components/diamonds/Sliders";
import { CheckList, CollectionLayout, FilterSection, ProductCard } from "@/components/catalog/parts";
import { parseMoney, shortMoney } from "@/lib/catalog/sort";
import { SHAPE_FACET_LABELS, lifestyleFor } from "@/lib/catalog/collections";
import {
  SETTINGS,
  SETTING_DESIGNERS,
  SETTING_STYLES,
  SETTING_STYLE_LABELS,
  searchSettings,
  settingDesigner,
  settingDetailUrl,
  settingImage,
  settingTitle,
  type SettingDesigner,
  type SettingQuery,
  type SettingStyle,
} from "@/lib/settings/catalog";
import type { ShapeId } from "@/components/viewer/ring/shapes";
import { formatPrice, stoneTitle, type Stone } from "@/lib/diamonds/types";
import styles from "./SettingsList.module.css";

type DiamondType = "natural" | "labgrown";

const DIAMOND_TYPES: { id: DiamondType; label: string }[] = [
  { id: "natural", label: "Diamond" },
  { id: "labgrown", label: "Lab Diamond" },
];

const toggle = <T,>(list: T[], item: T) => (list.includes(item) ? list.filter((x) => x !== item) : [...list, item]);

/** The engagement ring settings: catalogue grid with a filter sidebar. */
export default function SettingsList({
  initial,
  initialDiamondType,
  stone,
}: {
  initial: SettingQuery;
  initialDiamondType: DiamondType | null;
  stone: Stone | null;
}) {
  const [query, setQuery] = useState(initial);
  // Natural or lab grown: settings hold no stone, so this is carried on to the stone step.
  const [diamondType, setDiamondType] = useState(initialDiamondType);
  const result = useMemo(() => searchSettings(query), [query]);

  useEffect(() => {
    const p = new URLSearchParams();
    if (query.styles.length) p.set("style", query.styles.join(","));
    if (query.shapes.length) p.set("shape", query.shapes.join(","));
    if (query.designers.length) p.set("designer", query.designers.join(","));
    p.set("metal", query.metal);
    if (query.price) {
      p.set("price_min", String(Math.round(query.price[0])));
      p.set("price_max", String(Math.round(query.price[1])));
    }
    if (query.sort !== "featured") p.set("sort", query.sort);
    if (stone) p.set("stone", stone.id);
    else if (diamondType) p.set("diamond_type", diamondType);
    window.history.replaceState(null, "", `/settings?${p.toString()}`);
  }, [query, stone, diamondType]);

  const update = (patch: Partial<SettingQuery>) => setQuery((q) => ({ ...q, ...patch }));

  /** How many settings each option would show, given every other active filter. */
  const counts = useMemo(() => {
    const pool = (patch: Partial<SettingQuery>) => searchSettings({ ...query, ...patch }).items;
    const byStyle = pool({ styles: [] });
    const byShape = pool({ shapes: [] });
    const byDesigner = pool({ designers: [] });
    return {
      style: (id: SettingStyle) => byStyle.filter((s) => s.style === id).length,
      shape: (id: string) => byShape.filter((s) => s.shape === id).length,
      designer: (id: SettingDesigner) => byDesigner.filter((s) => settingDesigner(s) === id).length,
    };
  }, [query]);

  const shapesOffered = Object.keys(SHAPE_FACET_LABELS).filter((id) => SETTINGS.some((s) => s.shape === id));

  /** Product page link, carrying the metal and any chosen stone or diamond type. */
  const href = (slug: string) => {
    const p = new URLSearchParams();
    p.set("headMetal", query.metal);
    p.set("shankMetal", query.metal);
    p.set("bandMetal", query.metal);
    if (stone) {
      p.set("stone", stone.id);
      p.set("shape", stone.shape);
      p.set("carat", stone.carat.toFixed(2));
    } else if (diamondType) {
      p.set("diamond_type", diamondType);
    }
    return settingDetailUrl(slug, p);
  };

  const anyFilter = query.styles.length || query.shapes.length || query.designers.length || query.price;

  return (
    <div className={styles.wrap}>
      {stone && (
        <div className={styles.stoneBanner}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stone.image} alt="" />
          <div>
            <span className={styles.kicker}>Your stone</span>
            <p>
              {stoneTitle(stone)} · {formatPrice(stone.price)}
            </p>
          </div>
          <Link href={`/diamonds?diamond_type=${stone.type}`}>Change stone</Link>
        </div>
      )}

      <CollectionLayout
        count={result.total}
        sort={query.sort}
        onSort={(sort) => update({ sort })}
        columns={3}
        onClear={anyFilter ? () => update({ styles: [], shapes: [], designers: [], price: null }) : undefined}
        sidebar={
          <>
            {!stone && (
              <FilterSection title="Diamond Type">
                <CheckList
                  options={DIAMOND_TYPES}
                  selected={diamondType ? [diamondType] : []}
                  onToggle={(id) => setDiamondType(diamondType === id ? null : (id as DiamondType))}
                />
              </FilterSection>
            )}
            <FilterSection title="Metal Color">
              <CheckList
                options={METAL_OPTIONS.map((m) => ({ id: m.id, label: m.label }))}
                selected={[query.metal]}
                onToggle={(metal) => update({ metal, price: null })}
              />
            </FilterSection>
            <FilterSection title="Diamond Shape">
              <CheckList
                options={shapesOffered.map((id) => ({ id, label: SHAPE_FACET_LABELS[id], count: counts.shape(id) }))}
                selected={query.shapes}
                onToggle={(id) => update({ shapes: toggle(query.shapes, id as ShapeId) })}
              />
            </FilterSection>
            <FilterSection title="Style" open={query.styles.length > 0}>
              <CheckList
                options={SETTING_STYLES.map((s) => ({ id: s, label: SETTING_STYLE_LABELS[s], count: counts.style(s) }))}
                selected={query.styles}
                onToggle={(id) => update({ styles: toggle(query.styles, id as SettingStyle) })}
              />
            </FilterSection>
            <FilterSection title="Price">
              <RangeSlider
                label="Price"
                bounds={result.bounds}
                value={query.price}
                onChange={(price) => update({ price })}
                format={shortMoney}
                parse={parseMoney}
                compact
              />
            </FilterSection>
            <FilterSection title="Designer">
              <CheckList
                options={(Object.keys(SETTING_DESIGNERS) as SettingDesigner[]).map((id) => ({
                  id,
                  label: SETTING_DESIGNERS[id],
                  count: counts.designer(id),
                }))}
                selected={query.designers}
                onToggle={(id) => update({ designers: toggle(query.designers, id as SettingDesigner) })}
              />
            </FilterSection>
          </>
        }
      >
        {result.items.map((s) => (
          <ProductCard
            key={s.slug}
            item={{
              href: href(s.slug),
              image: settingImage(s, query.metal),
              title: settingTitle(s, query.metal),
              price: s.prices[query.metal],
              facets: {},
              hoverImage: lifestyleFor("rings", s.slug),
            }}
          />
        ))}
      </CollectionLayout>
      <p className={styles.note}>
        Prices are for the setting only. Every design fits any centre stone shape and is made to order.
      </p>
    </div>
  );
}
