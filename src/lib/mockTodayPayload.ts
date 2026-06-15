import {
  periodBoundsForDate,
} from "@/lib/calendarPeriod";
import {
  periodAnchorsFromIsoDates,
  resolveOverviewPeriodNavigation,
} from "@/lib/encounterPeriodAvailability";
import { mockArchivePayload } from "@/lib/mockArchivePayload";
import { localMockEchoDevice } from "@/lib/localMockData";
import type { TodayApiResponse } from "@/lib/todayApiTypes";
import type { Encounter } from "@/lib/types";
import type { OverviewSpan } from "@/lib/zonedDayRange";

function encountersInPeriod(
  encounters: Encounter[],
  date: string,
  span: OverviewSpan,
  timeZone: string,
): Encounter[] {
  const bounds = periodBoundsForDate(date, span, timeZone);
  if (!bounds) return [];

  return encounters.filter((encounter) => {
    const localDate = new Date(encounter.startedAt).toLocaleDateString("en-CA", {
      timeZone,
    });
    return (
      localDate >= bounds.periodStart && localDate <= bounds.periodEnd
    );
  });
}

export function mockTodayPayload(
  date: string,
  span: OverviewSpan = "daily",
  timeZone = "Asia/Seoul",
): TodayApiResponse {
  const archive = mockArchivePayload();
  const allEncounters = archive.items.flatMap((item) => item.encounters);
  const encounters = encountersInPeriod(allEncounters, date, span, timeZone).sort(
    (a, b) =>
      new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
  );

  const dailyItem = archive.items.find((item) => item.memory.date === date);
  const periodAnchors = periodAnchorsFromIsoDates(
    archive.items.map((item) => item.memory.date),
    span,
    timeZone,
  );
  const navigation = resolveOverviewPeriodNavigation(
    periodAnchors,
    date,
    span,
    timeZone,
  );

  return {
    encounters,
    dailyMemory: dailyItem?.memory ?? null,
    device: localMockEchoDevice,
    hasPrevPeriod: navigation.hasPrev,
    hasNextPeriod: navigation.hasNext,
    prevPeriodDate: navigation.prevPeriodDate,
    nextPeriodDate: navigation.nextPeriodDate,
  };
}
