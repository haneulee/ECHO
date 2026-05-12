import { PrismaClient } from "@prisma/client";

import {
  mockArchive,
  mockEvolutions,
  mockSoundProfile,
  mockSoundVoices,
} from "../src/lib/mockData";

const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { id: "user_haneul" },
    create: {
      id: "user_haneul",
      name: "Haneul",
      passwordHash:
        "$2b$10$WOGByRV.DhWc/yPuhsgp.OyEOSkv/syj5E0dzIBd9UnBNVE6sfpXO",
    },
    update: {
      name: "Haneul",
      passwordHash:
        "$2b$10$WOGByRV.DhWc/yPuhsgp.OyEOSkv/syj5E0dzIBd9UnBNVE6sfpXO",
    },
  });

  await prisma.echoDevice.upsert({
    where: { id: "echo_namu_001" },
    create: {
      id: "echo_namu_001",
      userId: "user_haneul",
      serialNumber: "ECHO-LS-0428",
      echoName: "Namu",
      echoType: "shy",
      currentSoundProfileId: "ambient3_meditation_v1",
      currentState: {
        melody: ["E4", "G4", "A4", "C5", "D5", "A4", "G4", "E4"],
        brightness: 0.68,
        calmness: 0.82,
        densityBias: 0.44,
        influences: { shy: 0.46, messy: 0.22, bounce: 0.32 },
      },
      lastSyncedAt: new Date("2026-05-06T11:48:00.000Z"),
    },
    update: {
      echoName: "Namu",
      echoType: "shy",
      currentSoundProfileId: "ambient3_meditation_v1",
    },
  });

  await prisma.soundProfile.upsert({
    where: { id: mockSoundProfile.id },
    create: {
      id: mockSoundProfile.id,
      name: mockSoundProfile.name,
      description: mockSoundProfile.description,
      engineType: mockSoundProfile.engineType,
      scale: mockSoundProfile.scale,
      tempoBpm: mockSoundProfile.tempoBpm,
      globalParams: mockSoundProfile.globalParams as object,
      voices: mockSoundVoices as object,
    },
    update: {
      name: mockSoundProfile.name,
      description: mockSoundProfile.description,
      engineType: mockSoundProfile.engineType,
      scale: mockSoundProfile.scale,
      tempoBpm: mockSoundProfile.tempoBpm,
      globalParams: mockSoundProfile.globalParams as object,
      voices: mockSoundVoices as object,
    },
  });

  for (const m of mockArchive) {
    await prisma.dailyMemory.upsert({
      where: {
        userId_deviceId_date: {
          userId: m.userId,
          deviceId: m.deviceId,
          date: m.date,
        },
      },
      create: {
        id: m.id,
        userId: m.userId,
        deviceId: m.deviceId,
        date: m.date,
        soundProfileId: m.soundProfileId,
        profileSnapshot: m.profileSnapshot as object,
        totalEncounters: m.totalEncounters,
        totalDurationSec: m.totalDurationSec,
        dominantZone: m.dominantZone,
        dominantEchoType: m.dominantEchoType,
        composition: m.composition as object,
        visualization: m.visualization as object,
        createdAt: new Date(m.createdAt),
      },
      update: {
        totalEncounters: m.totalEncounters,
        totalDurationSec: m.totalDurationSec,
        dominantZone: m.dominantZone,
        dominantEchoType: m.dominantEchoType,
        composition: m.composition as object,
        visualization: m.visualization as object,
      },
    });
  }

  const ev = mockEvolutions[0];
  await prisma.echoEvolution.upsert({
    where: { id: ev.id },
    create: {
      id: ev.id,
      deviceId: ev.deviceId,
      dailyMemoryId: ev.dailyMemoryId,
      mutationType: ev.mutationType,
      sourceEchoHash: ev.sourceEchoHash,
      trigger: ev.trigger as object,
      beforeState: ev.beforeState as object,
      afterState: ev.afterState as object,
      borrowedFragment: ev.borrowedFragment as object,
      createdAt: new Date(ev.createdAt),
    },
    update: {
      mutationType: ev.mutationType,
      sourceEchoHash: ev.sourceEchoHash,
      trigger: ev.trigger as object,
      beforeState: ev.beforeState as object,
      afterState: ev.afterState as object,
      borrowedFragment: ev.borrowedFragment as object,
    },
  });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
