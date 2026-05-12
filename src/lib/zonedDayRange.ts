import { DateTime } from "luxon";

export function isValidIanaTimeZone(timeZone: string): boolean {
  if (!timeZone.trim()) return false;
  return DateTime.now().setZone(timeZone).isValid;
}

/**
 * Calendar day `dateStr` (YYYY-MM-DD) in IANA `timeZone`, as UTC instants
 * [start, end) suitable for filtering `startedAt` in the database.
 */
export function zonedDayRangeUtc(
  dateStr: string,
  timeZone: string,
): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const start = DateTime.fromISO(`${dateStr}T00:00:00`, { zone: timeZone });
  if (!start.isValid) return null;
  const end = start.plus({ days: 1 });
  return {
    start: start.toUTC().toJSDate(),
    end: end.toUTC().toJSDate(),
  };
}

export function formatCalendarEyebrow(
  isoDay: string,
  timeZone: string,
  locale = "en",
): string {
  const dt = DateTime.fromISO(isoDay, { zone: timeZone });
  if (!dt.isValid) return isoDay;
  return dt.setLocale(locale).toLocaleString({
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
