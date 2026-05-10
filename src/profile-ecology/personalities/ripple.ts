import * as THREE from "three";
import type { EcologyUniformSnapshot } from "../types";

/** Responsive rings — slightly warmer teal emphasis. */
export const rippleSnapshot: EcologyUniformSnapshot = {
  clearColor: new THREE.Color(0xffffff),
  fogColor: new THREE.Color(0xffffff),
  fogDensity: 0.008,
  blobBreathAmp: 0.03,
  blobDisplacement: 0.21,
  blobScale: 1.045,
  blobColorInner: new THREE.Vector3(0.88, 0.95, 1.0),
  blobColorOuter: new THREE.Vector3(0.72, 0.88, 0.96),
  blobOpacity: 0.96,
  particleBrightness: 0.88,
  particleDrift: 0.34,
  particleRippleCoupling: 0.58,
  particleBloomPulse: 0.22,
  particleDepthScatter: 0.38,
  particlePointScale: 0.095,
  bloomStrength: 0.88,
  bloomRadius: 0.56,
  bloomThreshold: 0.065,
  parallaxGain: 0.16,
  cameraBobGain: 0.078,
  resonanceDecay: 2.4,
};
