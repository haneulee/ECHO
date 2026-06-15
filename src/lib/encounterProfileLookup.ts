import type { PrismaClient } from "@prisma/client";

import { mockPeerByModelName } from "@/lib/mockPeerEchoes";
import type { Encounter } from "@/lib/types";

export async function attachEncounterEchoProfiles(
  prisma: PrismaClient,
  encounters: Encounter[],
): Promise<Encounter[]> {
  const modelNames = [
    ...new Set(
      encounters
        .map((encounter) => encounter.otherEchoModelName)
        .filter((value): value is string => Boolean(value)),
    ),
  ];
  if (modelNames.length === 0) return encounters;

  const profiles = await prisma.echoDevice.findMany({
    where: { firmwareModelName: { in: modelNames } },
    select: {
      firmwareModelName: true,
      echoName: true,
      echoColor: true,
    },
  });
  const byModelName = new Map(
    profiles
      .filter((profile) => profile.firmwareModelName)
      .map((profile) => [profile.firmwareModelName!, profile]),
  );

  return encounters.map((encounter) => {
    if (!encounter.otherEchoModelName) return encounter;

    const registered = byModelName.get(encounter.otherEchoModelName);
    if (registered) {
      return {
        ...encounter,
        otherEchoName: registered.echoName,
        otherEchoColor: registered.echoColor,
      };
    }

    const catalog = mockPeerByModelName(encounter.otherEchoModelName);
    if (!catalog) return encounter;

    return {
      ...encounter,
      otherEchoName: catalog.echoName,
      otherEchoColor: catalog.echoColor,
    };
  });
}
