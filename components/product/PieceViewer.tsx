"use client";

import JewelryPiece, { PIECE_VIEW } from "@/components/viewer/JewelryPiece";
import { getProduct, productImage } from "@/lib/catalog/products";
import ModelStage from "./ModelStage";

/** Interactive 3D view of a jewellery piece (see ModelStage); a pendant's chain is shown but not framed. */
export default function PieceViewer({ slug }: { slug: string }) {
  const product = getProduct(slug);
  if (!product) return null;
  return (
    <ModelStage
      front={PIECE_VIEW[product.design.kind]}
      poster={productImage(product)}
      extra={<JewelryPiece product={product} part="chain" />}
    >
      <JewelryPiece product={product} part="piece" />
    </ModelStage>
  );
}
