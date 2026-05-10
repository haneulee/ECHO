import * as THREE from "three";

import type { EcologyPersonalityId } from "./types";

/**
 * Echo archetype colors (via `EcologyPersonalityId`): each particle mixes `colA`→`colB`
 * using attribute `aHue` + noise (shy = green → blue).
 */
export const MODEL_GRADIENTS: Record<
  EcologyPersonalityId,
  { colA: THREE.Vector3; colB: THREE.Vector3 }
> = {
  drift: {
    colA: new THREE.Vector3(0.14, 0.62, 0.36),
    colB: new THREE.Vector3(0.16, 0.44, 0.94),
  },
  ripple: {
    colA: new THREE.Vector3(0.18, 0.58, 0.72),
    colB: new THREE.Vector3(0.95, 0.62, 0.38),
  },
  bloom: {
    colA: new THREE.Vector3(0.62, 0.32, 0.78),
    colB: new THREE.Vector3(0.98, 0.84, 0.52),
  },
};
