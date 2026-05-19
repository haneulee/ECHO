import {
  mockDailyMemory,
  mockEchoDevice,
  mockEncounters,
} from "@/lib/mockData";
import type { TodayApiResponse } from "@/lib/todayApiTypes";

function timePart(isoLike: string): string {
  const match = /T(\d{2}:\d{2}:\d{2})/.exec(isoLike);
  return match?.[1] ?? "12:00:00";
}

export function mockTodayPayload(date: string): TodayApiResponse {
  const device = {
    ...mockEchoDevice,
    // Match the currently flashed sample firmware shape more closely.
    id: "ECHO_BOUNCE_001",
    serialNumber: "ECHO_BOUNCE_001",
    echoName: "Boing Ping",
    echoType: "bounce" as const,
    currentState: {
      melody: ["C5", "E5", "G5", "A5", "G5", "E5", "D5", "C5"],
      brightness: 0.76,
      calmness: 0.46,
      densityBias: 0.68,
      influences: { shy: 0.21, messy: 0.21, bounce: 0.58 },
    },
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
