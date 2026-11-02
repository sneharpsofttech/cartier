"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser, so the viewer skips server rendering.
const RingViewer = dynamic(() => import("./RingViewer"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        height: "100%",
        minHeight: 420,
        border: "1px solid var(--line)",
        background: "var(--card)",
        fontSize: 12,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        color: "var(--muted)",
      }}
    >
      Preparing your ring in 3D…
    </div>
  ),
});

export default RingViewer;
