import { localMockEchoDevice } from "@/lib/localMockData";
import { mockArchive, mockEncounters } from "@/lib/mockData";
import type { ArchiveApiResponse } from "@/lib/archiveApiTypes";
import type { Encounter } from "@/lib/types";

function shiftEncounterToDate(encounter: Encounter, date: string, index: number) {
  const startMatch = /T(\d{2}:\d{2}:\d{2})/.exec(encounter.startedAt);
  const endMatch = /T(\d{2}:\d{2}:\d{2})/.exec(encounter.endedAt);
  const startTime = startMatch?.[1] ?? "12:00:00";
  const endTime = endMatch?.[1] ?? "12:05:00";
  return {
    ...encounter,
    id: `mock_archive_${date}_${index + 1}`,
    deviceId: localMockEchoDevice.id,
    startedAt: `${date}T${startTime}+09:00`,
    endedAt: `${date}T${endTime}+09:00`,
  };
}

export function mockArchivePayload(): ArchiveApiResponse {
  return {
    device: localMockEchoDevice,
    items: mockArchive.map((memory, memoryIndex) => {
      const encounters = mockEncounters
        .slice(0, memory.totalEncounters)
        .map((encounter, encounterIndex) =>
          shiftEncounterToDate(encounter, memory.date, encounterIndex),
        );

      return {
        memory: {
          ...memory,
          id: `mock_archive_memory_${memoryIndex + 1}`,
          deviceId: localMockEchoDevice.id,
          profileSnapshot: localMockEchoDevice.currentState,
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
