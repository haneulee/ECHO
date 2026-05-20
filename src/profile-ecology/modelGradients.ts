import * as THREE from "three";

import type { EcologyPersonalityId } from "./types";

/**
 * Echo archetype colors (via `EcologyPersonalityId`): each particle mixes `colA`→`colB`
 * using shader hue + noise.
 */
export const MODEL_GRADIENTS: Record<
  EcologyPersonalityId,
  { colA: THREE.Vector3; colB: THREE.Vector3 }
> = {
  drift: {
    colA: new THREE.Vector3(0.56, 0.9, 0.77),
    colB: new THREE.Vector3(0.6, 0.85, 1.0),
  },
  ripple: {
    colA: new THREE.Vector3(0.95, 0.6, 0.76),
    colB: new THREE.Vector3(0.69, 0.65, 1.0),
  },
  bloom: {
    colA: new THREE.Vector3(1.0, 0.89, 0.43),
    colB: new THREE.Vector3(1.0, 0.62, 0.43),
  },
};
