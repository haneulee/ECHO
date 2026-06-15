import {
  dailyMemoryRowToDto,
  echoDeviceRowToDto,
  echoEvolutionRowToDto,
  encounterRowToDto,
} from "@/lib/dbSerializers";
import { attachEncounterEchoProfiles } from "@/lib/encounterProfileLookup";
import { prisma } from "@/lib/prisma";
import type { DailyMemory, EchoDevice, EchoEvolution, EchoType, Encounter } from "@/lib/types";
import { zonedDayRangeUtc } from "@/lib/zonedDayRange";

function localIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function getProfileDeviceContext(
  userId: string,
): Promise<{
  device: EchoDevice;
  evolutions: EchoEvolution[];
  todayMemory: DailyMemory | null;
  todayEncounters: Encounter[];
} | null> {
  const row = await prisma.echoDevice.findFirst({
    where: { userId },
    orderBy: { id: "asc" },
    include: { evolutions: { orderBy: { createdAt: "desc" } } },
  });
  if (!row) return null;

  const today = localIsoDate(new Date());
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const todayRange = zonedDayRangeUtc(today, timeZone);
  const todayMemoryRow = await prisma.dailyMemory.findFirst({
    where: { userId, deviceId: row.id, date: today },
  });
  const todayMemory = todayMemoryRow ? dailyMemoryRowToDto(todayMemoryRow) : null;
  const todayEncounterRows =
    todayRange
      ? await prisma.encounter.findMany({
          where: {
            deviceId: row.id,
            startedAt: { gte: todayRange.start, lt: todayRange.end },
          },
          orderBy: { startedAt: "asc" },
        })
      : [];

  return {
    device: echoDeviceRowToDto(row),
    evolutions: row.evolutions.map((evolution) =>
      echoEvolutionRowToDto(evolution, row.echoType as EchoType),
    ),
    todayMemory,
    todayEncounters: await attachEncounterEchoProfiles(
      prisma,
      todayEncounterRows.map(encounterRowToDto),
    ),
  };
}
