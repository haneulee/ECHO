import type { Analyser } from "tone";

let toneAnalyser: Analyser | null = null;
let nativeAnalyser: AnalyserNode | null = null;
let nativeFftData: Uint8Array<ArrayBuffer> | null = null;
let noteSchedule: EchoNoteEvent[] = [];
let noteScheduleContext: BaseAudioContext | null = null;
let noteScheduleStartedAt = 0;
let noteScheduleLoopSeconds = 1;

/** Called when SoundMemoryPlayer wires synth → reverb → analyser → destination. */
export function registerEchoToneAnalyser(analyser: Analyser | null): void {
  toneAnalyser = analyser;
}

/** Called by Web Audio players that do not use Tone.js. */
export function registerEchoNativeAnalyser(analyser: AnalyserNode | null): void {
  nativeAnalyser = analyser;
  nativeFftData = analyser
    ? new Uint8Array(analyser.frequencyBinCount)
    : null;
}

export type EchoAudioBands = {
  bass: number;
  mid: number;
  high: number;
  /** Combined loudness 0–1 */
  level: number;
};

export type EchoNoteEvent = {
  time: number;
  hue: number;
  accent: number;
};

export type EchoNotePulse = {
  pulse: number;
  hue: number;
  accent: number;
};

const ZERO: EchoAudioBands = {
  bass: 0,
  mid: 0,
  high: 0,
  level: 0,
};

const ZERO_NOTE: EchoNotePulse = {
  pulse: 0,
  hue: 0.5,
  accent: 0,
};

export function registerEchoNoteSchedule(
  schedule: EchoNoteEvent[] | null,
  context: BaseAudioContext | null,
  startedAt: number,
  loopSeconds: number,
): void {
  noteSchedule = schedule ?? [];
  noteScheduleContext = context;
  noteScheduleStartedAt = startedAt;
  noteScheduleLoopSeconds = Math.max(0.1, loopSeconds);
}

function dbToNorm(db: number): number {
  const clamped = Math.max(-100, Math.min(0, db));
  return (clamped + 100) / 100;
}

function sampleNativeAudioBands(): EchoAudioBands | null {
  if (!nativeAnalyser || !nativeFftData) return null;

  nativeAnalyser.getByteFrequencyData(nativeFftData);
  const n = nativeFftData.length;
  if (n === 0) return ZERO;

  const iBass = Math.max(2, Math.floor(n * 0.12));
  const iMid = Math.max(iBass + 1, Math.floor(n * 0.45));

  let bass = 0;
  let mid = 0;
  let high = 0;
  for (let i = 0; i < iBass; i++) bass += nativeFftData[i]! / 255;
  for (let i = iBass; i < iMid; i++) mid += nativeFftData[i]! / 255;
  for (let i = iMid; i < n; i++) high += nativeFftData[i]! / 255;

  bass /= iBass;
  mid /= iMid - iBass;
  high /= n - iMid;

  const level = bass * 0.46 + mid * 0.36 + high * 0.18;

  return {
    bass: Math.min(1, bass * 1.75),
    mid: Math.min(1, mid * 1.65),
    high: Math.min(1, high * 1.55),
    level: Math.min(1, level * 1.75),
  };
}

/** Latest FFT frame → rough band energies (0–1). Safe to call every animation frame. */
export function sampleEchoAudioBands(): EchoAudioBands {
  const nativeBands = sampleNativeAudioBands();
  if (nativeBands) return nativeBands;

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

export function sampleEchoNotePulse(): EchoNotePulse {
  if (!noteScheduleContext || noteSchedule.length === 0) return ZERO_NOTE;

  const elapsed =
    ((noteScheduleContext.currentTime - noteScheduleStartedAt) %
      noteScheduleLoopSeconds +
      noteScheduleLoopSeconds) %
    noteScheduleLoopSeconds;

  let best: EchoNotePulse = ZERO_NOTE;
  for (const event of noteSchedule) {
    const forward =
      (elapsed - event.time + noteScheduleLoopSeconds) % noteScheduleLoopSeconds;
    const age = Math.min(forward, noteScheduleLoopSeconds - forward);
    if (age > 0.42) continue;

    const attack = age < 0.075 ? age / 0.075 : 1;
    const decay = Math.exp(-Math.max(0, age - 0.075) / 0.26);
    const pulse = Math.min(1, attack * decay * event.accent);
    if (pulse > best.pulse) {
      best = {
        pulse,
        hue: event.hue,
        accent: event.accent,
      };
    }
  }

  return best;
}
