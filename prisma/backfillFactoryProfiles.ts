/**
 * One-time backfill: set per-type factory profileSnapshot on devices that still
 * share the old universal default. Safe to re-run — skips dock-synced profiles.
 *
 * Usage: dotenv -e .env.local -- tsx prisma/backfillFactoryProfiles.ts
 */
import { PrismaClient, type EchoType } from "@prisma/client";

import {
  factoryStateForType,
  isLegacyFactoryState,
} from "../src/lib/echoFactoryProfile";

const prisma = new PrismaClient();

const ECHO_TYPES: EchoType[] = ["shy", "messy", "bounce"];

function resolveEchoType(
  echoType: EchoType,
  echoModelType: string | null,
): EchoType {
  const model = echoModelType?.trim().toLowerCase();
  if (model === "shy" || model === "messy" || model === "bounce") {
    return model;
  }
  return echoType;
}

async function main() {
  const devices = await prisma.echoDevice.findMany({
    select: {
      id: true,
      echoType: true,
      echoModelType: true,
      currentState: true,
      lastSyncedAt: true,
    },
  });

  let updated = 0;
  for (const device of devices) {
    if (!ECHO_TYPES.includes(device.echoType)) continue;

    const type = resolveEchoType(device.echoType, device.echoModelType);
    const state =
      typeof device.currentState === "object" && device.currentState !== null
        ? (device.currentState as Record<string, unknown>)
        : {};

    if (!isLegacyFactoryState(type, state, device.lastSyncedAt)) {
      continue;
    }

    await prisma.echoDevice.update({
      where: { id: device.id },
      data: {
        currentState: factoryStateForType(type),
        echoModelType: type,
      },
    });
    updated += 1;
    console.log(`Updated ${device.id} (${type})`);
  }

  console.log(`Backfill complete. Updated ${updated} of ${devices.length} devices.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
