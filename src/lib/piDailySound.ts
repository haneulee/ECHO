import {
  TYPE_PALETTES,
  accumulateEchoNoteSamples,
  clamp,
  harmonyRatio,
} from "@/lib/echoTypeWaveforms";
import {
  frequencyFromPeerSnapshot,
  paletteWithPeerTraits,
} from "@/lib/peerSonicSnapshot";
import type { EchoType, PeerProfileSnapshot, ProximityZone } from "@/lib/types";

export type PiEncounterInput = {
  id: string;
  otherEchoType: EchoType;
  otherEchoProfileSnapshot?: PeerProfileSnapshot | null;
  otherEchoSonicSource?: string | null;
  proximityZone?: ProximityZone;
  durationSec: number;
  closenessAvg: number;
  rssiAvg: number;
  startedAt: string;
  endedAt: string;
};

export type PiScheduledNote = {
  time: number;
  frequency: number;
  frequency2?: number;
  duration: number;
  amp: number;
  attack: number;
  decay: number;
  pan: number;
  sourceType: EchoType;
  encounterId?: string;
};

export type PiDailySoundPlan = {
  durationSec: number;
  notes: PiScheduledNote[];
};

const MIN_DURATION_SEC = 8;
const MAX_DURATION_SEC = 180;
const DEFAULT_DURATION_SEC = 45;
const SAMPLE_RATE = 44100;

const PROXIMITY_DENSITY: Record<ProximityZone, number> = {
  far: 0.55,
  near: 0.72,
  close: 0.88,
  very_close: 1,
};

function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function unit(seed: string): number {
  return stableHash(seed) / 0xffffffff;
}

function resolveEchoType(raw: EchoType | string | undefined): EchoType {
  const t = (raw ?? "shy").toString().toLowerCase();
  if (t === "bounce" || t === "messy" || t === "shy") return t;
  return "shy";
}

function rssiToCloseness(rssi: number): number {
  return clamp(((rssi - -92) / (-55 - -92)) ** 0.75, 0, 1);
}

function normalizedCloseness(encounter: PiEncounterInput): number {
  if (Number.isFinite(encounter.closenessAvg)) {
    return clamp(encounter.closenessAvg, 0, 1);
  }
  return rssiToCloseness(encounter.rssiAvg);
}

function proximityDensity(encounter: PiEncounterInput): number {
  if (encounter.proximityZone) {
    return PROXIMITY_DENSITY[encounter.proximityZone];
  }
  return 0.55 + normalizedCloseness(encounter) * 0.45;
}

function sortedEncounters(encounters: PiEncounterInput[]): PiEncounterInput[] {
  return [...encounters].sort((a, b) => {
    const byTime = (a.startedAt || a.id).localeCompare(b.startedAt || b.id);
    return byTime === 0 ? a.id.localeCompare(b.id) : byTime;
  });
}

function renderDuration(encounters: PiEncounterInput[]): number {
  if (encounters.length === 0) return DEFAULT_DURATION_SEC;
  const totalEncounterSeconds = encounters.reduce(
    (sum, encounter) => sum + Math.max(0, encounter.durationSec),
    0,
  );
  return clamp(
    8 + encounters.length * 1.5 + totalEncounterSeconds / 150,
    MIN_DURATION_SEC,
    MAX_DURATION_SEC,
  );
}

function dateSeed(date: string, encounters: PiEncounterInput[]): string {
  return [
    date,
    ...encounters.map((e) =>
      [
        e.id,
        e.otherEchoType,
        Math.round(e.durationSec),
        normalizedCloseness(e).toFixed(3),
        e.rssiAvg.toFixed(1),
        e.startedAt,
        e.otherEchoProfileSnapshot?.melodySemi?.join(",") ?? "",
      ].join(":"),
    ),
  ].join("|");
}

function effectiveSpacing(
  echoType: EchoType,
  baseSpacing: number,
  closeness: number,
  density: number,
): number {
  const sparse = 1.35 - closeness * 0.8;
  let spacing = (baseSpacing * sparse) / density;
  if (echoType === "messy") {
    spacing = Math.max(0.036, spacing * (1.05 - closeness * 0.65));
  } else if (echoType === "shy") {
    spacing = clamp(spacing, 0.3, 0.52);
  } else {
    spacing = clamp(spacing, 0.13, 0.32);
  }
  return spacing;
}

function pickPaletteFrequency(
  echoType: EchoType,
  noteIndex: number,
  seed: string,
): number {
  const palette = TYPE_PALETTES[echoType];
  const slot =
    (noteIndex +
      Math.floor(unit(`${seed}:note:${noteIndex}`) * palette.notes.length)) %
    palette.notes.length;
  return palette.notes[slot] ?? palette.notes[0]!;
}

function pickEncounterFrequency(
  echoType: EchoType,
  noteIndex: number,
  seed: string,
  snapshot: PeerProfileSnapshot | null | undefined,
): number {
  if (snapshot?.melodySemi?.length) {
    return frequencyFromPeerSnapshot(echoType, noteIndex, snapshot.melodySemi);
  }
  return pickPaletteFrequency(echoType, noteIndex, seed);
}

/** Maps real meeting length to overview playback clip length. */
export function encounterPlaybackDurationSec(meetingDurationSec: number): number {
  const d = Math.max(0, meetingDurationSec);
  return clamp(1.8 + Math.sqrt(d) * 0.38 + d / 85, 2, 24);
}

function scheduleNotesForEncounter(
  encounter: PiEncounterInput,
  segmentStart: number,
  segmentEnd: number,
  encounterSeed: string,
  timelineEnd: number,
): PiScheduledNote[] {
  const echoType = resolveEchoType(encounter.otherEchoType);
  const snapshot = encounter.otherEchoProfileSnapshot ?? null;
  const palette = paletteWithPeerTraits(
    TYPE_PALETTES[echoType],
    snapshot,
    echoType,
  );
  const closeness = normalizedCloseness(encounter);
  const density = proximityDensity(encounter);
  const segmentLen = Math.max(0.25, segmentEnd - segmentStart);
  const spacing = effectiveSpacing(
    echoType,
    palette.spacing,
    closeness,
    density,
  );
  const noteBudget = clamp(
    Math.round((segmentLen / Math.max(0.03, spacing)) * density + 1),
    1,
    echoType === "messy" ? 18 : echoType === "bounce" ? 14 : 11,
  );
  const ampScale = palette.amp * (0.5 + closeness * 0.7) * density;
  const richHarmony = closeness > 0.45;
  const notes: PiScheduledNote[] = [];
  let cursor =
    segmentStart +
    Math.min(segmentLen * 0.12, 0.28) * unit(`${encounterSeed}:start`);

  for (let noteIndex = 0; noteIndex < noteBudget; noteIndex += 1) {
    const frequency = pickEncounterFrequency(
      echoType,
      noteIndex,
      encounterSeed,
      snapshot,
    );
    const humanize = (unit(`${encounterSeed}:t:${noteIndex}`) - 0.5) * 0.08;
    const noteTime = clamp(cursor + humanize, 0.02, timelineEnd - 0.05);
    const ratio = harmonyRatio(echoType, richHarmony);
    const harmonyDetune =
      richHarmony ? 1 + (unit(`${encounterSeed}:detune:${noteIndex}`) - 0.5) * 0.008 : 1;

    notes.push({
      time: noteTime,
      frequency,
      frequency2: richHarmony ? frequency * ratio * harmonyDetune : undefined,
      duration: palette.decay + palette.attack + 0.16,
      amp:
        ampScale *
        clamp(0.86 + unit(`${encounterSeed}:amp:${noteIndex}`) * 0.22, 0.72, 1.1),
      attack: palette.attack,
      decay: palette.decay,
      pan: clamp(
        palette.pan + (unit(`${encounterSeed}:pan:${noteIndex}`) - 0.5) * 0.14,
        0.08,
        0.92,
      ),
      sourceType: echoType,
      encounterId: encounter.id,
    });

    cursor += spacing;
    if (cursor > segmentEnd - 0.08) break;
  }

  return notes;
}

/** One peer encounter — unique sonic clip scaled to meeting duration. */
export function buildPiEncounterSoundPlan(
  date: string,
  encounter: PiEncounterInput,
): PiDailySoundPlan {
  const durationSec = encounterPlaybackDurationSec(encounter.durationSec);
  const echoType = resolveEchoType(encounter.otherEchoType);
  const seed = `${date}|${encounter.id}|${echoType}|${encounter.startedAt}`;
  const notes = scheduleNotesForEncounter(
    encounter,
    0.04,
    durationSec - 0.04,
    seed,
    durationSec,
  );
  return { durationSec, notes };
}

export function buildPiDailySoundPlan(
  date: string,
  inputEncounters: PiEncounterInput[],
): PiDailySoundPlan {
  const encounters = sortedEncounters(inputEncounters);
  const durationSec = renderDuration(encounters);
  const seed = dateSeed(date, encounters);
  const notes: PiScheduledNote[] = [];

  encounters.forEach((encounter, index) => {
    const echoType = resolveEchoType(encounter.otherEchoType);
    const segmentStart = (index / Math.max(1, encounters.length)) * durationSec;
    const segmentEnd = ((index + 1) / Math.max(1, encounters.length)) * durationSec;
    const encounterSeed = `${seed}:${encounter.id}:${echoType}`;
    notes.push(
      ...scheduleNotesForEncounter(
        encounter,
        segmentStart,
        segmentEnd,
        encounterSeed,
        durationSec,
      ),
    );
  });

  notes.sort((a, b) => a.time - b.time || a.frequency - b.frequency);
  return { durationSec, notes };
}

/** Short loop for onboarding / type-preview UI (one personality). */
export function buildTypePreviewPlan(echoType: EchoType): PiDailySoundPlan {
  const palette = TYPE_PALETTES[echoType];
  const notes: PiScheduledNote[] = [];
  let cursor = 0.08;
  for (let i = 0; i < 8; i += 1) {
    const frequency = palette.notes[i % palette.notes.length]!;
    notes.push({
      time: cursor,
      frequency,
      frequency2: i % 2 === 0 ? frequency * harmonyRatio(echoType, true) : undefined,
      duration: palette.decay + palette.attack + 0.05,
      amp: palette.amp,
      attack: palette.attack,
      decay: palette.decay,
      pan: palette.pan,
      sourceType: echoType,
    });
    cursor += palette.spacing;
  }
  return {
    durationSec: Math.max(cursor + palette.decay, 3.5),
    notes,
  };
}

export function renderPiDailySoundBuffer(
  audioContext: BaseAudioContext,
  plan: PiDailySoundPlan,
): AudioBuffer {
  const sampleRate = audioContext.sampleRate || SAMPLE_RATE;
  const totalSamples = Math.max(1, Math.ceil(plan.durationSec * sampleRate));
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);

  for (const note of plan.notes) {
    const startSample = Math.floor(note.time * sampleRate);
    const noteSamples = Math.ceil(note.duration * sampleRate);
    const wobbleSeed = unit(
      `${note.encounterId ?? "preview"}:${note.time.toFixed(4)}:${note.frequency.toFixed(2)}`,
    );
    accumulateEchoNoteSamples({
      echoType: note.sourceType,
      left,
      right,
      startSample,
      noteSamples,
      sampleRate,
      frequency: note.frequency,
      frequency2: note.frequency2,
      attack: note.attack,
      decay: note.decay,
      amp: note.amp,
      pan: note.pan,
      wobbleSeed,
      totalSamples,
    });
  }

  let peak = 0;
  for (let i = 0; i < totalSamples; i += 1) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }

  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate);
  const outL = buffer.getChannelData(0);
  const outR = buffer.getChannelData(1);
  const gain = peak > 0 ? 0.92 / peak : 1;
  for (let i = 0; i < totalSamples; i += 1) {
    outL[i] = left[i] * gain;
    outR[i] = right[i] * gain;
  }
  return buffer;
}
