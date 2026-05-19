import type {
  DailyMemory as PrismaDailyMemory,
  EchoDevice as PrismaEchoDevice,
  EchoEvolution as PrismaEchoEvolution,
  Encounter as PrismaEncounter,
} from "@prisma/client";

import type {
  DailyMemory,
  EchoDevice,
  EchoEvolution,
  EchoType,
  Encounter,
  ProximityZone,
} from "@/lib/types";
import { defaultStateForType } from "@/lib/echoDeviceDefaults";

const SEMITONE_NOTES = [
  "C4",
  "C#4",
  "D4",
  "D#4",
  "E4",
  "F4",
  "F#4",
  "G4",
  "G#4",
  "A4",
  "A#4",
  "B4",
];

function melodyFromUnknown(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  if (value.every((note) => typeof note === "string")) return value;
  if (value.every((note) => typeof note === "number")) {
    return value.map((note) => SEMITONE_NOTES[((Math.round(note) % 12) + 12) % 12]);
  }
  return null;
}

function numberOrFallback(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function normalizeEchoDeviceState(
  value: unknown,
  echoType: EchoType,
): EchoDevice["currentState"] {
  const fallback = defaultStateForType(echoType);
  const state =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};
  const melody =
    melodyFromUnknown(state.melody) ??
    melodyFromUnknown(state.melodySemi) ??
    fallback.melody;
  const influences =
    typeof state.influences === "object" && state.influences !== null
      ? (state.influences as Partial<EchoDevice["currentState"]["influences"]>)
      : {};

  return {
    melody,
    brightness: numberOrFallback(state.brightness, fallback.brightness),
    calmness: numberOrFallback(state.calmness, fallback.calmness),
    densityBias: numberOrFallback(state.densityBias, fallback.densityBias),
    influences: {
      shy: numberOrFallback(influences.shy, fallback.influences.shy),
      messy: numberOrFallback(influences.messy, fallback.influences.messy),
      bounce: numberOrFallback(influences.bounce, fallback.influences.bounce),
    },
  };
}

function normalizeEvolutionState(
  value: unknown,
  echoType: EchoType,
): EchoEvolution["beforeState"] {
  const fallback = normalizeEchoDeviceState(value, echoType);
  const state =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    melody: fallback.melody,
    brightness: numberOrFallback(state.brightness, fallback.brightness),
    calmness: numberOrFallback(state.calmness, fallback.calmness),
    densityBias: numberOrFallback(state.densityBias, fallback.densityBias),
  };
}

export function encounterRowToDto(row: PrismaEncounter): Encounter {
  return {
    id: row.id,
    deviceId: row.deviceId,
    otherEchoHash: row.otherEchoHash,
    otherEchoType: row.otherEchoType as EchoType,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt.toISOString(),
    durationSec: row.durationSec,
    rssiAvg: row.rssiAvg,
    rssiMin: row.rssiMin,
    rssiMax: row.rssiMax,
    proximityZone: row.proximityZone as ProximityZone,
    closenessAvg: row.closenessAvg,
    soundProfileId: row.soundProfileId,
  };
}

export function echoDeviceRowToDto(row: PrismaEchoDevice): EchoDevice {
  const echoType = row.echoType as EchoType;
  return {
    id: row.id,
    userId: row.userId,
    serialNumber: row.serialNumber,
    echoName: row.echoName,
    echoType,
    currentSoundProfileId: row.currentSoundProfileId ?? "",
    currentState: normalizeEchoDeviceState(row.currentState, echoType),
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? "",
  };
}

export function echoEvolutionRowToDto(row: PrismaEchoEvolution): EchoEvolution {
  const sourceEchoType = row.sourceEchoType as EchoType | null | undefined;
  const stateEchoType = sourceEchoType ?? "shy";
  return {
    id: row.id,
    deviceId: row.deviceId,
    dailyMemoryId: row.dailyMemoryId,
    mutationType: row.mutationType,
    sourceEchoHash: row.sourceEchoHash,
    sourceEchoType,
    trigger: row.trigger as EchoEvolution["trigger"],
    beforeState: normalizeEvolutionState(row.beforeState, stateEchoType),
    afterState: normalizeEvolutionState(row.afterState, stateEchoType),
    borrowedFragment: row.borrowedFragment as EchoEvolution["borrowedFragment"],
    createdAt: row.createdAt.toISOString(),
  };
}

export function dailyMemoryRowToDto(row: PrismaDailyMemory): DailyMemory {
  return {
    id: row.id,
    userId: row.userId,
    deviceId: row.deviceId,
    date: row.date,
    soundProfileId: row.soundProfileId,
    profileSnapshot: row.profileSnapshot as Record<string, unknown>,
    totalEncounters: row.totalEncounters,
    totalDurationSec: row.totalDurationSec,
    dominantZone: row.dominantZone as ProximityZone,
    dominantEchoType: row.dominantEchoType as EchoType,
    composition: row.composition as DailyMemory["composition"],
    visualization: row.visualization as DailyMemory["visualization"],
    createdAt: row.createdAt.toISOString(),
  };
}
