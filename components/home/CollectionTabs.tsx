"use client";

import { useState } from "react";
import { ProductCard } from "@/components/catalog/parts";
import type { GridItem } from "@/lib/catalog/collections";
import styles from "@/app/home.module.css";

/** "Your Style, Our Collection": a tab per category, each showing four pieces. */
export default function CollectionTabs({ tabs }: { tabs: { label: string; items: GridItem[] }[] }) {
  const [active, setActive] = useState(0);
  return (
    <>
      <div className={styles.tabs} role="tablist">
        {tabs.map((t, i) => (
          <button
            key={t.label}
            role="tab"
            aria-selected={active === i}
            data-active={active === i}
            onClick={() => setActive(i)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className={styles.products}>
        {tabs[active].items.map((item) => (
          <ProductCard key={item.href} item={item} />
        ))}
      </div>
    </>
  );
}
