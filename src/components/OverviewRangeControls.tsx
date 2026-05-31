"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { overviewPeriodLabel } from "@/lib/memoryDate";
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
  span: OverviewSpan;
  timeZone: string;
};

export function OverviewRangeControls({
  date,
  hasNextPeriod,
  hasPrevPeriod,
  span,
  timeZone,
}: OverviewRangeControlsProps) {
  const router = useRouter();
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

  const prevDate = shiftOverviewAnchorDate(date, span, -1, timeZone);
  const nextDate = shiftOverviewAnchorDate(date, span, 1, timeZone);

  return (
    <div className="overview-range-controls pointer-events-auto absolute inset-x-4 top-[max(3.5rem,calc(env(safe-area-inset-top)+2.85rem))] z-30 flex flex-wrap items-center justify-center gap-2 sm:inset-x-8">
      <div className="flex items-center gap-2">
        <button
          aria-label={overviewLabels.prev}
          className="glass-panel glass-interactive grid h-9 w-9 place-items-center rounded-full text-text disabled:opacity-40"
          disabled={!hasPrevPeriod || !prevDate}
          onClick={() => prevDate && push({ date: prevDate })}
          type="button"
        >
          <span aria-hidden className="font-display text-2xl leading-none">
            ‹
          </span>
        </button>
        <span className="glass-panel overview-period-label rounded-full px-3 py-1.5 font-body text-xs text-text-muted">
          {periodLabel}
        </span>
        <button
          aria-label={overviewLabels.next}
          className="glass-panel glass-interactive grid h-9 w-9 place-items-center rounded-full text-text disabled:opacity-40"
          disabled={!hasNextPeriod || !nextDate}
          onClick={() => nextDate && push({ date: nextDate })}
          type="button"
        >
          <span aria-hidden className="font-display text-2xl leading-none">
            ›
          </span>
        </button>
      </div>
    </div>
  );
}
