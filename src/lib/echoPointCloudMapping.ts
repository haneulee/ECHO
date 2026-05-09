import type { EchoPersonalityVisual } from "@/three/imageParticleSystem";
import type { EchoType } from "./types";

/** Echo archetype → ecology plate (`public/assets/*.jpg`) for particle sampling. */
export const echoTypeToPointCloudVisual: Record<
  EchoType,
  EchoPersonalityVisual
> = {
  shy: "drift",
  messy: "ripple",
  bounce: "bloom",
};
