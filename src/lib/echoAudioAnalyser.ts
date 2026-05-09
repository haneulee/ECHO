import type { Analyser } from "tone";

let toneAnalyser: Analyser | null = null;

/** Called when SoundMemoryPlayer wires synth → reverb → analyser → destination. */
export function registerEchoToneAnalyser(analyser: Analyser | null): void {
  toneAnalyser = analyser;
}

export type EchoAudioBands = {
  bass: number;
  mid: number;
  high: number;
  /** Combined loudness 0–1 */
  level: number;
};

const ZERO: EchoAudioBands = {
  bass: 0,
  mid: 0,
  high: 0,
  level: 0,
};

function dbToNorm(db: number): number {
  const clamped = Math.max(-100, Math.min(0, db));
  return (clamped + 100) / 100;
}

/** Latest FFT frame → rough band energies (0–1). Safe to call every animation frame. */
export function sampleEchoAudioBands(): EchoAudioBands {
  if (!toneAnalyser) return ZERO;

  const fft = toneAnalyser.getValue() as Float32Array;
  const n = fft.length;
  if (n === 0) return ZERO;

  const iBass = Math.max(2, Math.floor(n * 0.12));
  const iMid = Math.max(iBass + 1, Math.floor(n * 0.45));

  let bass = 0;
  let mid = 0;
  let high = 0;
  for (let i = 0; i < iBass; i++) bass += dbToNorm(fft[i]!);
  for (let i = iBass; i < iMid; i++) mid += dbToNorm(fft[i]!);
  for (let i = iMid; i < n; i++) high += dbToNorm(fft[i]!);

  bass /= iBass;
  mid /= iMid - iBass;
  high /= n - iMid;

  const level = bass * 0.45 + mid * 0.35 + high * 0.2;

  return {
    bass: Math.min(1, bass * 1.35),
    mid: Math.min(1, mid * 1.35),
    high: Math.min(1, high * 1.35),
    level: Math.min(1, level * 1.2),
  };
}
