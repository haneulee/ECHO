import { DateTime } from "luxon";

import {
  periodBoundsForDate,
  shiftOverviewAnchorDate,
  zonedCalendarSpanRangeUtc,
} from "@/lib/calendarPeriod";
import type { OverviewSpan } from "@/lib/zonedDayRange";
import { zonedDayRangeUtc } from "@/lib/zonedDayRange";

function periodRangeUtc(
  anchorDate: string,
  span: OverviewSpan,
  timeZone: string,
) {
  if (span === "daily") return zonedDayRangeUtc(anchorDate, timeZone);
  return zonedCalendarSpanRangeUtc(anchorDate, timeZone, span);
}

export async function periodHasEncounters(
  countEncounters: (range: { start: Date; end: Date }) => Promise<number>,
  anchorDate: string,
  span: OverviewSpan,
  timeZone: string,
): Promise<boolean> {
  const range = periodRangeUtc(anchorDate, span, timeZone);
  if (!range) return false;
  return (await countEncounters(range)) > 0;
}

export async function adjacentPeriodAvailability(
  countEncounters: (range: { start: Date; end: Date }) => Promise<number>,
  anchorDate: string,
  span: OverviewSpan,
  timeZone: string,
): Promise<{ hasPrev: boolean; hasNext: boolean }> {
  const prevAnchor = shiftOverviewAnchorDate(anchorDate, span, -1, timeZone);
  const nextAnchor = shiftOverviewAnchorDate(anchorDate, span, 1, timeZone);

  const today = DateTime.now().setZone(timeZone).startOf("day");
  const nextBounds = nextAnchor
    ? periodBoundsForDate(nextAnchor, span, timeZone)
    : null;
  const nextInFuture =
    nextBounds !== null &&
    parseIsoDay(nextBounds.periodStart, timeZone) > today;

  const [hasPrev, hasNextData] = await Promise.all([
    prevAnchor
      ? periodHasEncounters(countEncounters, prevAnchor, span, timeZone)
      : Promise.resolve(false),
    nextAnchor && !nextInFuture
      ? periodHasEncounters(countEncounters, nextAnchor, span, timeZone)
      : Promise.resolve(false),
  ]);

  return { hasPrev, hasNext: hasNextData };
}

function parseIsoDay(dateStr: string, timeZone: string) {
  return DateTime.fromISO(dateStr, { zone: timeZone }).startOf("day");
}
