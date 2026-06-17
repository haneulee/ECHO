import {
  dailyMemoryRowToDto,
  encounterRowToDto,
} from "@/lib/dbSerializers";
import { attachEncounterEchoProfiles } from "@/lib/encounterProfileLookup";
import { prisma } from "@/lib/prisma";
import type { DailyMemory, Encounter } from "@/lib/types";
import { zonedDayRangeUtc } from "@/lib/zonedDayRange";

export type ArchiveItemDto = {
  memory: DailyMemory;
  encounters: Encounter[];
};

function encounterInRange(
  encounter: Encounter,
  deviceId: string,
  range: { start: Date; end: Date },
): boolean {
  if (encounter.deviceId !== deviceId) return false;
  const startedAt = new Date(encounter.startedAt).getTime();
  return startedAt >= range.start.getTime() && startedAt < range.end.getTime();
}

export async function listArchiveForUser(
  userId: string,
  timeZone: string,
): Promise<ArchiveItemDto[]> {
  const memories = await prisma.dailyMemory.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
  if (memories.length === 0) return [];

  const memoryRanges = memories.map((memory) => ({
    memory,
    range: zonedDayRangeUtc(memory.date, timeZone),
  }));

  const boundedRanges = memoryRanges.filter(
    (entry): entry is { memory: (typeof memories)[number]; range: { start: Date; end: Date } } =>
      entry.range !== null,
  );
  if (boundedRanges.length === 0) {
    return memories.map((memory) => ({
      memory: dailyMemoryRowToDto(memory),
      encounters: [],
    }));
  }

  const deviceIds = [...new Set(memories.map((memory) => memory.deviceId))];
  let minStart = boundedRanges[0]!.range.start;
  let maxEnd = boundedRanges[0]!.range.end;
  for (const { range } of boundedRanges) {
    if (range.start < minStart) minStart = range.start;
    if (range.end > maxEnd) maxEnd = range.end;
  }

  const encounterRows = await prisma.encounter.findMany({
    where: {
      deviceId: { in: deviceIds },
      startedAt: { gte: minStart, lt: maxEnd },
    },
    orderBy: { startedAt: "asc" },
  });

  const allEncounters = await attachEncounterEchoProfiles(
    prisma,
    encounterRows.map(encounterRowToDto),
  );

  return memoryRanges.map(({ memory, range }) => ({
    memory: dailyMemoryRowToDto(memory),
    encounters:
      range === null
        ? []
        : allEncounters.filter((encounter) =>
            encounterInRange(encounter, memory.deviceId, range),
          ),
  }));
}
