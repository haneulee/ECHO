import type { EchoDevice, EchoType } from "@/lib/types";
import type { EchoNoteEvent } from "@/lib/echoAudioAnalyser";
import {
  TYPE_PALETTES,
  accumulateEchoNoteSamples,
  clamp,
  harmonyRatio,
  liveRootMidi,
} from "@/lib/echoTypeWaveforms";
import {
  envFromBrightness,
  melodySemiFromDevice,
  midiToFreq,
  phraseSemi,
  profileSoundParamsFromDevice,
  profileTriggerRate,
  resolveFactoryEchoType,
  unit,
} from "@/lib/firmwareEchoModel";

const LOOP_SECONDS = 14;

/**
 * Profile preview — the listening device's own factory type + evolved profileSnapshot.
 * Encounter / daily playback uses peer `otherEchoType` via `piDailySound.ts`.
 */
function triggerFrequency(
  device: EchoDevice,
  factoryType: EchoType,
  semis: number[],
  triggerIndex: number,
): { freq1: number; freq2: number; semi: number } {
  const root = liveRootMidi(factoryType);
  const semi = phraseSemi(`${device.id}:fw`, factoryType, triggerIndex, semis);
  const freq1 = midiToFreq(root + semi);
  const rich = device.currentState.brightness > 0.55;
  const freq2 = freq1 * harmonyRatio(factoryType, rich);
  return { freq1, freq2, semi };
}

function buildTriggerTimes(device: EchoDevice, factoryType: EchoType): number[] {
  const params = profileSoundParamsFromDevice(device);
  const baseIntervalSec = profileTriggerRate(factoryType, params);
  const palette = TYPE_PALETTES[factoryType];
  const triggerTimes: number[] = [];
  let cursor = 0;
  let triggerIndex = 0;
  while (cursor < LOOP_SECONDS) {
    triggerTimes.push(cursor);
    const humanize =
      (unit(`${device.id}:rhythm:${triggerIndex}`) - 0.5) *
      (factoryType === "messy" ? 0.04 : 0.02);
    cursor += Math.max(0.03, baseIntervalSec * palette.spacing * 0.55 + humanize);
    triggerIndex += 1;
  }
  return triggerTimes;
}

export function getFirmwareEchoLoopSeconds(): number {
  return LOOP_SECONDS;
}

export function buildFirmwareEchoNoteEvents(device: EchoDevice): EchoNoteEvent[] {
  const factoryType = resolveFactoryEchoType(device);
  const semis = melodySemiFromDevice(device);
  return buildTriggerTimes(device, factoryType).map((time, triggerIndex) => {
    const trigger = triggerFrequency(device, factoryType, semis, triggerIndex);
    const normalizedSemi = ((trigger.semi % 24) + 24) % 24;
    return {
      time,
      hue: normalizedSemi / 24,
      accent: clamp(0.58 + device.currentState.brightness * 0.32, 0.54, 0.95),
    };
  });
}

export function renderFirmwareEchoBuffer(
  audioContext: BaseAudioContext,
  device: EchoDevice,
): AudioBuffer {
  const factoryType = resolveFactoryEchoType(device);
  const params = profileSoundParamsFromDevice(device);
  const palette = TYPE_PALETTES[factoryType];
  const sampleRate = audioContext.sampleRate;
  const totalSamples = Math.ceil(LOOP_SECONDS * sampleRate);
  const left = new Float32Array(totalSamples);
  const right = new Float32Array(totalSamples);
  const semis = melodySemiFromDevice(device);
  const triggerTimes = buildTriggerTimes(device, factoryType);
  const amp = envFromBrightness(palette.amp, params.brightness);

  for (let triggerIndex = 0; triggerIndex < triggerTimes.length; triggerIndex += 1) {
    const trigger = triggerFrequency(device, factoryType, semis, triggerIndex);
    const startSample = Math.floor((triggerTimes[triggerIndex] ?? 0) * sampleRate);
    const duration = palette.decay + palette.attack + 0.14;
    const noteSamples = Math.min(
      totalSamples - startSample,
      Math.ceil(duration * sampleRate),
    );
    const wobbleSeed = unit(`${device.id}:fw:${triggerIndex}:${trigger.semi}`);

    accumulateEchoNoteSamples({
      echoType: factoryType,
      left,
      right,
      startSample,
      noteSamples,
      sampleRate,
      frequency: trigger.freq1,
      frequency2: trigger.freq2,
      attack: palette.attack,
      decay: palette.decay,
      amp,
      pan: palette.pan,
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
