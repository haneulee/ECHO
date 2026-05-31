import { DateTime } from "luxon";

import {
  periodBoundsForDate,
  shiftOverviewAnchorDate,
} from "@/lib/calendarPeriod";
import {
  mockArchive,
  mockDailyMemory,
  mockEncounters,
} from "@/lib/mockData";
import { localMockEchoDevice } from "@/lib/localMockData";
import type { TodayApiResponse } from "@/lib/todayApiTypes";
import type { OverviewSpan } from "@/lib/zonedDayRange";

function timePart(isoLike: string): string {
  const match = /T(\d{2}:\d{2}:\d{2})/.exec(isoLike);
  return match?.[1] ?? "12:00:00";
}

function mockPeriodHasData(
  anchorDate: string,
  span: OverviewSpan,
  timeZone: string,
): boolean {
  const bounds = periodBoundsForDate(anchorDate, span, timeZone);
  if (!bounds) return false;

  return mockArchive.some(
    (memory) =>
      memory.date >= bounds.periodStart && memory.date <= bounds.periodEnd,
  );
}

export function mockTodayPayload(
  date: string,
  span: OverviewSpan = "daily",
  timeZone = "UTC",
): TodayApiResponse {
  const device = {
    ...localMockEchoDevice,
    lastSyncedAt: `${date}T14:45:00.000Z`,
  };

  const hasDataForDate = mockPeriodHasData(date, span, timeZone);
  const encounters =
    hasDataForDate && date === mockDailyMemory.date
      ? mockEncounters.map((encounter, index) => {
          const start = `${date}T${timePart(encounter.startedAt)}.000Z`;
          const end = `${date}T${timePart(encounter.endedAt)}.000Z`;
          return {
            ...encounter,
            id: `mock_today_${String(index + 1).padStart(2, "0")}`,
            deviceId: device.id,
            startedAt: start,
            endedAt: end,
          };
        })
      : [];

  const prevAnchor = shiftOverviewAnchorDate(date, span, -1, timeZone);
  const nextAnchor = shiftOverviewAnchorDate(date, span, 1, timeZone);
  const today = DateTime.now().setZone(timeZone).startOf("day");
  const nextBounds = nextAnchor
    ? periodBoundsForDate(nextAnchor, span, timeZone)
    : null;
  const nextInFuture =
    nextBounds !== null &&
    DateTime.fromISO(nextBounds.periodStart, { zone: timeZone }).startOf(
      "day",
    ) > today;

  return {
    encounters,
    dailyMemory:
      hasDataForDate && date === mockDailyMemory.date
        ? {
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
          }
        : null,
    device,
    hasPrevPeriod: prevAnchor
      ? mockPeriodHasData(prevAnchor, span, timeZone)
      : false,
    hasNextPeriod:
      nextAnchor && !nextInFuture
        ? mockPeriodHasData(nextAnchor, span, timeZone)
        : false,
  };
}
