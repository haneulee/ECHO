import * as THREE from "three";
import type { EcologyUniformSnapshot } from "./types";

export function cloneEcologySnapshot(
  s: EcologyUniformSnapshot,
): EcologyUniformSnapshot {
  return {
    clearColor: s.clearColor.clone(),
    fogColor: s.fogColor.clone(),
    fogDensity: s.fogDensity,
    blobBreathAmp: s.blobBreathAmp,
    blobDisplacement: s.blobDisplacement,
    blobScale: s.blobScale,
    blobColorInner: s.blobColorInner.clone(),
    blobColorOuter: s.blobColorOuter.clone(),
    blobOpacity: s.blobOpacity,
    particleBrightness: s.particleBrightness,
    particleDrift: s.particleDrift,
    particleRippleCoupling: s.particleRippleCoupling,
    particleBloomPulse: s.particleBloomPulse,
    particleDepthScatter: s.particleDepthScatter,
    particlePointScale: s.particlePointScale,
    bloomStrength: s.bloomStrength,
    bloomRadius: s.bloomRadius,
    bloomThreshold: s.bloomThreshold,
    parallaxGain: s.parallaxGain,
    cameraBobGain: s.cameraBobGain,
    resonanceDecay: s.resonanceDecay,
  };
}

export function lerpEcologySnapshots(
  a: EcologyUniformSnapshot,
  b: EcologyUniformSnapshot,
  t: number,
): EcologyUniformSnapshot {
  const u = THREE.MathUtils.clamp(t, 0, 1);
  const out = cloneEcologySnapshot(a);
  out.clearColor.lerpColors(a.clearColor, b.clearColor, u);
  out.fogColor.lerpColors(a.fogColor, b.fogColor, u);
  out.fogDensity = THREE.MathUtils.lerp(a.fogDensity, b.fogDensity, u);
  out.blobBreathAmp = THREE.MathUtils.lerp(a.blobBreathAmp, b.blobBreathAmp, u);
  out.blobDisplacement = THREE.MathUtils.lerp(
    a.blobDisplacement,
    b.blobDisplacement,
    u,
  );
  out.blobScale = THREE.MathUtils.lerp(a.blobScale, b.blobScale, u);
  out.blobColorInner.lerpVectors(a.blobColorInner, b.blobColorInner, u);
  out.blobColorOuter.lerpVectors(a.blobColorOuter, b.blobColorOuter, u);
  out.blobOpacity = THREE.MathUtils.lerp(a.blobOpacity, b.blobOpacity, u);
  out.particleBrightness = THREE.MathUtils.lerp(
    a.particleBrightness,
    b.particleBrightness,
    u,
  );
  out.particleDrift = THREE.MathUtils.lerp(a.particleDrift, b.particleDrift, u);
  out.particleRippleCoupling = THREE.MathUtils.lerp(
    a.particleRippleCoupling,
    b.particleRippleCoupling,
    u,
  );
  out.particleBloomPulse = THREE.MathUtils.lerp(
    a.particleBloomPulse,
    b.particleBloomPulse,
    u,
  );
  out.particleDepthScatter = THREE.MathUtils.lerp(
    a.particleDepthScatter,
    b.particleDepthScatter,
    u,
  );
  out.particlePointScale = THREE.MathUtils.lerp(
    a.particlePointScale,
    b.particlePointScale,
    u,
  );
  out.bloomStrength = THREE.MathUtils.lerp(a.bloomStrength, b.bloomStrength, u);
  out.bloomRadius = THREE.MathUtils.lerp(a.bloomRadius, b.bloomRadius, u);
  out.bloomThreshold = THREE.MathUtils.lerp(
    a.bloomThreshold,
    b.bloomThreshold,
    u,
  );
  out.parallaxGain = THREE.MathUtils.lerp(a.parallaxGain, b.parallaxGain, u);
  out.cameraBobGain = THREE.MathUtils.lerp(a.cameraBobGain, b.cameraBobGain, u);
  out.resonanceDecay = THREE.MathUtils.lerp(
    a.resonanceDecay,
    b.resonanceDecay,
    u,
  );
  return out;
}
