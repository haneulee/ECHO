import { echoTypeFromFirmwareModelName } from "@/lib/echoFirmwareModelName";
import { liveRootMidi } from "@/lib/echoTypeWaveforms";
import type { EchoDevice, EchoType } from "@/lib/types";

export const PROXIMITY_BLEND_MAX = 0.12;

export type FirmwareVoice = {
  env: number;
  envDecay: number;
  baseCutoff: number;
  closenessCutoff: number;
  delayWet: number;
  rate: number;
  repeats: number;
  steps: number[];
  rhythm: number[];
  scale: number[];
  progression: number[];
};

export const FIRMWARE_VOICES: Record<EchoType, FirmwareVoice> = {
  bounce: {
    env: 0.58,
    envDecay: 0.9962,
    baseCutoff: 1350,
    closenessCutoff: 1650,
    delayWet: 0.18,
    rate: 0.32,
    repeats: 2,
    steps: [0, 2, 1, 3, 4, 2, 5, 3],
    rhythm: [0.72, 0.56, 1.12, 0.64, 0.82, 0.52, 1.28, 0.58],
    scale: [0, 2, 4, 7, 9, 12, 14, 16],
    progression: [0, 7, 9, 4],
  },
  shy: {
    env: 0.36,
    envDecay: 0.9988,
    baseCutoff: 560,
    closenessCutoff: 620,
    delayWet: 0.36,
    rate: 0.84,
    repeats: 2,
    steps: [0, 1, 2, 1, 0, 3, 2, 1],
    rhythm: [1.25, 0.9, 1.55, 1.05, 1.4, 0.95, 1.7, 1.1],
    scale: [0, 2, 4, 7, 9, 12, 14],
    progression: [0, 4, 9, 7],
  },
  messy: {
    env: 0.5,
    envDecay: 0.9958,
    baseCutoff: 1150,
    closenessCutoff: 1550,
    delayWet: 0.28,
    rate: 0.26,
    repeats: 3,
    steps: [0, 3, 1, 5, 2, 6, 4, 7, 1, 4],
    rhythm: [0.62, 0.38, 0.94, 0.44, 0.7, 0.36, 1.08, 0.48, 0.82, 0.4],
    scale: [0, 2, 3, 5, 7, 9, 10, 12, 14],
    progression: [0, 5, 10, 7, 3],
  },
};

export const DEFAULT_MELODY_SEMI: Record<EchoType, number[]> = {
  bounce: [0, 4, 7, 9, 7, 4, 2, 0],
  shy: [0, 2, 4, 7, 4, 2, 0, 0],
  messy: [0, 1, 5, 7, 10, 3, 8, 2],
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function unit(seed: string): number {
  return stableHash(seed) / 0xffffffff;
}

export function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/** Factory / live-synth root MIDI — shy G3, bounce C4, messy E6. */
export function firmwareRootMidi(echoType: EchoType): number {
  return liveRootMidi(echoType);
}

export function resolveFactoryEchoType(
  device: Pick<EchoDevice, "echoType" | "echoModelType" | "firmwareModelName">,
): EchoType {
  const model = device.echoModelType?.trim();
  if (model) {
    const lowered = model.toLowerCase();
    if (lowered === "shy" || lowered === "messy" || lowered === "bounce") {
      return lowered;
    }
    return echoTypeFromFirmwareModelName(model);
  }
  if (device.firmwareModelName) {
    return echoTypeFromFirmwareModelName(device.firmwareModelName);
  }
  return device.echoType;
}

function noteNameToMidi(note: string): number | null {
  const match = /^([A-G])(#?)(-?\d+)$/.exec(note.trim());
  if (!match) return null;
  const [, pitch, sharp, octaveRaw] = match;
  const base: Record<string, number> = {
    C: 0,
    D: 2,
    E: 4,
    F: 5,
    G: 7,
    A: 9,
    B: 11,
  };
  const octave = Number(octaveRaw);
  if (!Number.isFinite(octave)) return null;
  return (octave + 1) * 12 + base[pitch] + (sharp ? 1 : 0);
}

function normalizeMelodySemiSlots(semis: number[]): number[] {
  return semis
    .slice(0, 8)
    .map((semi) => ((Math.round(semi) % 12) + 12) % 12);
}

/** profileSnapshot melodySemi[8] is authoritative; note names are a legacy fallback. */
export function melodySemiFromProfile(
  factoryType: EchoType,
  state: Pick<EchoDevice["currentState"], "melody" | "melodySemi">,
): number[] {
  if (Array.isArray(state.melodySemi) && state.melodySemi.length > 0) {
    const normalized = normalizeMelodySemiSlots(state.melodySemi);
    if (normalized.length > 0) return normalized;
  }

  const root = firmwareRootMidi(factoryType);
  const semis = state.melody
    .map(noteNameToMidi)
    .filter((midi): midi is number => midi !== null)
    .map((midi) => ((Math.round(midi - root) % 12) + 12) % 12);

  return semis.length > 0 ? semis.slice(0, 8) : DEFAULT_MELODY_SEMI[factoryType];
}

export function melodySemiFromDevice(device: EchoDevice): number[] {
  const factoryType = resolveFactoryEchoType(device);
  return melodySemiFromProfile(factoryType, device.currentState);
}

export type ProfileSoundParams = {
  brightness: number;
  calmness: number;
  densityBias: number;
};

export function profileSoundParamsFromDevice(
  device: EchoDevice,
): ProfileSoundParams {
  const { brightness, calmness, densityBias } = device.currentState;
  return {
    brightness: clamp(brightness, 0, 1),
    calmness: clamp(calmness, 0, 1),
    densityBias: clamp(densityBias, 0, 1),
  };
}

export function envFromBrightness(baseEnv: number, brightness: number): number {
  return baseEnv * clamp(0.68 + brightness * 0.52, 0.55, 1.22);
}

export function profileTriggerRate(
  factoryType: EchoType,
  params: ProfileSoundParams,
): number {
  const voice = FIRMWARE_VOICES[factoryType];
  return clamp(
    voice.rate +
      params.calmness * (factoryType === "shy" ? 0.18 : 0.1) -
      params.densityBias * (factoryType === "shy" ? 0.05 : 0.09),
    factoryType === "messy" ? 0.18 : 0.24,
    factoryType === "shy" ? 1.12 : 0.72,
  );
}

export function profileCutoff(
  factoryType: EchoType,
  params: ProfileSoundParams,
  triggerSeed: string,
): number {
  const voice = FIRMWARE_VOICES[factoryType];
  const brightLift = params.brightness * voice.closenessCutoff * 0.42;
  const calmDarken = params.calmness * voice.closenessCutoff * 0.34;
  const messyJitter =
    factoryType === "messy"
      ? unit(`${triggerSeed}:cutoff`) * voice.closenessCutoff * 0.22
      : 0;
  return voice.baseCutoff + brightLift + messyJitter - calmDarken;
}

export function proximityBlendAmount(closeness: number): number {
  return clamp(closeness, 0, 1) * PROXIMITY_BLEND_MAX;
}

export function blendTowardPeer(
  mine: number,
  peer: number,
  closeness: number,
): number {
  const blend = proximityBlendAmount(closeness);
  return mine * (1 - blend) + peer * blend;
}

export function nearestScaleSemi(semi: number, scale: number[]): number {
  const octave = Math.floor(semi / 12) * 12;
  const normalized = ((semi % 12) + 12) % 12;
  return (
    scale
      .map((scaleSemi) => octave + scaleSemi)
      .sort(
        (a, b) =>
          Math.abs(a - (octave + normalized)) -
          Math.abs(b - (octave + normalized)),
      )[0] ?? semi
  );
}

export function phraseSemi(
  seed: string,
  factoryType: EchoType,
  triggerIndex: number,
  sourceSemis: number[],
): number {
  const voice = FIRMWARE_VOICES[factoryType];
  const phraseIndex = Math.floor(triggerIndex / 8);
  const phraseStep = triggerIndex % 8;
  const progressionRoot =
    voice.progression[phraseIndex % voice.progression.length] ?? 0;
  const motifSemi =
    sourceSemis[
      (voice.steps[phraseStep % voice.steps.length] ?? phraseStep) %
        sourceSemis.length
    ] ?? 0;
  const randomDegree = Math.floor(
    unit(`${seed}:phrase:${phraseIndex}:step:${phraseStep}`) *
      voice.scale.length,
  );
  const contour =
    phraseStep === 0
      ? 0
      : phraseStep === 3 || phraseStep === 6
        ? 1
        : unit(`${seed}:contour:${phraseIndex}:${phraseStep}`) > 0.68
          ? -1
          : 0;
  const scaleSemi =
    voice.scale[(randomDegree + phraseStep + contour) % voice.scale.length] ?? 0;
  const blended =
    unit(`${seed}:motif-blend:${phraseIndex}:${phraseStep}`) > 0.42
      ? scaleSemi
      : nearestScaleSemi(motifSemi, voice.scale);
  const octave =
    phraseStep > 4 && factoryType !== "shy"
      ? 12
      : phraseStep === 7 && factoryType === "shy"
        ? -12
        : 0;

  return nearestScaleSemi(progressionRoot + blended + octave, voice.scale);
}
