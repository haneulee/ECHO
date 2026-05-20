import {
  mockDailyMemory,
  mockEncounters,
} from "@/lib/mockData";
import { localMockEchoDevice } from "@/lib/localMockData";
import type { TodayApiResponse } from "@/lib/todayApiTypes";

function timePart(isoLike: string): string {
  const match = /T(\d{2}:\d{2}:\d{2})/.exec(isoLike);
  return match?.[1] ?? "12:00:00";
}

export function mockTodayPayload(date: string): TodayApiResponse {
  const device = {
    ...localMockEchoDevice,
    lastSyncedAt: `${date}T14:45:00.000Z`,
  };

  const encounters = mockEncounters.map((encounter, index) => {
    const start = `${date}T${timePart(encounter.startedAt)}.000Z`;
    const end = `${date}T${timePart(encounter.endedAt)}.000Z`;
    return {
      ...encounter,
      id: `mock_today_${String(index + 1).padStart(2, "0")}`,
      deviceId: device.id,
      startedAt: start,
      endedAt: end,
    };
  });

  return {
    encounters,
    dailyMemory: {
      ...mockDailyMemory,
      id: `mock_memory_${date.replaceAll("-", "_")}`,
      userId: device.userId,
      deviceId: device.id,
      date,
      profileSnapshot: device.currentState,
      totalEncounters: encounters.length,
      totalDurationSec: encounters.reduce(
        (sum, encounter) => sum + encounter.durationSec,
        0,
      ),
      createdAt: `${date}T21:04:00.000Z`,
    },
    device,
  };
}
