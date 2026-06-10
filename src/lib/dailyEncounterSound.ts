import { liveRootMidi } from "@/lib/echoTypeWaveforms";
import {
  buildPiDailySoundPlan,
  buildPiEncounterSoundPlan,
  renderPiDailySoundBuffer,
  type EncounterScheduleOptions,
  type PiDailySoundPlan,
  type PiEncounterInput,
  type SessionHarmony,
} from "@/lib/piDailySound";
import type { DailyMemory, EchoDevice, EchoType, Encounter } from "@/lib/types";

export type EncounterSoundInput = Pick<
  Encounter,
  | "id"
  | "otherEchoType"
  | "otherEchoProfileSnapshot"
  | "otherEchoSonicSource"
  | "proximityZone"
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
  piPlan: PiDailySoundPlan;
};

function dominantType(encounters: EncounterSoundInput[]): EchoType {
  const counts: Record<EchoType, number> = { shy: 0, messy: 0, bounce: 0 };
  for (const encounter of encounters) {
    counts[encounter.otherEchoType] += 1;
  }
  return (Object.entries(counts) as Array<[EchoType, number]>).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0][0];
}

function avgCloseness(encounters: EncounterSoundInput[]): number {
  if (encounters.length === 0) return 0;
  return (
    encounters.reduce((sum, e) => sum + e.closenessAvg, 0) / encounters.length
  );
}

/**
 * Daily / encounter playback — Pi `render_sound_from_encounters()` parity.
 * Every note uses the detected peer's `otherEchoType` (palette + waveform).
 */
export function buildEncounterSoundPlan(
  date: string,
  inputEncounters: EncounterSoundInput[],
  device: EchoDevice | null = null,
  memory: DailyMemory | null = null,
  scheduleOptions: EncounterScheduleOptions = {},
): EncounterSoundPlan {
  void device;
  const encounters = inputEncounters;
  const dominant = dominantType(encounters);
  const piPlan =
    encounters.length === 1
      ? buildPiEncounterSoundPlan(
          date,
          encounters[0] as PiEncounterInput,
          scheduleOptions,
        )
      : buildPiDailySoundPlan(date, encounters as PiEncounterInput[]);
  const rootMidi = liveRootMidi(dominant);

  const notes: EncounterSoundNote[] = piPlan.notes.map((note) => ({
    time: note.time,
    frequency1: note.frequency,
    frequency2: note.frequency2 ?? note.frequency,
    duration: note.duration,
    closeness: 0.5,
    cutoff: 8000,
    delayWet: 0,
    amp: note.amp,
    pan: note.pan,
    sourceType: note.sourceType,
    semi: 0,
    kind: "encounter" as const,
    encounterId: note.encounterId,
  }));

  const firstFreq = piPlan.notes[0]?.frequency ?? 220;

  return {
    date,
    durationSec: piPlan.durationSec,
    rootMidi,
    melodySemi: [],
    avgCloseness: avgCloseness(encounters),
    dominantType: memory?.dominantEchoType ?? dominant,
    droneFrequency: firstFreq,
    notes,
    piPlan,
  };
}

export function renderEncounterSoundBuffer(
  audioContext: BaseAudioContext,
  plan: EncounterSoundPlan,
): AudioBuffer {
  return renderPiDailySoundBuffer(audioContext, plan.piPlan);
}
