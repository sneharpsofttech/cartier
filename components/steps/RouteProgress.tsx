"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./RouteProgress.module.css";

/** Give up waiting after this long (a failed or cancelled navigation). */
const GIVE_UP_MS = 12000;

/**
 * Page-change feedback: a slim brown bar runs along the top of the window the
 * moment a link to another page is clicked, and the page fades back a little,
 * until the new address takes over. Pages that render on the server (the shop
 * with its filters) can take a moment, and this shows the click registered.
 */
export default function RouteProgress() {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const from = useRef("");

  // Start on any plain click on a link to another page of this site.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || !a.href || a.hasAttribute("download") || (a.target && a.target !== "_self")) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      // The same page (or only a #section of it): nothing to wait for.
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      from.current = window.location.href;
      setState("loading");
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Finish once the address changes (the router updates it when the new page is shown).
  useEffect(() => {
    if (state === "loading") {
      document.documentElement.setAttribute("data-navigating", "");
      // Polled with a timer, not animation frames, which pause while the tab is in the background.
      const watch = window.setInterval(() => {
        if (window.location.href !== from.current) setState("done");
      }, 60);
      const giveUp = window.setTimeout(() => setState("done"), GIVE_UP_MS);
      return () => {
        window.clearInterval(watch);
        window.clearTimeout(giveUp);
      };
    }
    document.documentElement.removeAttribute("data-navigating");
    if (state === "done") {
      // Let the bar fill and fade before it goes.
      const reset = window.setTimeout(() => setState("idle"), 450);
      return () => window.clearTimeout(reset);
    }
  }, [state]);

  if (state === "idle") return null;
  return (
    <div className={styles.track} data-state={state} role="progressbar" aria-label="Loading page">
      <span className={styles.bar} />
    </div>
  );
}
