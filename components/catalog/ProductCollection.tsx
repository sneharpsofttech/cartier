"use client";

import { useEffect, useMemo, useState } from "react";
import { RangeSlider } from "@/components/diamonds/Sliders";
import type { FilterGroup, GridItem } from "@/lib/catalog/collections";
import { money, parseMoney, sortItems, type SortId } from "@/lib/catalog/sort";
import { CheckList, CollectionLayout, FilterSection, ProductCard, TagChips } from "./parts";

type Selected = Record<string, string[]>;

/** Quick tags: each switches one filter value ("group:value") on or off. */
const TAGS = [
  { key: "type:bracelets", label: "Bracelets" },
  { key: "gem:diamond", label: "Diamond" },
  { key: "type:earrings", label: "Earrings" },
  { key: "metal:yellow", label: "Gold" },
  { key: "metal:platinum", label: "Platinum" },
  { key: "type:rings", label: "Rings" },
  { key: "gem:sapphire", label: "Sapphire" },
  { key: "origin:lab", label: "Lab Grown" },
];

/**
 * A collection's grid with its filter sidebar. Filters live in the URL
 * (?type=earrings,necklaces&metal=rose&price_min=500), so links can open a
 * collection already filtered.
 */
export default function ProductCollection({
  items,
  filters,
  initial,
  path,
}: {
  items: GridItem[];
  filters: FilterGroup[];
  initial: { selected: Selected; price: [number, number] | null; sort: SortId };
  path: string;
}) {
  const [selected, setSelected] = useState<Selected>(initial.selected);
  const [price, setPrice] = useState(initial.price);
  const [sort, setSort] = useState<SortId>(initial.sort);

  const bounds = useMemo<[number, number]>(() => {
    const prices = items.map((i) => i.price);
    return prices.length ? [Math.min(...prices), Math.max(...prices)] : [0, 1];
  }, [items]);

  /** Items passing every filter, optionally ignoring one group (for that group's counts). */
  const matching = (skip?: string) =>
    items.filter(
      (item) =>
        (!price || (item.price >= price[0] && item.price <= price[1])) &&
        Object.entries(selected).every(
          ([group, values]) => group === skip || !values.length || values.some((v) => item.facets[group]?.includes(v)),
        ),
    );

  const shown = useMemo(() => sortItems(matching(), sort), [items, selected, price, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const p = new URLSearchParams();
    for (const [group, values] of Object.entries(selected)) if (values.length) p.set(group, values.join(","));
    if (price) {
      p.set("price_min", String(Math.round(price[0])));
      p.set("price_max", String(Math.round(price[1])));
    }
    if (sort !== "featured") p.set("sort", sort);
    const q = p.toString();
    window.history.replaceState(null, "", q ? `${path}?${q}` : path);
  }, [selected, price, sort, path]);

  const toggle = (group: string, id: string) =>
    setSelected((s) => {
      const cur = s[group] ?? [];
      return { ...s, [group]: cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id] };
    });

  /** One checkbox group, with counts that respect every other active filter. */
  const section = (g: FilterGroup) => {
    const pool = matching(g.id);
    return (
      <FilterSection key={g.id} title={g.label} open={!g.collapsed || !!selected[g.id]?.length}>
        <CheckList
          options={g.options.map((o) => ({ ...o, count: pool.filter((i) => i.facets[g.id]?.includes(o.id)).length }))}
          selected={selected[g.id] ?? []}
          onToggle={(id) => toggle(g.id, id)}
        />
      </FilterSection>
    );
  };

  /** Tags whose value occurs among these products. */
  const tags = TAGS.filter(({ key }) => {
    const [group, value] = key.split(":");
    return items.some((i) => i.facets[group]?.includes(value));
  });

  const anyFilter = !!price || Object.values(selected).some((v) => v.length);

  return (
    <CollectionLayout
      count={shown.length}
      sort={sort}
      onSort={setSort}
      onClear={
        anyFilter
          ? () => {
              setSelected({});
              setPrice(null);
            }
          : undefined
      }
      sidebar={
        <>
          {filters.filter((g) => g.id === "type").map(section)}
          {tags.length > 1 && (
            <FilterSection title="Tags">
              <TagChips
                tags={tags}
                isOn={(key) => {
                  const [group, value] = key.split(":");
                  return !!selected[group]?.includes(value);
                }}
                onToggle={(key) => {
                  const [group, value] = key.split(":");
                  toggle(group, value);
                }}
              />
            </FilterSection>
          )}
          {filters.filter((g) => !g.afterPrice && g.id !== "type").map(section)}
          <FilterSection title="Filter By Price">
            <RangeSlider
              label="Price"
              bounds={bounds}
              value={price}
              onChange={setPrice}
              format={money}
              parse={parseMoney}
              compact
            />
          </FilterSection>
          {filters.filter((g) => g.afterPrice).map(section)}
        </>
      }
    >
      {shown.map((item) => (
        <ProductCard key={item.href} item={item} />
      ))}
    </CollectionLayout>
  );
}
