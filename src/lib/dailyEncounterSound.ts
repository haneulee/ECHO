import type { DailyMemory, EchoDevice, EchoType, Encounter } from "@/lib/types";

export type EncounterSoundInput = Pick<
  Encounter,
  | "id"
  | "otherEchoType"
  | "durationSec"
  | "closenessAvg"
  | "rssiAvg"
  | "startedAt"
  | "endedAt"
>;

export type EncounterSoundNote = {
  time: number;
  frequency1: number;
  frequency2: number;
  duration: number;
  closeness: number;
  cutoff: number;
  delayWet: number;
  amp: number;
  pan: number;
  sourceType: EchoType;
  semi: number;
  kind: "encounter" | "anchor" | "shimmer";
  encounterId?: string;
};

export type EncounterSoundPlan = {
  date: string;
  durationSec: number;
  rootMidi: number;
  melodySemi: number[];
  avgCloseness: number;
  dominantType: EchoType;
  droneFrequency: number;
  notes: EncounterSoundNote[];
};

type FirmwareVoice = {
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

const SAMPLE_RATE_REFERENCE = 22050;
const MIN_DURATION_SEC = 8;
const MAX_DURATION_SEC = 180;
const DEFAULT_DURATION_SEC = 45;

const FIRMWARE_VOICES: Record<EchoType, FirmwareVoice> = {
  bounce: {
    env: 0.58,
    envDecay: 0.9962,
    baseCutoff: 1350,
    closenessCutoff: 1650,
    delayWet: 0.18,
    rate: 0.34,
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
    rate: 0.86,
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
    rate: 0.28,
    repeats: 3,
    steps: [0, 3, 1, 5, 2, 6, 4, 7, 1, 4],
    rhythm: [0.62, 0.38, 0.94, 0.44, 0.7, 0.36, 1.08, 0.48, 0.82, 0.4],
    scale: [0, 2, 3, 5, 7, 9, 10, 12, 14],
    progression: [0, 5, 10, 7, 3],
  },
};

const DEFAULT_MELODY_SEMI: Record<EchoType, number[]> = {
  bounce: [0, 4, 7, 9, 7, 4, 2, 0],
  shy: [0, 2, 4, 7, 4, 2, 0, 0],
  messy: [0, 1, 5, 7, 10, 3, 8, 2],
};

const HARMONIC_PROGRESSION = [
  { root: 0, tones: [0, 4, 7, 9] },
  { root: 5, tones: [0, 4, 7, 11] },
  { root: 9, tones: [0, 3, 7, 10] },
  { root: 7, tones: [0, 4, 7, 9] },
] as const;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

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

function midiToFreq(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function firmwareRootMidi(echoType: EchoType): number {
  if (echoType === "bounce") return 72;
  if (echoType === "messy") return 55;
  return 60;
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

function melodySemiFromNotes(echoType: EchoType, melody: string[]): number[] {
  const root = firmwareRootMidi(echoType);
  const semis = melody
    .map(noteNameToMidi)
    .filter((midi): midi is number => midi !== null)
    .map((midi) => ((Math.round(midi - root) % 12) + 12) % 12);

  return semis.length > 0 ? semis.slice(0, 8) : DEFAULT_MELODY_SEMI[echoType];
}

function melodySemiFromSources(
  echoType: EchoType,
  device: EchoDevice | null,
  memory: DailyMemory | null,
): number[] {
  if (device) {
    return melodySemiFromNotes(echoType, device.currentState.melody);
  }

  const memoryMelody =
    memory?.composition.voices.flatMap((voice) => voice.melody) ?? [];
  return melodySemiFromNotes(echoType, memoryMelody);
}

function rssiToCloseness(rssi: number): number {
  const c = clamp((rssi - -92) / (-55 - -92), 0, 1);
  return c ** 0.75;
}

function normalizedCloseness(encounter: EncounterSoundInput): number {
  if (Number.isFinite(encounter.closenessAvg)) {
    return clamp(encounter.closenessAvg, 0, 1);
  }
  return rssiToCloseness(encounter.rssiAvg);
}

function nearestScaleSemi(semi: number, scale: number[]): number {
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

function phraseSemi(
  seed: string,
  sourceType: EchoType,
  triggerIndex: number,
  sourceSemis: number[],
): number {
  const voice = FIRMWARE_VOICES[sourceType];
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
    phraseStep > 4 && sourceType !== "shy"
      ? 12
      : phraseStep === 7 && sourceType === "shy"
        ? -12
        : 0;

  return nearestScaleSemi(progressionRoot + blended + octave, voice.scale);
}

function nearestChordSemi(semi: number, chordIndex: number): number {
  const chord = HARMONIC_PROGRESSION[chordIndex % HARMONIC_PROGRESSION.length]!;
  const candidates: number[] = [];
  for (let octave = -1; octave <= 2; octave += 1) {
    for (const tone of chord.tones) {
      candidates.push(chord.root + tone + octave * 12);
    }
  }
  return (
    candidates.sort((a, b) => Math.abs(a - semi) - Math.abs(b - semi))[0] ??
    semi
  );
}

function harmonizedEncounterSemi(
  rawSemi: number,
  sourceType: EchoType,
  chordIndex: number,
  repeat: number,
): number {
  const chordSemi = nearestChordSemi(rawSemi, chordIndex);
  const typeLift =
    sourceType === "bounce" && repeat % 3 === 1
      ? 12
      : sourceType === "messy" && repeat % 4 === 2
        ? 7
        : 0;
  const minSemi = sourceType === "shy" ? 0 : -5;
  return clamp(chordSemi + typeLift, minSemi, 24);
}

function harmonySemiFor(
  primarySemi: number,
  sourceType: EchoType,
  chordIndex: number,
): number {
  const interval = sourceType === "shy" ? 7 : sourceType === "bounce" ? 12 : 4;
  return clamp(nearestChordSemi(primarySemi + interval, chordIndex), 0, 28);
}

function sortedEncounters(
  encounters: EncounterSoundInput[],
): EncounterSoundInput[] {
  return [...encounters].sort((a, b) => {
    const byTime = (a.startedAt || a.id).localeCompare(b.startedAt || b.id);
    return byTime === 0 ? a.id.localeCompare(b.id) : byTime;
  });
}

function dominantType(encounters: EncounterSoundInput[]): EchoType {
  const counts: Record<EchoType, number> = { shy: 0, messy: 0, bounce: 0 };
  for (const encounter of encounters) counts[encounter.otherEchoType] += 1;
  return (Object.entries(counts) as Array<[EchoType, number]>).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0][0];
}

function renderDuration(encounters: EncounterSoundInput[]): number {
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

function dateSeed(date: string, encounters: EncounterSoundInput[]): string {
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
      ].join(":"),
    ),
  ].join("|");
}

function planNotePan(seed: string, sourceType: EchoType): number {
  const base = sourceType === "bounce" ? 0.57 : sourceType === "shy" ? 0.43 : 0.5;
  return clamp(base + (unit(seed) - 0.5) * 0.18, 0.12, 0.88);
}

export function buildEncounterSoundPlan(
  date: string,
  inputEncounters: EncounterSoundInput[],
  device: EchoDevice | null = null,
  memory: DailyMemory | null = null,
): EncounterSoundPlan {
  const encounters = sortedEncounters(inputEncounters);
  const dominant = dominantType(encounters);
  const echoType = device?.echoType ?? memory?.dominantEchoType ?? dominant;
  const rootMidi = firmwareRootMidi(echoType);
  const melodySemi = melodySemiFromSources(echoType, device, memory);
  const durationSec = renderDuration(encounters);
  const avgCloseness =
    encounters.length > 0
      ? encounters.reduce((sum, e) => sum + normalizedCloseness(e), 0) /
        encounters.length
      : 0;
  const seed = dateSeed(date, encounters);
  const notes: EncounterSoundNote[] = [];

  encounters.forEach((encounter, index) => {
    const closeness = normalizedCloseness(encounter);
    const voice = FIRMWARE_VOICES[encounter.otherEchoType];
    const segmentStart = (index / Math.max(1, encounters.length)) * durationSec;
    const segmentEnd = ((index + 1) / Math.max(1, encounters.length)) * durationSec;
    const segmentLen = Math.max(0.25, segmentEnd - segmentStart);
    const encounterSeed = `${seed}:${encounter.id}:${encounter.otherEchoType}`;
    const baseRate = clamp(
      voice.rate *
        (1.16 - closeness * 0.34) *
        (encounter.otherEchoType === "shy" ? 1.12 : 1),
      encounter.otherEchoType === "messy" ? 0.18 : 0.24,
      encounter.otherEchoType === "shy" ? 1.22 : 0.78,
    );
    const triggerBudget = clamp(
      Math.round(
        segmentLen / Math.max(0.12, baseRate) +
          Math.log1p(encounter.durationSec) * 0.26,
      ),
      1,
      encounter.otherEchoType === "messy" ? 14 : 10,
    );
    let localCursor =
      Math.min(segmentLen * 0.18, 0.32) *
      unit(`${encounterSeed}:first-note`);

    for (let repeat = 0; repeat < triggerBudget; repeat += 1) {
      const chordIndex = Math.floor(
        ((segmentStart + localCursor) / durationSec) *
          HARMONIC_PROGRESSION.length,
      );
      const rawSemi = phraseSemi(
        encounterSeed,
        encounter.otherEchoType,
        repeat + index * 8,
        melodySemi,
      );
      const semi = harmonizedEncounterSemi(
        rawSemi,
        encounter.otherEchoType,
        chordIndex,
        repeat,
      );
      const frequency1 = midiToFreq(rootMidi + semi);
      const messyDetune =
        encounter.otherEchoType === "messy"
          ? 0.98 +
            Math.floor(unit(`${encounterSeed}:detune:${repeat}`) * 20) * 0.001
          : 1;
      const frequency2 =
        encounter.otherEchoType === "bounce"
          ? frequency1 * 1.004
          : encounter.otherEchoType === "shy"
            ? frequency1 * 1.001
            : frequency1 * messyDetune;
      const rhythm = voice.rhythm[repeat % voice.rhythm.length] ?? 1;
      const humanize =
        (unit(`${encounterSeed}:time:${repeat}`) - 0.5) *
        (encounter.otherEchoType === "messy" ? 0.1 : 0.045);
      const noteDuration =
        encounter.otherEchoType === "shy"
          ? 1.55 + rhythm * 0.64 + closeness * 0.52
          : encounter.otherEchoType === "bounce"
            ? 0.62 + rhythm * 0.34 + closeness * 0.24
            : 0.82 + rhythm * 0.28 + closeness * 0.3;
      const localTime = localCursor + humanize;

      const noteTime = clamp(segmentStart + localTime, 0.03, durationSec - 0.12);

      notes.push({
        time: noteTime,
        frequency1,
        frequency2,
        duration: clamp(noteDuration, 0.42, 2.7),
        closeness,
        cutoff:
          encounter.otherEchoType === "messy"
            ? voice.baseCutoff +
              unit(`${encounterSeed}:cutoff:${repeat}`) * voice.closenessCutoff
            : voice.baseCutoff + closeness * voice.closenessCutoff,
        delayWet: voice.delayWet,
        amp: voice.env * (0.36 + closeness * 0.36),
        pan: planNotePan(`${encounterSeed}:pan:${repeat}`, encounter.otherEchoType),
        sourceType: encounter.otherEchoType,
        semi,
        kind: "encounter",
        encounterId: encounter.id,
      });

      if (repeat % 2 === 0 && closeness > 0.34) {
        const harmonySemi = harmonySemiFor(
          semi,
          encounter.otherEchoType,
          chordIndex,
        );
        const harmonyFrequency = midiToFreq(rootMidi + harmonySemi);
        notes.push({
          time: clamp(noteTime + 0.035, 0.03, durationSec - 0.08),
          frequency1: harmonyFrequency,
          frequency2: harmonyFrequency * 1.002,
          duration: clamp(noteDuration * 0.72, 0.38, 1.7),
          closeness,
          cutoff: voice.baseCutoff + closeness * voice.closenessCutoff * 0.72,
          delayWet: voice.delayWet,
          amp: voice.env * (0.12 + closeness * 0.12),
          pan: clamp(
            1 - planNotePan(`${encounterSeed}:pan:${repeat}`, encounter.otherEchoType),
            0.16,
            0.84,
          ),
          sourceType: encounter.otherEchoType,
          semi: harmonySemi,
          kind: "shimmer",
          encounterId: encounter.id,
        });
      }

      localCursor += Math.max(0.12, baseRate * rhythm + humanize);
      if (localCursor > segmentLen - 0.16) break;
    }
  });

  if (avgCloseness > 0.45) {
    const shimmerCount = clamp(Math.round(encounters.length / 4), 3, 8);
    for (let i = 0; i < shimmerCount; i += 1) {
      const t = durationSec * 0.72 + (durationSec * 0.22 * i) / shimmerCount;
      const chordIndex = Math.floor(
        (t / durationSec) * HARMONIC_PROGRESSION.length,
      );
      const rawSemi =
        melodySemi[(i * 2 + stableHash(`${seed}:shimmer`)) % melodySemi.length] ??
        0;
      const semi = clamp(nearestChordSemi(rawSemi + 12, chordIndex), 7, 28);
      const frequency = midiToFreq(rootMidi + semi);
      notes.push({
        time: clamp(t, 0.05, durationSec - 0.08),
        frequency1: frequency,
        frequency2: frequency * 1.004,
        duration: 0.58 + avgCloseness * 0.32,
        closeness: avgCloseness,
        cutoff: 1800 + avgCloseness * 1800,
        delayWet: 0.22,
        amp: 0.28 * avgCloseness,
        pan: clamp(0.2 + (0.6 * i) / Math.max(1, shimmerCount - 1), 0.1, 0.9),
        sourceType: dominant,
        semi,
        kind: "shimmer",
      });
    }
  }

  notes.sort((a, b) => a.time - b.time || a.frequency1 - b.frequency1);

  return {
    date,
    durationSec,
    rootMidi,
    melodySemi,
    avgCloseness,
    dominantType: dominant,
    droneFrequency: midiToFreq(rootMidi - 24 + (stableHash(seed) % 5)),
    notes,
  };
}

function waveSine(phase: number): number {
  return Math.sin(phase * Math.PI * 2);
}

function waveTriangle(phase: number): number {
  return phase < 0.5 ? -1 + phase * 4 : 3 - phase * 4;
}

function waveSaw(phase: number): number {
  return phase * 2 - 1;
}

function noteWave(sourceType: EchoType, phase1: number, phase2: number): number {
  if (sourceType === "bounce") {
    return waveTriangle(phase1) * 0.62 + waveSine(phase2) * 0.38;
  }
  if (sourceType === "shy") {
    return waveSine(phase1) * 0.88 + waveTriangle(phase2) * 0.12;
  }
  const s1 = waveSaw(phase1);
  const s2 = waveTriangle(phase2);
  const s3 = waveSine((phase1 + phase2) * 0.5);
  return s1 * 0.26 + s2 * 0.36 + s3 * 0.28;
}

function envelope(note: EncounterSoundNote, t: number): number {
  if (t < 0 || t > note.duration) return 0;
  const attack =
    note.sourceType === "bounce"
      ? 0.026
      : note.sourceType === "messy"
        ? 0.045
        : 0.16;
  const firmwareDecay = FIRMWARE_VOICES[note.sourceType].envDecay;
  const decay = firmwareDecay ** (t * SAMPLE_RATE_REFERENCE);
  const releaseStart =
    note.sourceType === "shy" ? note.duration * 0.58 : note.duration * 0.68;
  const release =
    t > releaseStart
      ? clamp(
          1 -
            (t - releaseStart) /
              Math.max(0.001, note.duration - releaseStart),
          0,
          1,
        )
      : 1;
  return (t < attack ? t / attack : decay) * release;
}

export function renderEncounterSoundBuffer(
  audioContext: BaseAudioContext,
  plan: EncounterSoundPlan,
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const totalSamples = Math.max(1, Math.ceil(plan.durationSec * sampleRate));
  const mono = new Float32Array(totalSamples);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);
  const delaySamples = Math.max(1, Math.round(4096 * (sampleRate / SAMPLE_RATE_REFERENCE)));
  const delay = new Float32Array(delaySamples);
  let delayIndex = 0;

  for (const note of plan.notes) {
    const startSample = Math.floor(note.time * sampleRate);
    const noteSamples = Math.ceil(note.duration * sampleRate);
    let lowpassState = 0;
    let phase1 = 0;
    let phase2 = 0;
    const leftGain = Math.cos((note.pan * Math.PI) / 2);
    const rightGain = Math.sin((note.pan * Math.PI) / 2);
    const alpha = clamp(
      1 - Math.exp((-2 * Math.PI * note.cutoff) / sampleRate),
      0.001,
      0.95,
    );

    for (let i = 0; i < noteSamples; i += 1) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= totalSamples) break;
      const t = i / sampleRate;
      const dry = noteWave(note.sourceType, phase1, phase2) * note.amp * envelope(note, t);
      phase1 = (phase1 + note.frequency1 / sampleRate) % 1;
      phase2 = (phase2 + note.frequency2 / sampleRate) % 1;
      lowpassState += alpha * (dry - lowpassState);
      mono[sampleIndex] += lowpassState;
      left[sampleIndex] += lowpassState * leftGain;
      right[sampleIndex] += lowpassState * rightGain;
    }
  }

  const averageDelayWet =
    plan.notes.length > 0
      ? plan.notes.reduce((sum, note) => sum + note.delayWet, 0) /
        plan.notes.length
      : 0.18;
  for (let i = 0; i < totalSamples; i += 1) {
    const delayed = delay[delayIndex] ?? 0;
    const out = mono[i] + delayed * averageDelayWet;
    delay[delayIndex] = mono[i] + delayed * 0.3;
    delayIndex = (delayIndex + 1) % delaySamples;
    mono[i] = Math.tanh(out * 1.45) * 0.58;
  }

  for (let i = 0; i < totalSamples; i += 1) {
    left[i] += mono[i] * 0.36;
    right[i] += mono[i] * 0.36;
  }

  let peak = 0;
  for (let i = 0; i < totalSamples; i += 1) {
    peak = Math.max(peak, Math.abs(left[i]), Math.abs(right[i]));
  }

  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate);
  const bufferLeft = buffer.getChannelData(0);
  const bufferRight = buffer.getChannelData(1);
  const gain = peak > 0 ? 0.9 / peak : 1;
  for (let i = 0; i < totalSamples; i += 1) {
    bufferLeft[i] = left[i] * gain;
    bufferRight[i] = right[i] * gain;
  }

  return buffer;
}
