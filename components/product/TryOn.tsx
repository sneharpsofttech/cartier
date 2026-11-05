"use client";

import { useState } from "react";
import HandTryOn from "@/components/viewer/tryon/HandTryOn";
import HeadTryOn from "@/components/viewer/tryon/HeadTryOn";
import { HAND_MODEL, SKIN_TONES } from "@/components/viewer/tryon/hands";
import JewelryPiece from "@/components/viewer/JewelryPiece";
import { getProduct } from "@/lib/catalog/products";
import { getSetting, settingConfig } from "@/lib/settings/catalog";

/**
 * A piece from a product page, worn: an engagement-ring setting in the chosen
 * metal, or a jewellery-shop ring or band, on the 3D hand's ring finger; a
 * bracelet round its wrist; earrings or a pendant on the 3D head and shoulders.
 */
export default function TryOn({ slug, setting }: { slug: string; setting?: { metal: string } }) {
  const [skin, setSkin] = useState(SKIN_TONES[0].id);
  const ring = setting ? getSetting(slug) : null;
  const product = setting ? null : getProduct(slug);
  if (!ring && !product) return null;
  if (product && ["studs", "cluster", "pendant"].includes(product.design.kind)) {
    return <HeadTryOn product={product} skin={skin} onSkinChange={setSkin} compact />;
  }
  const wrist = product?.design.kind === "bracelet";
  return (
    <HandTryOn
      config={ring ? settingConfig(ring, setting!.metal) : undefined}
      piece={
        product ? <JewelryPiece product={product} wrist={wrist ? HAND_MODEL.wrist.radii : undefined} /> : undefined
      }
      wear={wrist ? "wrist" : "finger"}
      skin={skin}
      onSkinChange={setSkin}
      autoRotate
      rotateSpeed={1}
      compact
    />
  );
}
