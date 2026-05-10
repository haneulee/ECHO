import * as THREE from "three";
import type { EcologyUniformSnapshot } from "../types";

/** Sparse breath on a white field — cool violet-blue bias. */
export const driftSnapshot: EcologyUniformSnapshot = {
  clearColor: new THREE.Color(0xffffff),
  fogColor: new THREE.Color(0xffffff),
  fogDensity: 0.007,
  blobBreathAmp: 0.022,
  blobDisplacement: 0.16,
  blobScale: 1.03,
  blobColorInner: new THREE.Vector3(0.92, 0.94, 1.0),
  blobColorOuter: new THREE.Vector3(0.78, 0.82, 0.98),
  blobOpacity: 0.94,
  particleBrightness: 0.95,
  particleDrift: 0.18,
  particleRippleCoupling: 0.07,
  particleBloomPulse: 0.06,
  particleDepthScatter: 0.26,
  particlePointScale: 0.11,
  bloomStrength: 0.82,
  bloomRadius: 0.52,
  bloomThreshold: 0.07,
  parallaxGain: 0.1,
  cameraBobGain: 0.065,
  resonanceDecay: 2.15,
};
