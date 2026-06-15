import {
  TYPE_PALETTES,
  clamp,
  liveRootMidi,
  type TypePalette,
} from "@/lib/echoTypeWaveforms";
import {
  FACTORY_MELODY_SEMI,
  FACTORY_PROFILE,
} from "@/lib/echoFactoryProfile";
import type { EchoType, PeerProfileSnapshot } from "@/lib/types";

const DEFAULT_MELODY_SEMI = FACTORY_MELODY_SEMI;

const DEFAULT_TRAITS: Record<
  EchoType,
  Pick<PeerProfileSnapshot, "brightness" | "calmness" | "densityBias">
> = {
  shy: {
    brightness: FACTORY_PROFILE.shy.brightness,
    calmness: FACTORY_PROFILE.shy.calmness,
    densityBias: FACTORY_PROFILE.shy.densityBias,
  },
  bounce: {
    brightness: FACTORY_PROFILE.bounce.brightness,
    calmness: FACTORY_PROFILE.bounce.calmness,
    densityBias: FACTORY_PROFILE.bounce.densityBias,
  },
  messy: {
    brightness: FACTORY_PROFILE.messy.brightness,
    calmness: FACTORY_PROFILE.messy.calmness,
    densityBias: FACTORY_PROFILE.messy.densityBias,
  },
};

function numberIn01(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value)
    ? clamp(value, 0, 1)
    : fallback;
}

function normalizeMelodySemi(
  value: unknown,
  echoType: EchoType,
): number[] {
  const fallback = DEFAULT_MELODY_SEMI[echoType];
  if (!Array.isArray(value)) return [...fallback];
  const slots = value
    .slice(0, 8)
    .map((semi) =>
      typeof semi === "number" && Number.isFinite(semi)
        ? clamp(Math.round(semi), 0, 24)
        : null,
    );
  while (slots.length < 8) {
    slots.push(fallback[slots.length] ?? 0);
  }
  return slots.map((semi, index) => semi ?? fallback[index] ?? 0);
}

/** Normalize Pi / BLE `otherEchoProfileSnapshot` for synth + API. */
export function normalizePeerProfileSnapshot(
  value: unknown,
  echoType: EchoType,
): PeerProfileSnapshot | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const traits = DEFAULT_TRAITS[echoType];
  return {
    melodySemi: normalizeMelodySemi(raw.melodySemi, echoType),
    brightness: numberIn01(raw.brightness, traits.brightness),
    calmness: numberIn01(raw.calmness, traits.calmness),
    densityBias: numberIn01(raw.densityBias, traits.densityBias),
  };
}

export function factoryPeerProfileSnapshot(
  echoType: EchoType,
): PeerProfileSnapshot {
  const traits = DEFAULT_TRAITS[echoType];
  return {
    melodySemi: [...DEFAULT_MELODY_SEMI[echoType]],
    ...traits,
  };
}

function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function nearestPaletteHz(echoType: EchoType, hz: number): number {
  const palette = TYPE_PALETTES[echoType];
  return palette.notes.reduce((best, candidate) =>
    Math.abs(candidate - hz) < Math.abs(best - hz) ? candidate : best,
  );
}

/** melodySemi[slot] + peer root — blended toward palette for type identity. */
export function frequencyFromPeerSnapshot(
  echoType: EchoType,
  noteIndex: number,
  melodySemi: number[],
): number {
  const root = liveRootMidi(echoType);
  const semi = melodySemi[noteIndex % 8] ?? 0;
  const snapshotHz = midiToFreq(root + semi);
  const nearest = nearestPaletteHz(echoType, snapshotHz);
  return snapshotHz * 0.74 + nearest * 0.26;
}

/** Small nudges from peer traits — type palette stays dominant. */
export function paletteWithPeerTraits(
  palette: TypePalette,
  snapshot: PeerProfileSnapshot | null,
  echoType: EchoType,
): TypePalette {
  const traits = snapshot ?? factoryPeerProfileSnapshot(echoType);
  return {
    ...palette,
    amp: palette.amp * clamp(0.82 + traits.brightness * 0.28, 0.7, 1.18),
    decay: palette.decay * clamp(0.9 + traits.calmness * 0.16, 0.85, 1.35),
    spacing:
      palette.spacing *
      clamp(1.06 - traits.densityBias * 0.14 + traits.calmness * 0.1, 0.72, 1.28),
  };
}
