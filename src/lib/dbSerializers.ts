import type {
  DailyMemory as PrismaDailyMemory,
  EchoDevice as PrismaEchoDevice,
  EchoEvolution as PrismaEchoEvolution,
  Encounter as PrismaEncounter,
} from "@prisma/client";

import { normalizePeerProfileSnapshot } from "@/lib/peerSonicSnapshot";
import { defaultStateForType } from "@/lib/echoDeviceDefaults";
import { melodyNotesFromSemi } from "@/lib/echoFactoryProfile";
import type {
  DailyMemory,
  EchoDevice,
  EchoEvolution,
  EchoSonicSource,
  EchoType,
  Encounter,
  ProximityZone,
} from "@/lib/types";

function melodySemiFromUnknown(value: unknown): number[] | null {
  if (!Array.isArray(value) || !value.every((note) => typeof note === "number")) {
    return null;
  }
  return value.map((note) => ((Math.round(note) % 12) + 12) % 12).slice(0, 8);
}

function melodyFromNoteNames(value: unknown): string[] | null {
  if (!Array.isArray(value) || !value.every((note) => typeof note === "string")) {
    return null;
  }
  return value;
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
  const melodySemi = melodySemiFromUnknown(state.melodySemi) ?? undefined;
  const melody =
    melodyFromNoteNames(state.melody) ??
    (melodySemi ? melodyNotesFromSemi(echoType, melodySemi) : fallback.melody);
  const influences =
    typeof state.influences === "object" && state.influences !== null
      ? (state.influences as Partial<EchoDevice["currentState"]["influences"]>)
      : {};

  return {
    melody,
    ...(melodySemi ? { melodySemi } : {}),
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
  deviceEchoType: EchoType,
): EchoEvolution["beforeState"] {
  const normalized = normalizeEchoDeviceState(value, deviceEchoType);
  const state =
    typeof value === "object" && value !== null
      ? (value as Record<string, unknown>)
      : {};

  return {
    melody: normalized.melody,
    ...(normalized.melodySemi ? { melodySemi: normalized.melodySemi } : {}),
    brightness: numberOrFallback(state.brightness, normalized.brightness),
    calmness: numberOrFallback(state.calmness, normalized.calmness),
    densityBias: numberOrFallback(state.densityBias, normalized.densityBias),
  };
}

export function encounterRowToDto(row: PrismaEncounter): Encounter {
  const otherEchoType = row.otherEchoType as EchoType;
  const sonicSource = row.otherEchoSonicSource;
  return {
    id: row.id,
    deviceId: row.deviceId,
    otherEchoHash: row.otherEchoHash,
    otherEchoModelName: row.otherEchoModelName,
    otherEchoType,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt.toISOString(),
    durationSec: row.durationSec,
    rssiAvg: row.rssiAvg,
    rssiMin: row.rssiMin,
    rssiMax: row.rssiMax,
    proximityZone: row.proximityZone as ProximityZone,
    closenessAvg: row.closenessAvg,
    soundProfileId: row.soundProfileId,
    otherEchoProfileSnapshot: normalizePeerProfileSnapshot(
      row.otherEchoProfileSnapshot,
      otherEchoType,
    ),
    otherEchoSonicSource:
      sonicSource === "ble_adv" || sonicSource === "factory_default"
        ? (sonicSource as EchoSonicSource)
        : null,
  };
}

export function echoDeviceRowToDto(row: PrismaEchoDevice): EchoDevice {
  const echoType = row.echoType as EchoType;
  return {
    id: row.id,
    userId: row.userId,
    serialNumber: row.serialNumber,
    echoName: row.echoName,
    echoColor: row.echoColor,
    firmwareModelName: row.firmwareModelName,
    echoModelType: row.echoModelType,
    echoType,
    currentSoundProfileId: row.currentSoundProfileId ?? "",
    currentState: normalizeEchoDeviceState(row.currentState, echoType),
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? "",
  };
}

export function echoEvolutionRowToDto(
  row: PrismaEchoEvolution,
  deviceEchoType: EchoType,
): EchoEvolution {
  const sourceEchoType = row.sourceEchoType as EchoType | null | undefined;
  return {
    id: row.id,
    deviceId: row.deviceId,
    dailyMemoryId: row.dailyMemoryId,
    mutationType: row.mutationType,
    sourceEchoHash: row.sourceEchoHash,
    sourceEchoType,
    trigger: row.trigger as EchoEvolution["trigger"],
    beforeState: normalizeEvolutionState(row.beforeState, deviceEchoType),
    afterState: normalizeEvolutionState(row.afterState, deviceEchoType),
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
