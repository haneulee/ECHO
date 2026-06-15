import { DateTime } from "luxon";

import {
  periodAnchorDate,
  periodBoundsForDate,
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

function parseIsoDay(dateStr: string, timeZone: string) {
  return DateTime.fromISO(dateStr, { zone: timeZone }).startOf("day");
}

function isPeriodInFuture(
  anchorDate: string,
  span: OverviewSpan,
  timeZone: string,
): boolean {
  const bounds = periodBoundsForDate(anchorDate, span, timeZone);
  if (!bounds) return true;
  const today = DateTime.now().setZone(timeZone).startOf("day");
  return parseIsoDay(bounds.periodStart, timeZone) > today;
}

/** Calendar days (YYYY-MM-DD) with encounters or daily memories, mapped to overview anchors. */
export function periodAnchorsFromIsoDates(
  isoDates: string[],
  span: OverviewSpan,
  timeZone: string,
): string[] {
  const anchors = new Set<string>();
  for (const isoDay of isoDates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDay)) continue;
    anchors.add(periodAnchorDate(isoDay, span, timeZone));
  }
  return [...anchors].sort();
}

export function encounterLocalIsoDates(
  startedAtValues: Date[],
  timeZone: string,
): string[] {
  const dates = new Set<string>();
  for (const startedAt of startedAtValues) {
    const iso = DateTime.fromJSDate(startedAt, { zone: timeZone }).toISODate();
    if (iso) dates.add(iso);
  }
  return [...dates];
}

export type OverviewPeriodNavigation = {
  hasPrev: boolean;
  hasNext: boolean;
  prevPeriodDate: string | null;
  nextPeriodDate: string | null;
};

/** Prev/next period that actually has data — skips empty calendar gaps. */
export function resolveOverviewPeriodNavigation(
  periodAnchors: string[],
  anchorDate: string,
  span: OverviewSpan,
  timeZone: string,
): OverviewPeriodNavigation {
  const current = periodAnchorDate(anchorDate, span, timeZone);
  const eligible = periodAnchors.filter(
    (anchor) => !isPeriodInFuture(anchor, span, timeZone),
  );

  const before = eligible.filter((anchor) => anchor < current);
  const after = eligible.filter((anchor) => anchor > current);

  const prevPeriodDate =
    before.length > 0 ? before[before.length - 1]! : null;
  const nextPeriodDate = after.length > 0 ? after[0]! : null;

  return {
    hasPrev: prevPeriodDate !== null,
    hasNext: nextPeriodDate !== null,
    prevPeriodDate,
    nextPeriodDate,
  };
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
