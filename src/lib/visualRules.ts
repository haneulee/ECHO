import type { EchoType } from "./types";

export function getEchoColorPalette(echoType: EchoType) {
  const palettes = {
    light: ["#44DDE6", "#F8D95A", "#9DE8C7"],
    deep: ["#233B8F", "#7B4BCE", "#EF6F7A"],
    halo: ["#F45BC5", "#FF8D6B", "#B98CFF"],
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

export function seededRandom(seed: number) {
  let state = seed % 2147483647;
  if (state <= 0) state += 2147483646;

  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}
