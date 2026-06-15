import { liveRootMidi } from "@/lib/echoTypeWaveforms";
import type { EchoType } from "@/lib/types";

export type FactoryProfile = {
  melodySemi: number[];
  brightness: number;
  calmness: number;
  densityBias: number;
};

/** Factory defaults from ECHO-esp EchoFirmware/AudioSynth.cpp `initEchoMelodyState()`. */
export const FACTORY_PROFILE: Record<EchoType, FactoryProfile> = {
  bounce: {
    melodySemi: [0, 4, 7, 4, 9, 7, 4, 0],
    brightness: 0.58,
    calmness: 0.42,
    densityBias: 0.54,
  },
  shy: {
    melodySemi: [0, 3, 5, 7, 5, 3, 0, 0],
    brightness: 0.4,
    calmness: 0.88,
    densityBias: 0.26,
  },
  messy: {
    melodySemi: [0, 2, 4, 7, 9, 11, 7, 4],
    brightness: 0.54,
    calmness: 0.34,
    densityBias: 0.66,
  },
};

export const FACTORY_INFLUENCES: Record<
  EchoType,
  { shy: number; messy: number; bounce: number }
> = {
  shy: { shy: 0.55, messy: 0.22, bounce: 0.23 },
  messy: { shy: 0.22, messy: 0.55, bounce: 0.23 },
  bounce: { shy: 0.23, messy: 0.22, bounce: 0.55 },
};

export const FACTORY_MELODY_SEMI: Record<EchoType, number[]> = {
  bounce: [...FACTORY_PROFILE.bounce.melodySemi],
  shy: [...FACTORY_PROFILE.shy.melodySemi],
  messy: [...FACTORY_PROFILE.messy.melodySemi],
};

/** Peer-type motif pools for evolution borrowing (EchoState.cpp) — MESSY ≠ factory melody. */
export const EVOLUTION_PEER_POOLS: Record<EchoType, number[]> = {
  bounce: [0, 4, 7, 4, 9, 7, 4, 0],
  shy: [0, 3, 5, 7, 5, 3, 0, 0],
  messy: [0, 1, 3, 6, 10, 8, 5, 2],
};

/** Pre-refactor shared melody note names (all echo types). */
export const LEGACY_UNIVERSAL_MELODY = [
  "E4",
  "G4",
  "A4",
  "C5",
  "D5",
  "A4",
  "G4",
  "E4",
] as const;

/** Docs-only messy example that was mistakenly applied to every type. */
export const LEGACY_UNIVERSAL_MELODY_SEMI = [0, 2, 4, 7, 9, 11, 7, 4] as const;

const PITCH_NAMES = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
] as const;

function midiToNoteName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const pitch = PITCH_NAMES[((Math.round(midi) % 12) + 12) % 12];
  return `${pitch}${octave}`;
}

export function factoryMelodyNotes(echoType: EchoType): string[] {
  return melodyNotesFromSemi(echoType, FACTORY_PROFILE[echoType].melodySemi);
}

export function melodyNotesFromSemi(echoType: EchoType, semis: number[]): string[] {
  const root = liveRootMidi(echoType);
  return semis.map((semi) => midiToNoteName(root + semi));
}

export function factoryStateForType(t: EchoType) {
  const profile = FACTORY_PROFILE[t];
  return {
    melody: factoryMelodyNotes(t),
    melodySemi: [...profile.melodySemi],
    brightness: profile.brightness,
    calmness: profile.calmness,
    densityBias: profile.densityBias,
    influences: { ...FACTORY_INFLUENCES[t] },
  };
}

function melodySemiKey(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  if (!value.every((n) => typeof n === "number" && Number.isFinite(n))) return null;
  return value.map((n) => Math.round(n)).join(",");
}

function melodyKey(value: unknown): string | null {
  if (!Array.isArray(value) || !value.every((n) => typeof n === "string")) return null;
  return value.join(",");
}

/** True when a row still carries the old shared default and should get per-type factory values. */
export function isLegacyFactoryState(
  echoType: EchoType,
  state: Record<string, unknown>,
  lastSyncedAt: Date | null,
): boolean {
  const semiKey = melodySemiKey(state.melodySemi);
  const melody = melodyKey(state.melody);
  const universalMelody = LEGACY_UNIVERSAL_MELODY.join(",");
  const universalSemi = LEGACY_UNIVERSAL_MELODY_SEMI.join(",");
  const messySemi = FACTORY_PROFILE.messy.melodySemi.join(",");

  if (lastSyncedAt === null) {
    if (semiKey === null) {
      return melody === null || melody === universalMelody;
    }
    if (semiKey === universalSemi) return true;
    if (semiKey === messySemi && echoType !== "messy") return true;
    return false;
  }

  if (semiKey === universalSemi) return true;
  if (semiKey === messySemi && echoType !== "messy") return true;
  return false;
}
