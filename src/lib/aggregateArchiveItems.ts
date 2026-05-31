import { DateTime } from "luxon";

import type { ArchiveCarouselItem } from "@/components/ArchiveCarousel";
import {
  periodAnchorDate,
  periodBoundsForDate,
  periodKeyForDate,
} from "@/lib/calendarPeriod";
import type { OverviewSpan } from "@/lib/zonedDayRange";

function mergeArchiveGroup(
  group: ArchiveCarouselItem[],
  span: Exclude<OverviewSpan, "daily">,
  timeZone: string,
): ArchiveCarouselItem {
  const byDate = [...group].sort((a, b) =>
    a.memory.date.localeCompare(b.memory.date),
  );
  const periodStart = byDate[0]!.memory.date;
  const periodEnd = byDate[byDate.length - 1]!.memory.date;
  const bounds = periodBoundsForDate(periodEnd, span, timeZone);
  const encounters = byDate
    .flatMap((item) => item.encounters)
    .sort(
      (a, b) =>
        new Date(a.startedAt).getTime() - new Date(b.startedAt).getTime(),
    );

  const primary = byDate.reduce((best, item) =>
    item.memory.totalEncounters > best.memory.totalEncounters ? item : best,
  );

  const totalEncounters = encounters.length;
  const totalDurationSec = encounters.reduce(
    (sum, encounter) => sum + encounter.durationSec,
    0,
  );
  const key = periodKeyForDate(periodEnd, span, timeZone);
  const anchorDate = periodAnchorDate(periodEnd, span, timeZone);

  return {
    memory: {
      ...primary.memory,
      id: `archive_${span}_${key}`,
      date: anchorDate,
      totalEncounters,
      totalDurationSec,
    },
    encounters,
    periodStart: bounds?.periodStart ?? periodStart,
    periodEnd: bounds?.periodEnd ?? periodEnd,
  };
}

export function aggregateArchiveItems(
  items: ArchiveCarouselItem[],
  span: OverviewSpan,
  timeZone: string,
): ArchiveCarouselItem[] {
  const sortedDaily = [...items].sort((a, b) =>
    b.memory.date.localeCompare(a.memory.date),
  );

  if (span === "daily") return sortedDaily;

  const groups = new Map<string, ArchiveCarouselItem[]>();
  for (const item of sortedDaily) {
    const key = periodKeyForDate(item.memory.date, span, timeZone);
    groups.set(key, [...(groups.get(key) ?? []), item]);
  }

  return [...groups.values()]
    .map((group) => mergeArchiveGroup(group, span, timeZone))
    .sort((a, b) =>
      (b.periodEnd ?? b.memory.date).localeCompare(
        a.periodEnd ?? a.memory.date,
      ),
    );
}
