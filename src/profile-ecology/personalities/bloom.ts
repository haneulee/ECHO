import * as THREE from "three";
import type { EcologyUniformSnapshot } from "../types";

/** Dense luminous bloom — brightest halo into white. */
export const bloomSnapshot: EcologyUniformSnapshot = {
  clearColor: new THREE.Color(0xffffff),
  fogColor: new THREE.Color(0xffffff),
  fogDensity: 0.009,
  blobBreathAmp: 0.036,
  blobDisplacement: 0.24,
  blobScale: 1.06,
  blobColorInner: new THREE.Vector3(0.95, 0.9, 1.0),
  blobColorOuter: new THREE.Vector3(0.82, 0.78, 0.98),
  blobOpacity: 0.97,
  particleBrightness: 0.92,
  particleDrift: 0.3,
  particleRippleCoupling: 0.32,
  particleBloomPulse: 0.58,
  particleDepthScatter: 0.42,
  particlePointScale: 0.102,
  bloomStrength: 0.94,
  bloomRadius: 0.62,
  bloomThreshold: 0.055,
  parallaxGain: 0.14,
  cameraBobGain: 0.088,
  resonanceDecay: 2.55,
};
