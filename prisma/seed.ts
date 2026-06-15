import { PrismaClient } from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";
import { defaultStateForType } from "../src/lib/echoDeviceDefaults";
import { mockSoundProfile, mockSoundVoices } from "../src/lib/mockData";
import {
  generateSeedData,
  SEED_PASSWORD,
  SEED_USERS,
} from "./seed/generateSeedData";

const prisma = new PrismaClient();

async function wipeDatabase() {
  await prisma.echoEvolution.deleteMany();
  await prisma.encounter.deleteMany();
  await prisma.dailyMemory.deleteMany();
  await prisma.echoDevice.deleteMany();
  await prisma.user.deleteMany();
}

async function main() {
  await wipeDatabase();

  const passwordHash = hashPassword(SEED_PASSWORD);
  const { encounters, dailyMemories, evolutions } = generateSeedData();

  for (const user of SEED_USERS) {
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        passwordHash,
      },
    });

    await prisma.echoDevice.create({
      data: {
        id: user.device.id,
        userId: user.id,
        serialNumber: user.device.serialNumber,
        echoName: user.device.echoName,
        echoColor: user.device.echoColor,
        firmwareModelName: user.device.firmwareModelName,
        echoType: user.device.echoType,
        echoModelType: user.device.echoType,
        uniqueDeviceName: user.device.firmwareModelName,
        currentSoundProfileId: mockSoundProfile.id,
        currentState: defaultStateForType(user.device.echoType),
        lastSyncedAt: new Date("2026-06-09T11:48:00.000Z"),
      },
    });
  }

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

  for (const memory of dailyMemories) {
    await prisma.dailyMemory.create({ data: memory });
  }

  for (const encounter of encounters) {
    await prisma.encounter.create({ data: encounter });
  }

  for (const evolution of evolutions) {
    await prisma.echoEvolution.create({ data: evolution });
  }

  console.log(
    [
      "Seed complete.",
      `Users: ${SEED_USERS.length} (password for all: ${SEED_PASSWORD})`,
      `Encounters: ${encounters.length}`,
      `Daily memories: ${dailyMemories.length}`,
      `Evolutions: ${evolutions.length}`,
      "",
      "Power users: user_haneul, user_mira",
      "Small users: user_sora, user_jin, user_alex",
    ].join("\n"),
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
