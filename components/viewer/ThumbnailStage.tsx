"use client";

import dynamic from "next/dynamic";

// WebGL only exists in the browser.
const ThumbnailScene = dynamic(() => import("./ThumbnailScene"), { ssr: false });
const StoneScene = dynamic(() => import("./StoneScene"), { ssr: false });
const ProductScene = dynamic(() => import("./ProductScene"), { ssr: false });

type Props =
  | { kind: "shank" | "band"; style: string }
  | { kind: "setting"; style: string; metal: string; background?: string }
  | { kind: "stone"; shape: string; tint: string }
  | { kind: "product"; style: string; background?: string; view?: number };

export default function ThumbnailStage(props: Props) {
  if (props.kind === "stone") return <StoneScene shape={props.shape} tint={props.tint} />;
  if (props.kind === "product") return <ProductScene slug={props.style} background={props.background} view={props.view} />;
  return <ThumbnailScene {...props} />;
}
