"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { overviewPeriodLabel } from "@/lib/memoryDate";
import { useAppRouter } from "@/hooks/useAppRouter";
import { shiftOverviewAnchorDate } from "@/lib/calendarPeriod";
import {
  isMemoriesBackPath,
  memoriesPath,
} from "@/lib/timespanNavigation";
import { parseOverviewSpan, type OverviewSpan } from "@/lib/zonedDayRange";
import { overviewLabels } from "@/lib/uiPoetics";

type OverviewRangeControlsProps = {
  date: string;
  hasNextPeriod: boolean;
  hasPrevPeriod: boolean;
  nextPeriodDate?: string | null;
  prevPeriodDate?: string | null;
  span: OverviewSpan;
  timeZone: string;
};

export function OverviewRangeControls({
  date,
  hasNextPeriod,
  hasPrevPeriod,
  nextPeriodDate = null,
  prevPeriodDate = null,
  span,
  timeZone,
}: OverviewRangeControlsProps) {
  const router = useAppRouter();
  const searchParams = useSearchParams();

  function push(next: { date: string }) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", next.date);
    const span = parseOverviewSpan(params.get("span"));
    const back = params.get("back");
    params.set(
      "back",
      isMemoriesBackPath(back) ? memoriesPath(span) : "/main",
    );
    router.push(`/overview?${params.toString()}`);
  }

  const periodLabel = useMemo(
    () => overviewPeriodLabel(date, span, timeZone),
    [date, span, timeZone],
  );

  const prevDate =
    prevPeriodDate ?? shiftOverviewAnchorDate(date, span, -1, timeZone);
  const nextDate =
    nextPeriodDate ?? shiftOverviewAnchorDate(date, span, 1, timeZone);

  return (
    <div className="overview-range-controls pointer-events-auto absolute inset-x-4 bottom-[max(3.25rem,calc(env(safe-area-inset-bottom)+3rem))] z-30 flex flex-wrap items-center justify-center gap-2 sm:inset-x-8">
      <div className="flex items-center gap-3">
        <button
          aria-label={overviewLabels.prev}
          className="memory-stage-arrow memory-stage-arrow--prev"
          disabled={!hasPrevPeriod || !prevDate}
          onClick={() => prevDate && push({ date: prevDate })}
          type="button"
        />
        <span className="glass-panel overview-period-label rounded-full px-3 py-1.5 font-body text-xs text-text-muted">
          {periodLabel}
        </span>
        <button
          aria-label={overviewLabels.next}
          className="memory-stage-arrow memory-stage-arrow--next"
          disabled={!hasNextPeriod || !nextDate}
          onClick={() => nextDate && push({ date: nextDate })}
          type="button"
        />
      </div>
    </div>
  );
}
