import {
  TYPE_PALETTES,
  accumulateEchoNoteSamples,
  clamp,
  harmonyRatio,
  liveRootMidi,
} from "@/lib/echoTypeWaveforms";
import { midiToFreq, nearestScaleSemi } from "@/lib/firmwareEchoModel";
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
  wobbleSeed: number;
  expressiveness: number;
};

export type PiDailySoundPlan = {
  durationSec: number;
  notes: PiScheduledNote[];
  renderProfile?: "default" | "cohesive";
};

export type SessionHarmony = {
  rootMidi: number;
  scale: number[];
  sequenceIndex: number;
};

export type EncounterScheduleOptions = {
  /** Tighter gaps for overview play-all handoffs between encounters. */
  compactRhythm?: boolean;
  /** Shared key across play-all sequence — melody intervals preserved. */
  sessionHarmony?: SessionHarmony | null;
  /** Softer, warmer overview voice with more harmony and glue. */
  cohesiveVoice?: boolean;
};

const SESSION_SCALE = [0, 2, 4, 7, 9, 12] as const;

export function deriveSessionHarmony(
  date: string,
  encounters: PiEncounterInput[],
  sequenceIndex: number,
): SessionHarmony {
  const counts: Record<EchoType, number> = { shy: 0, messy: 0, bounce: 0 };
  for (const encounter of encounters) {
    counts[resolveEchoType(encounter.otherEchoType)] += 1;
  }
  const dominant = (Object.entries(counts) as Array<[EchoType, number]>).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0][0];
  const rootBias =
    dominant === "shy" ? 55 : dominant === "bounce" ? 60 : 62;
  const rootMidi = rootBias + Math.floor(unit(`${date}:session:root`) * 4);
  return {
    rootMidi,
    scale: [...SESSION_SCALE],
    sequenceIndex,
  };
}

function hzToMidi(hz: number): number {
  return 69 + 12 * Math.log2(hz / 440);
}

function transposeForSessionHarmony(
  frequency: number,
  echoType: EchoType,
  noteIndex: number,
  melodySemi: number[] | undefined,
  session: SessionHarmony,
): number {
  const typeRoot = liveRootMidi(echoType);
  const progression =
    session.scale[session.sequenceIndex % session.scale.length] ?? 0;
  const encounterRoot = session.rootMidi + progression;
  const offset = encounterRoot - typeRoot;

  if (melodySemi?.length) {
    const semi = melodySemi[noteIndex % 8] ?? 0;
    const targetMidi = nearestScaleSemi(typeRoot + semi + offset, session.scale);
    const targetHz = midiToFreq(targetMidi);
    return frequency * 0.34 + targetHz * 0.66;
  }

  const semiFromRoot = Math.round(hzToMidi(frequency) - typeRoot);
  const targetMidi = nearestScaleSemi(
    session.rootMidi + progression + semiFromRoot,
    session.scale,
  );
  const targetHz = midiToFreq(targetMidi);
  return frequency * 0.4 + targetHz * 0.6;
}

function softenLivingSpacing(raw: number, cohesiveVoice: boolean): number {
  if (!cohesiveVoice) return raw;
  const softened = 1 + (raw - 1) * 0.62;
  return clamp(softened, 0.72, 1.48);
}

function rhythmSpacingMultiplier(raw: number, compactRhythm: boolean): number {
  if (!compactRhythm) return raw;
  const softened = 1 + (raw - 1) * 0.45;
  return clamp(softened, 0.62, 1.38);
}

function audibleClipDurationSec(
  notes: PiScheduledNote[],
  maxSec: number,
  minSec = 0.95,
  tailPadSec = 0.2,
): number {
  if (notes.length === 0) return clamp(minSec, minSec, maxSec);
  let end = 0;
  for (const note of notes) {
    end = Math.max(end, note.time + note.duration);
  }
  return clamp(end + tailPadSec, minSec, maxSec);
}

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

/** Slight pause after larger melodic leaps — same pitches, more breathing room. */
function melodyLeapSpacingBias(
  noteIndex: number,
  melodySemi: number[] | undefined,
): number {
  if (!melodySemi?.length || noteIndex === 0) return 1;
  const prev = melodySemi[(noteIndex - 1) % 8] ?? 0;
  const curr = melodySemi[noteIndex % 8] ?? 0;
  const leap = Math.abs(curr - prev);
  return 1 + Math.min(leap, 8) * 0.045;
}

function livingSpacingMultiplier(
  echoType: EchoType,
  noteIndex: number,
  noteBudget: number,
  seed: string,
  snapshot: PeerProfileSnapshot | null,
  melodySemi: number[] | undefined,
): number {
  const calmness = snapshot?.calmness ?? 0.5;
  const density = snapshot?.densityBias ?? 0.5;
  const phraseProgress =
    noteBudget <= 1 ? 0 : noteIndex / Math.max(1, noteBudget - 1);
  const arc = 0.78 + Math.sin(phraseProgress * Math.PI) * 0.34;
  const jitter = 0.68 + unit(`${seed}:space:${noteIndex}`) * 0.62;
  const leap = melodyLeapSpacingBias(noteIndex, melodySemi);

  if (echoType === "bounce") {
    const swing = noteIndex % 2 === 0 ? 0.82 : 1.22;
    const burst =
      unit(`${seed}:burst:${noteIndex}`) > 0.8 ? 0.52 + density * 0.12 : 1;
    return arc * swing * jitter * burst * leap;
  }

  if (echoType === "shy") {
    const linger = noteIndex % 3 === 2 ? 1.28 + calmness * 0.22 : 1;
    const pause =
      unit(`${seed}:pause:${noteIndex}`) > 0.78
        ? 1.38 + calmness * 0.55
        : 0.92 + unit(`${seed}:shy:${noteIndex}`) * 0.18;
    return arc * jitter * linger * pause * leap;
  }

  const cluster =
    noteIndex % 4 === 3
      ? 1.32 + density * 0.18
      : 0.7 + unit(`${seed}:messy:${noteIndex}`) * 0.38;
  const stutter = unit(`${seed}:stutter:${noteIndex}`) > 0.86 ? 0.58 : 1;
  return arc * jitter * cluster * stutter * leap;
}

function livingNoteExpression(
  echoType: EchoType,
  noteIndex: number,
  seed: string,
  snapshot: PeerProfileSnapshot | null,
  palette: (typeof TYPE_PALETTES)[EchoType],
): {
  attack: number;
  decay: number;
  duration: number;
  ampMul: number;
  pitchBias: number;
  expressiveness: number;
} {
  const brightness = snapshot?.brightness ?? 0.55;
  const calmness = snapshot?.calmness ?? 0.5;
  const durJitter = 0.76 + unit(`${seed}:dur:${noteIndex}`) * 0.52;
  const attackJitter = 0.78 + unit(`${seed}:atk:${noteIndex}`) * 0.44;
  const decayJitter = 0.72 + unit(`${seed}:dec:${noteIndex}`) * 0.56;
  const pitchBias =
    1 + (unit(`${seed}:pitch:${noteIndex}`) - 0.5) * (echoType === "messy" ? 0.018 : 0.014);
  const expressiveness = clamp(
    0.42 +
      unit(`${seed}:life:${noteIndex}`) * 0.48 +
      (echoType === "shy" ? calmness * 0.12 : brightness * 0.1),
    0.38,
    0.96,
  );

  const attack = palette.attack * attackJitter;
  const decay = palette.decay * decayJitter;
  return {
    attack,
    decay,
    duration: (decay + attack + 0.12 + unit(`${seed}:tail:${noteIndex}`) * 0.14) * durJitter,
    ampMul: clamp(
      0.8 +
        unit(`${seed}:amp:${noteIndex}`) * 0.28 +
        (noteIndex % 4 === 0 ? 0.08 : 0),
      0.68,
      1.14,
    ),
    pitchBias,
    expressiveness,
  };
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
  options: EncounterScheduleOptions = {},
): PiScheduledNote[] {
  const compactRhythm = options.compactRhythm ?? false;
  const cohesiveVoice = options.cohesiveVoice ?? false;
  const sessionHarmony = options.sessionHarmony ?? null;
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
    compactRhythm
      ? echoType === "messy"
        ? 20
        : echoType === "bounce"
          ? 16
          : 13
      : echoType === "messy"
        ? 18
        : echoType === "bounce"
          ? 14
          : 11,
  );
  const ampScale = palette.amp * (0.5 + closeness * 0.7) * density;
  const richHarmony =
    closeness > (cohesiveVoice ? 0.3 : 0.45) || Boolean(sessionHarmony);
  const melodySemi = snapshot?.melodySemi;
  const notes: PiScheduledNote[] = [];
  let cursor =
    segmentStart +
    (compactRhythm
      ? Math.min(segmentLen * 0.05, 0.1) * unit(`${encounterSeed}:start`)
      : Math.min(segmentLen * 0.12, 0.28) * unit(`${encounterSeed}:start`));

  for (let noteIndex = 0; noteIndex < noteBudget; noteIndex += 1) {
    let frequency = pickEncounterFrequency(
      echoType,
      noteIndex,
      encounterSeed,
      snapshot,
    );
    if (sessionHarmony) {
      frequency = transposeForSessionHarmony(
        frequency,
        echoType,
        noteIndex,
        melodySemi,
        sessionHarmony,
      );
    }
    const expression = livingNoteExpression(
      echoType,
      noteIndex,
      encounterSeed,
      snapshot,
      palette,
    );
    const spacingMul = rhythmSpacingMultiplier(
      softenLivingSpacing(
        livingSpacingMultiplier(
          echoType,
          noteIndex,
          noteBudget,
          encounterSeed,
          snapshot,
          melodySemi,
        ),
        cohesiveVoice,
      ),
      compactRhythm,
    );
    const humanize =
      (unit(`${encounterSeed}:t:${noteIndex}`) - 0.5) *
      spacing *
      (echoType === "messy" ? 0.22 : 0.16);
    const noteTime = clamp(cursor + humanize, 0.02, timelineEnd - 0.05);
    const ratio = harmonyRatio(echoType, richHarmony);
    const harmonyDetune =
      richHarmony ? 1 + (unit(`${encounterSeed}:detune:${noteIndex}`) - 0.5) * 0.008 : 1;
    const wobbleSeed = unit(`${encounterSeed}:wobble:${noteIndex}`);

    const voicedFreq = frequency * expression.pitchBias;
    const legatoMul = cohesiveVoice ? 1.16 : 1;
    const panBase = cohesiveVoice ? 0.48 : palette.pan;

    notes.push({
      time: noteTime,
      frequency: voicedFreq,
      frequency2: richHarmony
        ? voicedFreq * ratio * harmonyDetune
        : undefined,
      duration: expression.duration * legatoMul,
      amp: ampScale * expression.ampMul * (cohesiveVoice ? 0.94 : 1),
      attack: expression.attack * (cohesiveVoice ? 1.1 : 1),
      decay: expression.decay * (cohesiveVoice ? 1.12 : 1),
      pan: clamp(
        panBase + (unit(`${encounterSeed}:pan:${noteIndex}`) - 0.5) * (cohesiveVoice ? 0.1 : 0.14),
        0.12,
        0.88,
      ),
      sourceType: echoType,
      encounterId: encounter.id,
      wobbleSeed,
      expressiveness: clamp(
        expression.expressiveness + (cohesiveVoice ? 0.14 : 0),
        0.42,
        0.98,
      ),
    });

    cursor += spacing * spacingMul;
    if (cursor > segmentEnd - 0.08) break;
  }

  return notes;
}

/** One peer encounter — unique sonic clip scaled to meeting duration. */
export function buildPiEncounterSoundPlan(
  date: string,
  encounter: PiEncounterInput,
  options: EncounterScheduleOptions = {},
): PiDailySoundPlan {
  const maxDurationSec = encounterPlaybackDurationSec(encounter.durationSec);
  const echoType = resolveEchoType(encounter.otherEchoType);
  const seed = `${date}|${encounter.id}|${echoType}|${encounter.startedAt}`;
  const notes = scheduleNotesForEncounter(
    encounter,
    0.04,
    maxDurationSec - 0.04,
    seed,
    maxDurationSec,
    options,
  );
  const durationSec = audibleClipDurationSec(
    notes,
    maxDurationSec,
    0.95,
    options.compactRhythm ? 0.1 : 0.2,
  );
  return {
    durationSec,
    notes,
    renderProfile: options.cohesiveVoice ? "cohesive" : "default",
  };
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
      wobbleSeed: unit(`preview:${echoType}:${i}`),
      expressiveness: 0.55,
    });
    cursor += palette.spacing;
  }
  return {
    durationSec: Math.max(cursor + palette.decay, 3.5),
    notes,
  };
}

function applyCohesiveRenderGlue(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number,
): void {
  const totalSamples = left.length;
  const delayA = Math.floor(0.11 * sampleRate);
  const delayB = Math.floor(0.19 * sampleRate);
  const wet = 0.1;

  for (let i = 0; i < totalSamples; i += 1) {
    const tailA = i >= delayA ? left[i - delayA]! * wet : 0;
    const tailB = i >= delayB ? right[i - delayB]! * wet * 0.85 : 0;
    left[i] = left[i]! * 0.9 + tailA;
    right[i] = right[i]! * 0.9 + tailB;
  }

  let prevL = 0;
  let prevR = 0;
  for (let i = 0; i < totalSamples; i += 1) {
    const smoothL = prevL * 0.22 + left[i]! * 0.78;
    const smoothR = prevR * 0.22 + right[i]! * 0.78;
    left[i] = left[i]! * 0.82 + smoothL * 0.18;
    right[i] = right[i]! * 0.82 + smoothR * 0.18;
    prevL = smoothL;
    prevR = smoothR;
  }
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
      wobbleSeed: note.wobbleSeed,
      expressiveness: note.expressiveness,
      totalSamples,
    });
  }

  let peak = 0;
  for (let i = 0; i < totalSamples; i += 1) {
    peak = Math.max(peak, Math.abs(left[i]!), Math.abs(right[i]!));
  }

  if (plan.renderProfile === "cohesive") {
    applyCohesiveRenderGlue(left, right, sampleRate);
    peak = 0;
    for (let i = 0; i < totalSamples; i += 1) {
      peak = Math.max(peak, Math.abs(left[i]!), Math.abs(right[i]!));
    }
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
