import type { EchoType } from "@/lib/types";

/** Pi `daily_sound.py` `_TYPE_PALETTES` — verbatim Hz / timing values. */
export type TypePalette = {
  notes: number[];
  amp: number;
  decay: number;
  pan: number;
  attack: number;
  spacing: number;
};

export const TYPE_PALETTES: Record<EchoType, TypePalette> = {
  bounce: {
    notes: [261.63, 293.66, 329.63, 392.0, 440.0, 493.88],
    amp: 0.31,
    decay: 0.42,
    pan: 0.55,
    attack: 0.034,
    spacing: 0.5,
  },
  shy: {
    notes: [196.0, 233.08, 261.63, 293.66, 329.63, 392.0],
    amp: 0.21,
    decay: 1.45,
    pan: 0.35,
    attack: 0.14,
    spacing: 1.55,
  },
  messy: {
    notes: [1046.5, 1174.66, 1318.51, 1396.91, 1567.98, 1760.0],
    amp: 0.23,
    decay: 0.26,
    pan: 0.58,
    attack: 0.028,
    spacing: 0.3,
  },
};

/** Firmware live-synth root MIDI per type (`rootMidiForType`). */
export function liveRootMidi(echoType: EchoType): number {
  if (echoType === "shy") return 56;
  if (echoType === "bounce") return 60;
  return 88;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function triangleRad(phase: number): number {
  return Math.asin(clamp(Math.sin(phase), -1, 1)) * (2 / Math.PI);
}

function smoothstep01(value: number): number {
  const p = clamp(value, 0, 1);
  return p * p * (3 - 2 * p);
}

/**
 * Pi `_sample_for_type` / firmware `samplePeerVoice` — phase in radians (0 → 2π/cycle).
 * Soft, rounded voices — less piano-pluck, more toy-like and playful.
 */
export function sampleForType(
  echoType: EchoType,
  phase: number,
  phase2?: number,
): number {
  if (echoType === "bounce") {
    const sine = Math.sin(phase);
    const bounce = triangleRad(phase) * 0.18;
    const puff = Math.sin(phase * 0.5) * 0.07;
    return sine * 0.86 + bounce + puff;
  }

  if (echoType === "shy") {
    const sine = Math.sin(phase);
    const breath = Math.sin(phase * 2.0) * 0.05;
    const shimmer = Math.sin(phase * 3.0) * 0.025;
    return sine * 0.9 + breath + shimmer;
  }

  const chirp = Math.sin(phase * 1.5) * 0.09;
  const flutter = Math.sin(phase * 5.5) * 0.045;
  let sample = Math.sin(phase) * 0.84 + chirp + flutter;
  if (phase2 !== undefined) {
    sample += Math.sin(phase2) * 0.08;
  }
  return sample;
}

/** Gentle pitch wobble + tiny attack scoop for a cute, living tone. */
export function notePitchMultiplier(
  echoType: EchoType,
  t: number,
  attack: number,
  wobbleSeed: number,
): number {
  const vibratoRate =
    echoType === "shy" ? 4.4 : echoType === "bounce" ? 6.0 : 7.4;
  const vibratoDepth =
    echoType === "shy" ? 0.0055 : echoType === "bounce" ? 0.0105 : 0.008;
  const vibratoPhase = t * vibratoRate * Math.PI * 2 + wobbleSeed * 13.7;
  const vibrato = 1 + Math.sin(vibratoPhase) * vibratoDepth;

  let bend = 1;
  if (t < attack) {
    const progress = t / Math.max(attack, 0.0001);
    const scoop =
      echoType === "bounce" ? 0.075 : echoType === "messy" ? 0.048 : 0.028;
    bend = 1 + scoop * (1 - progress) ** 2;
  }

  return vibrato * bend;
}

/** Per-type envelope — soft attack, brief sustain, rounded tail. */
export function piDecayEnvelope(
  echoType: EchoType,
  t: number,
  attack: number,
  decay: number,
): number {
  if (t < 0) return 0;
  if (t < attack) return smoothstep01(t / Math.max(attack, 0.0001));
  const tail = (t - attack) / Math.max(decay, 0.001);
  if (tail >= 1) return 0;
  const sustain =
    echoType === "shy" ? 0.94 : echoType === "bounce" ? 0.9 : 0.88;
  const holdRatio = echoType === "shy" ? 0.22 : echoType === "bounce" ? 0.14 : 0.1;
  if (tail < holdRatio) return sustain;
  const fade = (tail - holdRatio) / Math.max(1 - holdRatio, 0.001);
  const power = echoType === "bounce" ? 1.65 : echoType === "messy" ? 2.0 : 1.05;
  return sustain * (1 - fade) ** power;
}

export function accumulateEchoNoteSamples(options: {
  echoType: EchoType;
  left: Float32Array;
  right: Float32Array;
  startSample: number;
  noteSamples: number;
  sampleRate: number;
  frequency: number;
  frequency2?: number;
  attack: number;
  decay: number;
  amp: number;
  pan: number;
  wobbleSeed: number;
  totalSamples: number;
}): void {
  const {
    echoType,
    left,
    right,
    startSample,
    noteSamples,
    sampleRate,
    frequency,
    frequency2,
    attack,
    decay,
    amp,
    pan,
    wobbleSeed,
    totalSamples,
  } = options;
  const leftGain = Math.cos((pan * Math.PI) / 2);
  const rightGain = Math.sin((pan * Math.PI) / 2);
  let phase = 0;
  let phase2 = 0;
  const phaseInc = (Math.PI * 2 * frequency) / sampleRate;
  const phase2Inc = frequency2 ? (Math.PI * 2 * frequency2) / sampleRate : 0;

  for (let i = 0; i < noteSamples; i += 1) {
    const sampleIndex = startSample + i;
    if (sampleIndex >= totalSamples) break;
    const t = i / sampleRate;
    const pitchMul = notePitchMultiplier(echoType, t, attack, wobbleSeed);
    const env = piDecayEnvelope(echoType, t, attack, decay) * amp;
    const dry = sampleForType(
      echoType,
      phase,
      frequency2 !== undefined ? phase2 : undefined,
    );
    const sample = dry * env;
    left[sampleIndex] += sample * leftGain;
    right[sampleIndex] += sample * rightGain;
    phase += phaseInc * pitchMul;
    if (frequency2 !== undefined) phase2 += phase2Inc * pitchMul;
  }
}

export function harmonyRatio(echoType: EchoType, rich: boolean): number {
  if (echoType === "bounce") return rich ? 2.004 : 1.004;
  if (echoType === "messy") return rich ? 2.004 : 1.01;
  return rich ? 1.004 : 1.001;
}
