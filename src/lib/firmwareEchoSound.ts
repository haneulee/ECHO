import type { EchoDevice, EchoType } from "@/lib/types";
import type { EchoNoteEvent } from "@/lib/echoAudioAnalyser";

const SAMPLE_RATE_REFERENCE = 22050;
const LOOP_SECONDS = 14;

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

const FIRMWARE_VOICES: Record<EchoType, FirmwareVoice> = {
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
  if (echoType === "bounce") return 67;
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

function melodySemiFromDevice(device: EchoDevice): number[] {
  const root = firmwareRootMidi(device.echoType);
  const semis = device.currentState.melody
    .map(noteNameToMidi)
    .filter((midi): midi is number => midi !== null)
    .map((midi) => ((Math.round(midi - root) % 12) + 12) % 12);
  return semis.length > 0 ? semis.slice(0, 8) : DEFAULT_MELODY_SEMI[device.echoType];
}

function nearestScaleSemi(semi: number, scale: number[]): number {
  const octave = Math.floor(semi / 12) * 12;
  const normalized = ((semi % 12) + 12) % 12;
  return scale
    .map((scaleSemi) => octave + scaleSemi)
    .sort(
      (a, b) =>
        Math.abs(a - (octave + normalized)) -
        Math.abs(b - (octave + normalized)),
    )[0] ?? semi;
}

function phraseSemi(
  device: EchoDevice,
  triggerIndex: number,
  sourceSemis: number[],
): number {
  const voice = FIRMWARE_VOICES[device.echoType];
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
    unit(`${device.id}:phrase:${phraseIndex}:step:${phraseStep}`) *
      voice.scale.length,
  );
  const contour =
    phraseStep === 0
      ? 0
      : phraseStep === 3 || phraseStep === 6
        ? 1
        : unit(`${device.id}:contour:${phraseIndex}:${phraseStep}`) > 0.68
          ? -1
          : 0;
  const scaleSemi =
    voice.scale[(randomDegree + phraseStep + contour) % voice.scale.length] ?? 0;
  const blended =
    unit(`${device.id}:motif-blend:${phraseIndex}:${phraseStep}`) > 0.42
      ? scaleSemi
      : nearestScaleSemi(motifSemi, voice.scale);
  const octave =
    phraseStep > 4 && device.echoType !== "shy"
      ? 12
      : phraseStep === 7 && device.echoType === "shy"
        ? -12
        : 0;

  return nearestScaleSemi(progressionRoot + blended + octave, voice.scale);
}

function closenessFromState(device: EchoDevice): number {
  const state = device.currentState;
  return clamp(
    0.25 +
      state.brightness * 0.28 +
      state.densityBias * 0.3 +
      (1 - state.calmness) * 0.17,
    0.12,
    0.96,
  );
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

function waveNoise(seed: string, sampleIndex: number): number {
  const x = Math.sin(stableHash(seed) + sampleIndex * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) * 2 - 1;
}

function firmwareWave(
  echoType: EchoType,
  phase1: number,
  phase2: number,
  noise: number,
): number {
  if (echoType === "bounce") {
    const s1 = waveTriangle(phase1);
    const s2 = waveSine(phase2);
    return s1 * 0.62 + s2 * 0.38;
  }

  if (echoType === "shy") {
    const s1 = waveSine(phase1);
    const s2 = waveTriangle(phase2);
    return s1 * 0.88 + s2 * 0.12;
  }

  const s1 = waveSaw(phase1);
  const s2 = waveTriangle(phase2);
  const s3 = waveSine((phase1 + phase2) * 0.5);
  return s1 * 0.26 + s2 * 0.36 + s3 * 0.28 + noise * 0.035;
}

function triggerFrequency(
  device: EchoDevice,
  semis: number[],
  triggerIndex: number,
): { freq1: number; freq2: number; cutoff: number; delayWet: number; env: number; envDecay: number; semi: number } {
  const voice = FIRMWARE_VOICES[device.echoType];
  const root = firmwareRootMidi(device.echoType);
  const closeness = closenessFromState(device);
  const semi = phraseSemi(device, triggerIndex, semis);
  const freq1 = midiToFreq(root + semi);
  const messyDetune =
    0.98 + Math.floor(unit(`${device.id}:detune:${triggerIndex}`) * 20) * 0.001;
  const freq2 =
    device.echoType === "bounce"
      ? freq1 * 1.004
      : device.echoType === "shy"
        ? freq1 * 1.001
        : freq1 * messyDetune;
  const cutoff =
    device.echoType === "messy"
      ? voice.baseCutoff + unit(`${device.id}:cutoff:${triggerIndex}`) * voice.closenessCutoff
      : voice.baseCutoff + closeness * voice.closenessCutoff;

  return {
    freq1,
    freq2,
    cutoff,
    delayWet: voice.delayWet,
    env: voice.env,
    envDecay: voice.envDecay,
    semi,
  };
}

function buildTriggerTimes(device: EchoDevice): number[] {
  const voice = FIRMWARE_VOICES[device.echoType];
  const baseIntervalSec = clamp(
    voice.rate +
      (device.echoType === "shy" ? device.currentState.calmness * 0.16 : 0) -
      (device.echoType !== "shy" ? device.currentState.densityBias * 0.07 : 0),
    device.echoType === "messy" ? 0.18 : 0.26,
    device.echoType === "shy" ? 1.08 : 0.62,
  );
  const triggerTimes: number[] = [];
  let cursor = 0;
  let triggerIndex = 0;
  while (cursor < LOOP_SECONDS) {
    triggerTimes.push(cursor);
    const rhythm = voice.rhythm[triggerIndex % voice.rhythm.length] ?? 1;
    const humanize =
      (unit(`${device.id}:rhythm:${triggerIndex}`) - 0.5) *
      (device.echoType === "messy" ? 0.08 : 0.035);
    cursor += Math.max(0.12, baseIntervalSec * rhythm + humanize);
    triggerIndex += 1;
  }
  return triggerTimes;
}

export function getFirmwareEchoLoopSeconds(): number {
  return LOOP_SECONDS;
}

export function buildFirmwareEchoNoteEvents(device: EchoDevice): EchoNoteEvent[] {
  const semis = melodySemiFromDevice(device);
  return buildTriggerTimes(device).map((time, triggerIndex) => {
    const trigger = triggerFrequency(device, semis, triggerIndex);
    const normalizedSemi = ((trigger.semi % 24) + 24) % 24;
    const rhythm =
      FIRMWARE_VOICES[device.echoType].rhythm[
        triggerIndex % FIRMWARE_VOICES[device.echoType].rhythm.length
      ] ?? 1;
    return {
      time,
      hue: normalizedSemi / 24,
      accent: clamp(0.64 + (1.25 - Math.min(1.25, rhythm)) * 0.32, 0.54, 0.95),
    };
  });
}

export function renderFirmwareEchoBuffer(
  audioContext: BaseAudioContext,
  device: EchoDevice,
): AudioBuffer {
  const sampleRate = audioContext.sampleRate;
  const totalSamples = Math.ceil(LOOP_SECONDS * sampleRate);
  const mono = new Float32Array(totalSamples);
  const semis = melodySemiFromDevice(device);
  const closeness = closenessFromState(device);
  const voice = FIRMWARE_VOICES[device.echoType];
  const triggerTimes = buildTriggerTimes(device);

  for (let triggerIndex = 0; triggerIndex < triggerTimes.length; triggerIndex += 1) {
    const trigger = triggerFrequency(device, semis, triggerIndex);
    const startSample = Math.floor((triggerTimes[triggerIndex] ?? 0) * sampleRate);
    const rhythm = voice.rhythm[triggerIndex % voice.rhythm.length] ?? 1;
    const noteSamples = Math.min(
      totalSamples - startSample,
      Math.ceil(
        (device.echoType === "shy"
          ? 2.4 + rhythm * 0.65
          : device.echoType === "bounce"
            ? 0.72 + rhythm * 0.42
            : 0.95 + rhythm * 0.36) * sampleRate,
      ),
    );
    let phase1 = 0;
    let phase2 = 0;
    let lowpassState = 0;
    let env = trigger.env;
    const alpha = clamp(
      1 - Math.exp((-2 * Math.PI * trigger.cutoff) / sampleRate),
      0.001,
      0.95,
    );

    for (let i = 0; i < noteSamples; i += 1) {
      const sampleIndex = startSample + i;
      if (sampleIndex >= totalSamples) break;
      const t = i / sampleRate;
      const attack =
        device.echoType === "bounce"
          ? 0.025
          : device.echoType === "messy"
            ? 0.045
            : 0.18 + device.currentState.calmness * 0.08;
      const releaseStart =
        device.echoType === "bounce"
          ? 0.42 + rhythm * 0.28
          : device.echoType === "messy"
            ? 0.56 + rhythm * 0.32
            : 1.45 + rhythm * 0.55;
      const attackEnv = clamp(t / attack, 0, 1);
      const releaseEnv =
        t > releaseStart
          ? clamp(
              1 -
                (t - releaseStart) /
                  (device.echoType === "shy" ? 1.45 : 0.48),
              0,
              1,
            )
          : 1;
      const vibrato =
        1 + Math.sin(Math.PI * 2 * (4.1 + closeness * 1.2) * (sampleIndex / sampleRate)) * 0.0018;
      const dry =
        firmwareWave(
          device.echoType,
          phase1,
          phase2,
          waveNoise(`${device.id}:${triggerIndex}`, i),
        ) * env * attackEnv * releaseEnv;
      phase1 = (phase1 + (trigger.freq1 * vibrato) / sampleRate) % 1;
      phase2 = (phase2 + (trigger.freq2 / vibrato) / sampleRate) % 1;
      env *= trigger.envDecay ** (SAMPLE_RATE_REFERENCE / sampleRate);
      lowpassState += alpha * (dry - lowpassState);
      mono[sampleIndex] += lowpassState;
    }
  }

  const delaySamples = Math.max(1, Math.round(4096 * (sampleRate / SAMPLE_RATE_REFERENCE)));
  const delay = new Float32Array(delaySamples);
  let delayIndex = 0;
  const delayWet = FIRMWARE_VOICES[device.echoType].delayWet;
  for (let i = 0; i < totalSamples; i += 1) {
    const delayed = delay[delayIndex] ?? 0;
    const filtered = mono[i];
    const out = filtered + delayed * delayWet;
    delay[delayIndex] = filtered + delayed * 0.34;
    delayIndex = (delayIndex + 1) % delaySamples;
    mono[i] = Math.tanh(out * 1.35) * 0.58;
  }

  let peak = 0;
  for (let i = 0; i < totalSamples; i += 1) {
    peak = Math.max(peak, Math.abs(mono[i]));
  }

  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const gain = peak > 0 ? 0.9 / peak : 1;
  for (let i = 0; i < totalSamples; i += 1) {
    const sample = mono[i] * gain;
    const t = i / sampleRate;
    const width = Math.sin(Math.PI * 2 * 0.08 * t) * 0.04;
    left[i] = sample * (0.92 + width);
    right[i] = sample * (0.92 - width);
  }

  return buffer;
}
