import type { PrismaClient } from "@prisma/client";

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
    const profile = encounter.otherEchoModelName
      ? byModelName.get(encounter.otherEchoModelName)
      : null;
    if (!profile) return encounter;
    return {
      ...encounter,
      otherEchoName: profile.echoName,
      otherEchoColor: profile.echoColor,
    };
  });
}
