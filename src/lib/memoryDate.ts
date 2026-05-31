import {
  formatPeriodLabel,
  periodBoundsForDate,
} from "@/lib/calendarPeriod";
import type { OverviewSpan } from "@/lib/zonedDayRange";

export function memoryDate(date: string, style: "long" | "short") {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en", {
    ...(style === "long"
      ? {
          weekday: "long" as const,
          month: "long" as const,
          year: "numeric" as const,
        }
      : { month: "short" as const, year: "numeric" as const }),
    day: "numeric",
  });
}

/** Anchor date is the last day of the overview window. */
export function overviewPeriodLabel(
  anchorDate: string,
  span: OverviewSpan,
  timeZone: string,
) {
  if (span === "daily") return memoryDate(anchorDate, "long");

  const bounds = periodBoundsForDate(anchorDate, span, timeZone);
  if (!bounds) return memoryDate(anchorDate, "long");

  return formatPeriodLabel(
    span,
    bounds.periodStart,
    bounds.periodEnd,
    timeZone,
  );
}

export function memoryPeriodLabel(
  item: { memory: { date: string }; periodStart?: string; periodEnd?: string },
  span: OverviewSpan,
  timeZone: string,
) {
  if (span === "daily") return memoryDate(item.memory.date, "long");

  const periodEnd = item.periodEnd ?? item.memory.date;
  const periodStart = item.periodStart ?? item.memory.date;

  return formatPeriodLabel(span, periodStart, periodEnd, timeZone);
}
