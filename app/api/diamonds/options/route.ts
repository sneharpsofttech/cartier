import { NextResponse } from "next/server";
import {
  CLARITIES,
  COLORS,
  CUTS,
  FANCY_COLORS,
  FANCY_INTENSITIES,
  FINISHES,
  FLUORESCENCE,
  GEM_VARIETIES,
  LABS,
  SHAPES,
  SHAPE_LABELS,
  SORTS,
  SORT_LABELS,
  STONE_TYPES,
  STONE_TYPE_LABELS,
} from "@/lib/diamonds/grades";

/** GET /api/diamonds/options — every filter value the search accepts, best grade first. */
export function GET() {
  return NextResponse.json({
    types: STONE_TYPES.map((id) => ({ id, label: STONE_TYPE_LABELS[id] })),
    shapes: SHAPES.map((id) => ({ id, label: SHAPE_LABELS[id] })),
    colors: COLORS,
    clarities: CLARITIES,
    cuts: CUTS,
    finishes: FINISHES,
    fluorescence: FLUORESCENCE,
    labs: LABS,
    fancyColors: FANCY_COLORS,
    fancyIntensities: FANCY_INTENSITIES,
    gemVarieties: GEM_VARIETIES,
    sorts: SORTS.map((id) => ({ id, label: SORT_LABELS[id] })),
  });
}
