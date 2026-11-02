"use client";

import { forwardRef } from "react";
import * as THREE from "three";
import Head from "./Head";
import Shank, { CATHEDRAL_SHANKS, SHANK_HALF_WIDTH } from "./Shank";
import { PopIn } from "./parts";
import { gemColor, metalColor, type BandStyle, type RingConfig, type ShankStyle } from "./config";

/** Wedding bands reuse the shank builders. */
export const BAND_AS_SHANK: Record<Exclude<BandStyle, "none">, ShankStyle> = {
  plain: "solitaire",
  knifeEdge: "knifeEdge",
  eternity: "pave",
  twist: "twist",
};
const BAND_HALF_WIDTH = 0.11;
const BAND_GAP = 0.025;

const ConfigurableRing = forwardRef<THREE.Group, { config: RingConfig }>(function ConfigurableRing(
  { config },
  ref,
) {
  const accent = gemColor(config.accentGem);

  return (
    <group ref={ref}>
      <PopIn key={`head-${config.head}-${config.shape}-${CATHEDRAL_SHANKS.has(config.shank)}`}>
        <Head
          shape={config.shape}
          carat={config.carat}
          type={config.head}
          metal={metalColor(config.headMetal)}
          gem={gemColor(config.centerGem)}
          accent={accent}
          shoulders={CATHEDRAL_SHANKS.has(config.shank)}
        />
      </PopIn>

      <PopIn key={`shank-${config.shank}`}>
        <Shank style={config.shank} metal={metalColor(config.shankMetal)} accent={accent} />
      </PopIn>

      {config.band !== "none" && (
        <PopIn key={`band-${config.band}`}>
          <Shank
            style={BAND_AS_SHANK[config.band]}
            eternity
            metal={metalColor(config.bandMetal)}
            accent={accent}
            z={-(SHANK_HALF_WIDTH[config.shank] + BAND_HALF_WIDTH + BAND_GAP)}
          />
        </PopIn>
      )}
    </group>
  );
});

export default ConfigurableRing;
