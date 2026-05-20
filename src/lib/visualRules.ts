import type { EchoType } from "./types";

export function getEchoColorPalette(echoType: EchoType) {
  const palettes = {
    shy: ["#8FE6C4", "#6ECDE8", "#9AD8FF"],
    messy: ["#F39AC1", "#D99AEF", "#AFA7FF"],
    bounce: ["#FFE36E", "#FFC45C", "#FF9F6E"],
  } satisfies Record<EchoType, string[]>;

  return palettes[echoType];
}

export function getBlobSizeFromDuration(durationSec: number) {
  return Math.min(92, Math.max(24, 18 + Math.sqrt(durationSec) * 3.1));
}

export function getOpacityFromCloseness(closenessAvg: number) {
  return Math.min(0.74, Math.max(0.22, 0.16 + closenessAvg * 0.58));
}

export function getRingThicknessFromDensity(density: number) {
  return Math.min(48, Math.max(16, 16 + density * 32));
}

/** Rounds floats for SVG props so SSR and the browser match (avoids hydration mismatches). */
export function svgRound(n: number, precision = 5): number {
  const factor = 10 ** precision;
  return Math.round(n * factor) / factor;
}

export function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
