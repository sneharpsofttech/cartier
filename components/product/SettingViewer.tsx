"use client";

import ConfigurableRing from "@/components/viewer/ring/ConfigurableRing";
import { getSetting, settingConfig, settingImage } from "@/lib/settings/catalog";
import ModelStage from "./ModelStage";

/** Interactive 3D view of an engagement-ring setting in one metal (see ModelStage). */
export default function SettingViewer({ slug, metal }: { slug: string; metal: string }) {
  const setting = getSetting(slug);
  if (!setting) return null;
  return (
    <ModelStage front={[3.3, 2.3, 5.6]} poster={settingImage(setting, metal)}>
      <ConfigurableRing config={settingConfig(setting, metal)} />
    </ModelStage>
  );
}
