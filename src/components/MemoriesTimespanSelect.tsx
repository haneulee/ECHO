"use client";

import { overviewLabels } from "@/lib/uiPoetics";
import type { OverviewSpan } from "@/lib/zonedDayRange";

const TIMESPAN_OPTIONS: { value: OverviewSpan; label: string }[] = [
  { value: "daily", label: overviewLabels.timespanDaily },
  { value: "weekly", label: overviewLabels.timespanWeekly },
  { value: "monthly", label: overviewLabels.timespanMonthly },
];

type TimespanSelectVariant = "header" | "pill";

type MemoriesTimespanSelectProps = {
  className?: string;
  onChange: (span: OverviewSpan) => void;
  value: OverviewSpan;
  variant?: TimespanSelectVariant;
};

export function MemoriesTimespanSelect({
  className = "",
  onChange,
  value,
  variant = "pill",
}: MemoriesTimespanSelectProps) {
  const isHeader = variant === "header";

  return (
    <label
      className={[
        isHeader ? "shell-timespan-select" : "memory-timespan-select",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      data-memory-no-drag
    >
      <span className="sr-only">{overviewLabels.timespanSelectLabel}</span>
      <select
        className={
          isHeader
            ? "shell-timespan-select__control"
            : [
                "memory-timespan-select__control memory-timespan-select__control--compact glass-btn-secondary glass-interactive rounded-full font-body text-xs",
              ].join(" ")
        }
        onChange={(event) => onChange(event.target.value as OverviewSpan)}
        value={value}
      >
        {TIMESPAN_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {isHeader ? (
        <span aria-hidden className="shell-timespan-select__chevrons">
          <span className="shell-timespan-select__chevron shell-timespan-select__chevron--up" />
          <span className="shell-timespan-select__chevron shell-timespan-select__chevron--down" />
        </span>
      ) : null}
    </label>
  );
}
