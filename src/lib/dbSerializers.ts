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
  const state = row.currentState as EchoDevice["currentState"];
  return {
    id: row.id,
    userId: row.userId,
    serialNumber: row.serialNumber,
    echoName: row.echoName,
    echoType: row.echoType as EchoType,
    currentSoundProfileId: row.currentSoundProfileId ?? "",
    currentState: state,
    lastSyncedAt: row.lastSyncedAt?.toISOString() ?? "",
  };
}

export function echoEvolutionRowToDto(row: PrismaEchoEvolution): EchoEvolution {
  return {
    id: row.id,
    deviceId: row.deviceId,
    dailyMemoryId: row.dailyMemoryId,
    mutationType: row.mutationType,
    sourceEchoHash: row.sourceEchoHash,
    sourceEchoType: row.sourceEchoType as EchoType | null | undefined,
    trigger: row.trigger as EchoEvolution["trigger"],
    beforeState: row.beforeState as EchoEvolution["beforeState"],
    afterState: row.afterState as EchoEvolution["afterState"],
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
