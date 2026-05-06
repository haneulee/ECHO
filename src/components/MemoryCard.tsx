import { echoTypeLabels, mockEncounters } from "@/lib/mockData";
import type { DailyMemory } from "@/lib/types";
import { AbstractMemoryVisual } from "./AbstractMemoryVisual";

type MemoryCardProps = {
  memory: DailyMemory;
};

export function MemoryCard({ memory }: MemoryCardProps) {
  return (
    <article className="relative min-h-[360px] overflow-visible">
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <div className="grid h-56 w-56 shrink-0 place-items-center md:h-72 md:w-72">
          <AbstractMemoryVisual
            composition={memory.composition}
            encounters={mockEncounters.slice(
              0,
              Math.max(1, memory.totalEncounters),
            )}
            size={280}
            {...memory.visualization}
          />
        </div>
      </div>

      <div className="relative z-10 flex min-h-[360px] flex-col justify-end">
        <p className="font-body text-xs uppercase tracking-[0.24em] text-text-muted">
          {new Date(memory.date).toLocaleDateString("en", {
            month: "short",
            day: "numeric",
          })}
        </p>
        <h2 className="mt-2 font-display text-[32px] leading-[36px] tracking-[-0.03em]">
          {memory.memoryPhrase}
        </h2>
        <div className="mt-5 flex justify-between font-body text-sm leading-5 text-text-muted">
          <span>{memory.totalEncounters} encounters</span>
          <span>{echoTypeLabels[memory.dominantEchoType]}</span>
        </div>
      </div>
    </article>
  );
}
