import type { OverviewSpan } from "@/lib/zonedDayRange";
import { parseOverviewSpan } from "@/lib/zonedDayRange";

const TIMESPAN_STORAGE_KEY = "echo:timespan";

export function memoriesPath(span: OverviewSpan): string {
  if (span === "daily") return "/memories";
  return `/memories?span=${span}`;
}

export function overviewPath(options: {
  back?: string;
  date?: string;
  deviceId?: string;
  span?: OverviewSpan;
}): string {
  const params = new URLSearchParams();
  if (options.date) params.set("date", options.date);
  if (options.span && options.span !== "daily") params.set("span", options.span);
  if (options.back) params.set("back", options.back);
  if (options.deviceId) params.set("deviceId", options.deviceId);
  const qs = params.toString();
  return qs ? `/overview?${qs}` : "/overview";
}

export function isMemoriesBackPath(back: string | null): boolean {
  if (!back) return false;
  if (back === "/memories" || back === "/archive") return true;
  return back.startsWith("/memories?");
}

export function readSpanFromPath(path: string): OverviewSpan | null {
  const queryIndex = path.indexOf("?");
  if (queryIndex === -1) return null;
  const params = new URLSearchParams(path.slice(queryIndex + 1));
  const span = params.get("span");
  return span === "weekly" || span === "monthly" ? span : null;
}

export function resolveMemoriesBackHref(
  backParam: string | null,
  span: OverviewSpan,
): string {
  if (!isMemoriesBackPath(backParam)) return "/main";
  return memoriesPath(span);
}

export function persistTimespan(span: OverviewSpan): void {
  try {
    sessionStorage.setItem(TIMESPAN_STORAGE_KEY, span);
  } catch {
    /* ignore storage failures */
  }
}

export function readPersistedTimespan(): OverviewSpan {
  try {
    const value = sessionStorage.getItem(TIMESPAN_STORAGE_KEY);
    if (value === "weekly" || value === "monthly") return value;
  } catch {
    /* ignore storage failures */
  }
  return "daily";
}

export function resolveTimespan(urlSpan: string | null): OverviewSpan {
  if (urlSpan === "weekly" || urlSpan === "monthly" || urlSpan === "daily") {
    persistTimespan(urlSpan === "daily" ? "daily" : urlSpan);
    return urlSpan === "daily" ? "daily" : urlSpan;
  }
  return readPersistedTimespan();
}
