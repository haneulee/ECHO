import type { EchoDevice, EchoType, Encounter } from "@/lib/types";

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
};

const SAMPLE_RATE_REFERENCE = 22050;
const MIN_DURATION_SEC = 8;
const MAX_DURATION_SEC = 180;
const DEFAULT_DURATION_SEC = 45;

const FIRMWARE_VOICES: Record<EchoType, FirmwareVoice> = {
  bounce: {
    env: 0.85,
    envDecay: 0.995,
    baseCutoff: 1500,
    closenessCutoff: 2200,
    delayWet: 0.12,
  },
  shy: {
    env: 0.7,
    envDecay: 0.998,
    baseCutoff: 800,
    closenessCutoff: 1200,
    delayWet: 0.2,
  },
  messy: {
    env: 0.78,
    envDecay: 0.992,
    baseCutoff: 1000,
    closenessCutoff: 2000,
    delayWet: 0.25,
  },
};

const DEFAULT_MELODY_SEMI: Record<EchoType, number[]> = {
  bounce: [0, 4, 7, 9, 7, 4, 2, 0],
  shy: [0, 2, 4, 7, 4, 2, 0, 0],
  messy: [0, 1, 5, 7, 10, 3, 8, 2],
};

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

function melodySemiFromDevice(device: EchoDevice | null): number[] {
  const echoType = device?.echoType ?? "shy";
  const root = firmwareRootMidi(echoType);
  const melody = device?.currentState.melody ?? [];
  const semis = melody
    .map(noteNameToMidi)
    .filter((midi): midi is number => midi !== null)
    .map((midi) => ((Math.round(midi - root) % 12) + 12) % 12);

  return semis.length > 0 ? semis.slice(0, 8) : DEFAULT_MELODY_SEMI[echoType];
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
): EncounterSoundPlan {
  const encounters = sortedEncounters(inputEncounters);
  const echoType = device?.echoType ?? "shy";
  const rootMidi = firmwareRootMidi(echoType);
  const melodySemi = melodySemiFromDevice(device);
  const durationSec = renderDuration(encounters);
  const avgCloseness =
    encounters.length > 0
      ? encounters.reduce((sum, e) => sum + normalizedCloseness(e), 0) /
        encounters.length
      : 0;
  const dominant = dominantType(encounters);
  const seed = dateSeed(date, encounters);
  const notes: EncounterSoundNote[] = [];

  encounters.forEach((encounter, index) => {
    const closeness = normalizedCloseness(encounter);
    const voice = FIRMWARE_VOICES[encounter.otherEchoType];
    const segmentStart = (index / Math.max(1, encounters.length)) * durationSec;
    const segmentEnd = ((index + 1) / Math.max(1, encounters.length)) * durationSec;
    const segmentLen = Math.max(0.25, segmentEnd - segmentStart);
    const firmwareIntervalSec = (300 - closeness * 220) / 1000;
    const triggerCount = clamp(
      Math.round(encounter.durationSec / Math.max(0.08, firmwareIntervalSec) / 24),
      1,
      9,
    );

    for (let repeat = 0; repeat < triggerCount; repeat += 1) {
      const randomIndex = Math.floor(
        unit(`${seed}:${encounter.id}:semi:${repeat}`) * melodySemi.length,
      );
      const semi = melodySemi[randomIndex] ?? melodySemi[0] ?? 0;
      const frequency1 = midiToFreq(rootMidi + semi);
      const messyDetune =
        encounter.otherEchoType === "messy"
          ? 0.98 + Math.floor(unit(`${seed}:${encounter.id}:detune:${repeat}`) * 20) * 0.001
          : 1;
      const frequency2 =
        encounter.otherEchoType === "bounce"
          ? frequency1 * 1.004
          : encounter.otherEchoType === "shy"
            ? frequency1 * 1.001
            : frequency1 * messyDetune;
      const localTime =
        ((repeat + 0.5) / triggerCount) * segmentLen +
        (unit(`${seed}:${encounter.id}:time:${repeat}`) - 0.5) *
          Math.min(0.18, segmentLen * 0.18);

      notes.push({
        time: clamp(segmentStart + localTime, 0.03, durationSec - 0.12),
        frequency1,
        frequency2,
        duration: clamp(0.42 + closeness * 0.72 + encounter.durationSec / 600, 0.45, 1.8),
        closeness,
        cutoff:
          encounter.otherEchoType === "messy"
            ? voice.baseCutoff + unit(`${seed}:${encounter.id}:cutoff:${repeat}`) * voice.closenessCutoff
            : voice.baseCutoff + closeness * voice.closenessCutoff,
        delayWet: voice.delayWet,
        amp: voice.env * (0.42 + closeness * 0.46),
        pan: planNotePan(`${seed}:${encounter.id}:pan:${repeat}`, encounter.otherEchoType),
        sourceType: encounter.otherEchoType,
        semi,
        kind: "encounter",
        encounterId: encounter.id,
      });
    }
  });

  const anchorSemis = DEFAULT_MELODY_SEMI[dominant];
  for (let i = 0; i < 4; i += 1) {
    const semi = anchorSemis[i % anchorSemis.length] ?? 0;
    notes.push({
      time: clamp((durationSec * (i + 1)) / 5, 0.05, durationSec - 0.2),
      frequency1: midiToFreq(rootMidi + semi - 12),
      frequency2: midiToFreq(rootMidi + semi - 12) * 1.002,
      duration: 2.1,
      closeness: avgCloseness,
      cutoff: 900 + avgCloseness * 900,
      delayWet: 0.18,
      amp: 0.24,
      pan: 0.5,
      sourceType: dominant,
      semi,
      kind: "anchor",
    });
  }

  if (avgCloseness > 0.45) {
    const shimmerCount = clamp(Math.round(encounters.length / 4), 3, 8);
    for (let i = 0; i < shimmerCount; i += 1) {
      const semi = melodySemi[(i * 2 + stableHash(`${seed}:shimmer`)) % melodySemi.length] ?? 0;
      const frequency = midiToFreq(rootMidi + semi + 12);
      notes.push({
        time: clamp(
          durationSec * 0.72 + (durationSec * 0.22 * i) / shimmerCount,
          0.05,
          durationSec - 0.08,
        ),
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
    return waveTriangle(phase1) * 0.75 + waveSine(phase2) * 0.4 * 0.25;
  }
  if (sourceType === "shy") {
    return waveSine(phase1) * 0.8 + waveTriangle(phase2) * 0.2 * 0.2;
  }
  return waveSaw(phase1) * 0.5 + waveTriangle(phase2) * 0.35;
}

function envelope(note: EncounterSoundNote, t: number): number {
  if (t < 0 || t > note.duration) return 0;
  const attack = Math.min(0.025, note.duration * 0.12);
  const firmwareDecay = FIRMWARE_VOICES[note.sourceType].envDecay;
  const decay = firmwareDecay ** (t * SAMPLE_RATE_REFERENCE);
  const releaseStart = note.duration * 0.78;
  const release =
    t > releaseStart
      ? clamp(1 - (t - releaseStart) / Math.max(0.001, note.duration - releaseStart), 0, 1)
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

  for (let i = 0; i < totalSamples; i += 1) {
    const t = i / sampleRate;
    const fade = clamp(t / 1.5, 0, 1) * clamp((plan.durationSec - t) / 2, 0, 1);
    mono[i] +=
      Math.sin(Math.PI * 2 * plan.droneFrequency * t) *
      (0.035 + plan.avgCloseness * 0.025) *
      fade;
  }

  for (const note of plan.notes) {
    const startSample = Math.floor(note.time * sampleRate);
    const noteSamples = Math.ceil(note.duration * sampleRate);
    let lowpassState = 0;
    let phase1 = 0;
    let phase2 = 0;
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
    }
  }

  for (let i = 0; i < totalSamples; i += 1) {
    const delayed = delay[delayIndex] ?? 0;
    const out = mono[i] + delayed * 0.2;
    delay[delayIndex] = mono[i] + delayed * 0.22;
    delayIndex = (delayIndex + 1) % delaySamples;
    mono[i] = Math.tanh(out * 2.3);
  }

  for (const note of plan.notes) {
    const startSample = Math.floor(note.time * sampleRate);
    const endSample = Math.min(totalSamples, startSample + Math.ceil(note.duration * sampleRate));
    const leftGain = Math.cos((note.pan * Math.PI) / 2);
    const rightGain = Math.sin((note.pan * Math.PI) / 2);
    for (let i = startSample; i < endSample; i += 1) {
      const centered = mono[i] * 0.62;
      left[i] += centered * leftGain;
      right[i] += centered * rightGain;
    }
  }

  for (let i = 0; i < totalSamples; i += 1) {
    left[i] += mono[i] * 0.38;
    right[i] += mono[i] * 0.38;
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
