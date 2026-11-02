"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MENU } from "@/lib/catalog/menu";
import { removeFromBag, useBag } from "@/lib/bag";
import { formatPrice } from "@/lib/diamonds/types";
import styles from "./SiteHeader.module.css";

const Icon = {
  search: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="7" />
      <path d="m16 16 5.5 5.5" />
    </svg>
  ),
  bag: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7.5h16l-1.2 13.5H5.2z" />
      <path d="M8.5 7.5V6a3.5 3.5 0 0 1 7 0v1.5" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18M3 12h18M3 18h18" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m5 5 14 14M19 5 5 19" />
    </svg>
  ),
};

/** Logo bar, main navigation with mega menus, search, bag drawer and the phone menu. */
export default function HeaderBar() {
  const router = useRouter();
  const bag = useBag();
  const [panel, setPanel] = useState<"none" | "search" | "bag" | "menu">("none");
  const [query, setQuery] = useState("");
  const [openItem, setOpenItem] = useState<string | null>(null);
  // The desktop menu item whose dropdown was just used; it stays shut until the pointer leaves.
  const [closedItem, setClosedItem] = useState<string | null>(null);
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Tightening the pinned header shortens the page by about 55px, and the browser moves the
    // scroll position to match. With one threshold that move flips it straight back, so the
    // header would flicker; it tightens past 140px and only opens again near the very top.
    const onScroll = () =>
      setScrolled((cur) => (cur ? window.scrollY > 16 : window.scrollY > 140));
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const count = bag.reduce((n, l) => n + l.qty, 0);
  const subtotal = bag.reduce((n, l) => n + l.qty * l.price, 0);
  const toggle = (p: typeof panel) => setPanel((cur) => (cur === p ? "none" : p));

  // A clicked link keeps keyboard focus, which would hold its dropdown open on the next page.
  useEffect(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  }, [pathname]);

  // While a dropdown or mega menu is open under the pointer, the wheel must not scroll the page behind it.
  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      const item = (e.target as Element | null)?.closest?.(`.${styles.item}`);
      const drop = item?.querySelector(`.${styles.mega}, .${styles.dropdown}`);
      if (drop && getComputedStyle(drop).visibility === "visible") e.preventDefault();
    };
    window.addEventListener("wheel", onWheel, { passive: false });
    return () => window.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPanel("none");
    window.addEventListener("keydown", onKey);
    // Other pages open the bag after adding a piece.
    const onAdded = () => setPanel("bag");
    window.addEventListener("bag-open", onAdded);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("bag-open", onAdded);
    };
  }, []);

  return (
    <>
      <div className={styles.bar} data-scrolled={scrolled}>
        <div className={styles.left}>
          <button className={`${styles.icon} ${styles.menuButton}`} aria-label="Menu" onClick={() => toggle("menu")}>
            {Icon.menu}
          </button>
          <Link href="/" className={styles.brand} aria-label="DAZORA home">
            <span className={styles.wordmark}>DAZORA</span>
            <span className={styles.tagline} aria-hidden="true">
              Crafted for forever
            </span>
          </Link>
        </div>
        <nav className={styles.nav} aria-label="Main">
          <ul>
            {/* The last item ("Build Your Own Ring") is the button on the right on desktop. */}
            {MENU.filter((item) => item.href !== "/settings" || item.columns).map((item) => {
              const mega = (item.columns?.length ?? 0) > 1;
              return (
                <li
                  key={item.label}
                  className={`${styles.item} ${mega ? styles.itemMega : ""}`}
                  data-closed={closedItem === item.label}
                  onMouseLeave={() => setClosedItem(null)}
                  onClick={(e) => {
                    if (!(e.target as HTMLElement).closest("a")) return;
                    (document.activeElement as HTMLElement | null)?.blur();
                    setClosedItem(item.label);
                  }}
                >
                  <Link href={item.href} className={styles.top}>
                    {item.label}
                    {item.badge && <span className={styles.badge}>{item.badge}</span>}
                    {item.columns && (
                      <svg viewBox="0 0 12 12" aria-hidden="true" className={styles.chev}>
                        <path d="m3 4.5 3 3 3-3" />
                      </svg>
                    )}
                  </Link>
                  {item.columns && (
                    <div className={mega ? styles.mega : styles.dropdown}>
                      <div className={mega ? styles.megaInner : undefined}>
                        {item.columns.map((col) => (
                          <div key={col.title} className={styles.col}>
                            {mega && <p className={styles.colTitle}>{col.title}</p>}
                            {col.links.map((l) => (
                              <Link key={l.label} href={l.href}>
                                {l.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                        {mega && item.feature && (
                          <Link href={item.feature.href} className={styles.feature}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={item.feature.image} alt="" loading="lazy" />
                            <span className={styles.featureText}>
                              <small>{item.feature.kicker}</small>
                              <strong>{item.feature.title}</strong>
                              <em>Shop Now</em>
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className={styles.right}>
          <button className={styles.icon} aria-label="Search" onClick={() => toggle("search")}>
            {Icon.search}
          </button>
          <button className={styles.icon} aria-label={`Bag, ${count} items`} onClick={() => toggle("bag")}>
            {Icon.bag}
            {count > 0 && <span className={styles.count}>{count}</span>}
          </button>
          <Link href="/settings" className={styles.cta}>
            Design Your Ring
          </Link>
        </div>
      </div>

      {panel === "search" && (
        <form
          className={styles.search}
          onSubmit={(e) => {
            e.preventDefault();
            setPanel("none");
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
          }}
        >
          {Icon.search}
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search rings, earrings, sapphire, rose gold…"
            aria-label="Search"
          />
          <button type="button" className={styles.icon} aria-label="Close search" onClick={() => setPanel("none")}>
            {Icon.close}
          </button>
        </form>
      )}

      {(panel === "bag" || panel === "menu") && <div className={styles.scrim} onClick={() => setPanel("none")} />}

      {panel === "menu" && (
        <aside className={`${styles.drawer} ${styles.drawerLeft}`} aria-label="Menu">
          <div className={styles.drawerHead}>
            <span>Menu</span>
            <button className={styles.icon} aria-label="Close menu" onClick={() => setPanel("none")}>
              {Icon.close}
            </button>
          </div>
          <ul className={styles.mobileList}>
            {MENU.map((item) => (
              <li key={item.label}>
                {item.columns ? (
                  <>
                    <button
                      className={styles.mobileTop}
                      aria-expanded={openItem === item.label}
                      onClick={() => setOpenItem((cur) => (cur === item.label ? null : item.label))}
                    >
                      {item.label}
                      <span>{openItem === item.label ? "–" : "+"}</span>
                    </button>
                    {openItem === item.label && (
                      <div className={styles.mobileSub}>
                        {item.columns.map((col) => (
                          <div key={col.title}>
                            {item.columns!.length > 1 && <p>{col.title}</p>}
                            {col.links.map((l) => (
                              <Link key={l.label} href={l.href} onClick={() => setPanel("none")}>
                                {l.label}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href} className={styles.mobileTop} onClick={() => setPanel("none")}>
                    <span>
                      {item.label}
                      {item.badge && <span className={styles.badge}>{item.badge}</span>}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </aside>
      )}

      {panel === "bag" && (
        <aside className={`${styles.drawer} ${styles.drawerRight}`} aria-label="Your bag">
          <div className={styles.drawerHead}>
            <span>Your Bag</span>
            <button className={styles.icon} aria-label="Close bag" onClick={() => setPanel("none")}>
              {Icon.close}
            </button>
          </div>
          {bag.length === 0 ? (
            <div className={styles.bagEmpty}>
              <p>Your bag is empty.</p>
              <Link href="/collections/fine-jewelry" className="btn" onClick={() => setPanel("none")}>
                Shop Fine Jewelry
              </Link>
            </div>
          ) : (
            <>
              <ul className={styles.bagList}>
                {bag.map((l) => (
                  <li key={l.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={l.image} alt="" />
                    <div>
                      <Link href={l.href} onClick={() => setPanel("none")}>
                        {l.title}
                      </Link>
                      <p>
                        {l.qty > 1 && `${l.qty} × `}
                        {formatPrice(l.price)}
                      </p>
                      <button onClick={() => removeFromBag(l.id)}>Remove</button>
                    </div>
                  </li>
                ))}
              </ul>
              <div className={styles.bagFoot}>
                <p>
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </p>
                <small>Shipping and taxes calculated at checkout.</small>
                <button className="btn" disabled title="Checkout is not connected in this demo">
                  Check Out
                </button>
                <small>Checkout is not connected in this demo.</small>
              </div>
            </>
          )}
        </aside>
      )}
    </>
  );
}
