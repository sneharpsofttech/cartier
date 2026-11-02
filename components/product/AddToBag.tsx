"use client";

import { useState } from "react";
import { addToBag, type BagLine } from "@/lib/bag";

/** "Add to cart": puts the piece in the bag and opens the bag drawer. */
export default function AddToBag({ line, className }: { line: Omit<BagLine, "qty">; className?: string }) {
  const [added, setAdded] = useState(false);
  return (
    <button
      className={className}
      onClick={() => {
        addToBag(line);
        setAdded(true);
        window.dispatchEvent(new Event("bag-open"));
      }}
    >
      {added ? "Added to Bag" : "Add to Cart"}
    </button>
  );
}
