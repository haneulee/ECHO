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
    amp: 0.36,
    decay: 0.22,
    pan: 0.55,
    attack: 0.008,
    spacing: 0.42,
  },
  shy: {
    notes: [196.0, 233.08, 261.63, 293.66, 329.63, 392.0],
    amp: 0.2,
    decay: 1.15,
    pan: 0.35,
    attack: 0.085,
    spacing: 1.4,
  },
  messy: {
    notes: [1046.5, 1174.66, 1318.51, 1396.91, 1567.98, 1760.0],
    amp: 0.26,
    decay: 0.14,
    pan: 0.58,
    attack: 0.006,
    spacing: 0.22,
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

/**
 * Pi `_sample_for_type` / firmware `samplePeerVoice` — phase in radians (0 → 2π/cycle).
 * messy: flute whistle + wing flutter — no saw, no noise.
 */
export function sampleForType(
  echoType: EchoType,
  phase: number,
  phase2?: number,
): number {
  if (echoType === "bounce") {
    const tri = triangleRad(phase);
    const pluck = Math.sign(tri) * Math.abs(tri) ** 0.55;
    return pluck * 0.82 + Math.sin(phase) * 0.18;
  }

  if (echoType === "shy") {
    return Math.sin(phase) * 0.78 + triangleRad(phase) * 0.22;
  }

  const wing = Math.sin(phase * 9.0) * 0.08;
  let sample =
    Math.sin(phase) * 0.76 +
    Math.sin(phase * 2.0) * 0.14 +
    Math.sin(phase * 3.0) * 0.05 +
    wing;
  if (phase2 !== undefined) {
    sample += Math.sin(phase2) * 0.1;
  }
  return sample;
}

/** Per-type envelope tail after linear attack ramp. */
export function piDecayEnvelope(
  echoType: EchoType,
  t: number,
  attack: number,
  decay: number,
): number {
  if (t < 0) return 0;
  if (t < attack) return t / Math.max(attack, 0.0001);
  const tail = (t - attack) / Math.max(decay, 0.001);
  if (tail >= 1) return 0;
  const power = echoType === "bounce" ? 3.2 : echoType === "messy" ? 4.0 : 1.4;
  return (1 - tail) ** power;
}

export function harmonyRatio(echoType: EchoType, rich: boolean): number {
  if (echoType === "bounce") return rich ? 2.004 : 1.004;
  if (echoType === "messy") return rich ? 2.004 : 1.01;
  return rich ? 1.004 : 1.001;
}
