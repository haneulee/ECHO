import { DateTime } from "luxon";

import type { OverviewSpan } from "@/lib/zonedDayRange";

function parseIsoDay(dateStr: string, timeZone: string) {
  return DateTime.fromISO(dateStr, { zone: timeZone }).startOf("day");
}

export function weekIndexInMonth(dt: DateTime): number {
  return Math.floor((dt.day - 1) / 7) + 1;
}

export function weeksInMonth(dt: DateTime): number {
  return Math.ceil(dt.daysInMonth! / 7);
}

export function periodKeyForDate(
  dateStr: string,
  span: OverviewSpan,
  timeZone: string,
): string {
  if (span === "daily") return dateStr;

  const dt = parseIsoDay(dateStr, timeZone);
  if (!dt.isValid) return dateStr;

  if (span === "monthly") return dt.toFormat("yyyy-MM");
  return `${dt.toFormat("yyyy-MM")}-W${weekIndexInMonth(dt)}`;
}

export function periodBoundsForDate(
  dateStr: string,
  span: OverviewSpan,
  timeZone: string,
): { periodStart: string; periodEnd: string } | null {
  const dt = parseIsoDay(dateStr, timeZone);
  if (!dt.isValid) return null;

  if (span === "daily") {
    return { periodStart: dateStr, periodEnd: dateStr };
  }

  if (span === "monthly") {
    const start = dt.startOf("month");
    const end = dt.endOf("month").startOf("day");
    return {
      periodStart: start.toISODate()!,
      periodEnd: end.toISODate()!,
    };
  }

  const week = weekIndexInMonth(dt);
  const monthStart = dt.startOf("month");
  const startDay = (week - 1) * 7 + 1;
  const endDay = Math.min(week * 7, monthStart.daysInMonth!);

  return {
    periodStart: monthStart.set({ day: startDay }).toISODate()!,
    periodEnd: monthStart.set({ day: endDay }).toISODate()!,
  };
}

export function periodAnchorDate(
  dateStr: string,
  span: OverviewSpan,
  timeZone: string,
): string {
  const bounds = periodBoundsForDate(dateStr, span, timeZone);
  return bounds?.periodEnd ?? dateStr;
}

export function zonedCalendarSpanRangeUtc(
  dateStr: string,
  timeZone: string,
  span: OverviewSpan,
): { start: Date; end: Date } | null {
  const bounds = periodBoundsForDate(dateStr, span, timeZone);
  if (!bounds) return null;

  const start = DateTime.fromISO(`${bounds.periodStart}T00:00:00`, {
    zone: timeZone,
  });
  if (!start.isValid) return null;

  const end = DateTime.fromISO(`${bounds.periodEnd}T00:00:00`, {
    zone: timeZone,
  }).plus({ days: 1 });

  return {
    start: start.toUTC().toJSDate(),
    end: end.toUTC().toJSDate(),
  };
}

export function shiftOverviewAnchorDate(
  dateStr: string,
  span: OverviewSpan,
  delta: number,
  timeZone: string,
): string | null {
  const dt = parseIsoDay(dateStr, timeZone);
  if (!dt.isValid) return null;

  if (span === "daily") {
    return dt.plus({ days: delta }).toISODate();
  }

  if (span === "monthly") {
    return dt
      .plus({ months: delta })
      .endOf("month")
      .startOf("day")
      .toISODate();
  }

  let month = dt.startOf("month");
  let week = weekIndexInMonth(dt);
  week += delta;

  while (week < 1) {
    month = month.minus({ months: 1 });
    week += weeksInMonth(month);
  }

  let monthWeeks = weeksInMonth(month);
  while (week > monthWeeks) {
    week -= monthWeeks;
    month = month.plus({ months: 1 });
    monthWeeks = weeksInMonth(month);
  }

  const endDay = Math.min(week * 7, month.daysInMonth!);
  return month.set({ day: endDay }).toISODate();
}

export function formatShortDateRange(
  periodStart: string,
  periodEnd: string,
  timeZone: string,
): string {
  const start = parseIsoDay(periodStart, timeZone);
  const end = parseIsoDay(periodEnd, timeZone);
  if (!start.isValid || !end.isValid) return periodStart;
  if (periodStart === periodEnd) {
    return start.toLocaleString({ month: "long", day: "numeric" });
  }

  const startLabel = start.toLocaleString({ month: "long", day: "numeric" });
  const endLabel = end.toLocaleString({
    month: "long",
    day: "numeric",
    ...(start.year !== end.year ? { year: "numeric" as const } : {}),
  });

  return `${startLabel} – ${endLabel}`;
}

export function formatMonthlyLabel(
  anchorDate: string,
  timeZone: string,
  includeYearWhenNotCurrent = true,
): string {
  const dt = parseIsoDay(anchorDate, timeZone);
  if (!dt.isValid) return anchorDate;

  const now = DateTime.now().setZone(timeZone);
  const showYear =
    includeYearWhenNotCurrent && dt.year !== now.year;

  return dt.toLocaleString({
    month: "long",
    ...(showYear ? { year: "numeric" as const } : {}),
  });
}

export function formatWeeklyLabel(
  periodStart: string,
  periodEnd: string,
  timeZone: string,
): string {
  return formatShortDateRange(periodStart, periodEnd, timeZone);
}

export function formatPeriodLabel(
  span: OverviewSpan,
  periodStart: string,
  periodEnd: string,
  timeZone: string,
): string {
  if (span === "daily") {
    return DateTime.fromISO(periodEnd, { zone: timeZone }).toLocaleString({
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (span === "monthly") {
    return formatMonthlyLabel(periodEnd, timeZone);
  }

  return formatWeeklyLabel(periodStart, periodEnd, timeZone);
}
