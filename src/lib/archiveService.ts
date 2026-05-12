import {
  dailyMemoryRowToDto,
  encounterRowToDto,
} from "@/lib/dbSerializers";
import { prisma } from "@/lib/prisma";
import type { DailyMemory, Encounter } from "@/lib/types";
import { zonedDayRangeUtc } from "@/lib/zonedDayRange";

export type ArchiveItemDto = {
  memory: DailyMemory;
  encounters: Encounter[];
};

export async function listArchiveForUser(
  userId: string,
  timeZone: string,
): Promise<ArchiveItemDto[]> {
  const memories = await prisma.dailyMemory.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });

  const items: ArchiveItemDto[] = [];
  for (const m of memories) {
    const range = zonedDayRangeUtc(m.date, timeZone);
    const encRows =
      range === null
        ? []
        : await prisma.encounter.findMany({
            where: {
              deviceId: m.deviceId,
              startedAt: { gte: range.start, lt: range.end },
            },
            orderBy: { startedAt: "asc" },
          });
    items.push({
      memory: dailyMemoryRowToDto(m),
      encounters: encRows.map(encounterRowToDto),
    });
  }
  return items;
}
