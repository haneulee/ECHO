"use client";

import { useRouter, useSearchParams } from "next/navigation";

import { shiftIsoDate } from "@/lib/zonedDayRange";
import type { OverviewSpan } from "@/lib/zonedDayRange";
import { overviewLabels } from "@/lib/uiPoetics";

type OverviewRangeControlsProps = {
  date: string;
  span: OverviewSpan;
  backHref: string;
};

export function OverviewRangeControls({
  date,
  span,
  backHref,
}: OverviewRangeControlsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function push(next: { date?: string; span?: OverviewSpan }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.date) params.set("date", next.date);
    if (next.span) params.set("span", next.span);
    params.set("back", backHref === "/archive" ? "/archive" : "/main");
    router.push(`/overview?${params.toString()}`);
  }

  const prevDate = shiftIsoDate(date, -1);
  const nextDate = shiftIsoDate(date, 1);

  return (
    <div className="pointer-events-auto absolute inset-x-4 top-[max(3.5rem,calc(env(safe-area-inset-top)+2.85rem))] z-30 flex flex-wrap items-center justify-center gap-2 sm:inset-x-8">
      <div className="glass-panel flex rounded-full p-1 font-body text-xs">
        {(["daily", "weekly", "monthly"] as const).map((value) => (
          <button
            className={[
              "rounded-full px-3 py-1.5 transition",
              span === value
                ? "glass-segment-active"
                : "glass-segment-idle text-text-muted",
            ].join(" ")}
            key={value}
            onClick={() => push({ span: value })}
            type="button"
          >
            {value === "daily"
              ? overviewLabels.timespanDaily
              : value === "weekly"
                ? overviewLabels.timespanWeekly
                : overviewLabels.timespanMonthly}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="glass-panel glass-interactive rounded-full px-3 py-1.5 font-body text-xs text-text disabled:opacity-40"
          disabled={!prevDate}
          onClick={() => prevDate && push({ date: prevDate })}
          type="button"
        >
          {overviewLabels.prev}
        </button>
        <span className="glass-panel rounded-full px-3 py-1.5 font-body text-xs text-text-muted">
          {date}
        </span>
        <button
          className="glass-panel glass-interactive rounded-full px-3 py-1.5 font-body text-xs text-text disabled:opacity-40"
          disabled={!nextDate}
          onClick={() => nextDate && push({ date: nextDate })}
          type="button"
        >
          {overviewLabels.next}
        </button>
      </div>
    </div>
  );
}
