import { mockArchive, mockEchoDevice, mockEncounters } from "@/lib/mockData";
import type { ArchiveApiResponse } from "@/lib/archiveApiTypes";

function shiftDate(isoLike: string, date: string): string {
  const match = /T(\d{2}:\d{2}:\d{2})/.exec(isoLike);
  return `${date}T${match?.[1] ?? "12:00:00"}.000Z`;
}

export function mockArchivePayload(): ArchiveApiResponse {
  return {
    items: mockArchive.map((memory, memoryIndex) => {
      const encounters = mockEncounters
        .slice(0, Math.max(3, memory.totalEncounters))
        .map((encounter, encounterIndex) => ({
          ...encounter,
          id: `mock_archive_${memory.date}_${encounterIndex + 1}`,
          deviceId: mockEchoDevice.id,
          startedAt: shiftDate(encounter.startedAt, memory.date),
          endedAt: shiftDate(encounter.endedAt, memory.date),
        }));

      return {
        memory: {
          ...memory,
          id: `mock_archive_memory_${memoryIndex + 1}`,
          totalEncounters: encounters.length,
          totalDurationSec: encounters.reduce(
            (sum, encounter) => sum + encounter.durationSec,
            0,
          ),
        },
        encounters,
      };
    }),
  };
}
