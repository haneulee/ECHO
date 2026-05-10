import type * as THREE from "three";

export type EcologyPersonalityId = "drift" | "ripple" | "bloom";

/**
 * Fully-resolved uniform snapshot for one frame — lerped between personalities.
 */
export type EcologyUniformSnapshot = {
  clearColor: THREE.Color;
  fogColor: THREE.Color;
  fogDensity: number;
  blobBreathAmp: number;
  blobDisplacement: number;
  blobScale: number;
  blobColorInner: THREE.Vector3;
  blobColorOuter: THREE.Vector3;
  blobOpacity: number;
  particleBrightness: number;
  particleDrift: number;
  particleRippleCoupling: number;
  particleBloomPulse: number;
  particleDepthScatter: number;
  particlePointScale: number;
  bloomStrength: number;
  /** UnrealBloomPass radius in [0, 1]. */
  bloomRadius: number;
  bloomThreshold: number;
  parallaxGain: number;
  cameraBobGain: number;
  resonanceDecay: number;
};
