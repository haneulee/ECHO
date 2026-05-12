import { echoTypeLabels } from "@/lib/echoTypeMeta";
import type { DailyMemory, Encounter } from "@/lib/types";
import { AbstractMemoryVisual } from "./AbstractMemoryVisual";
import { SoundMemoryPlayer } from "./SoundMemoryPlayer";

type MemoryCardProps = {
  memory: DailyMemory;
  encounters: Encounter[];
};

export function MemoryCard({ memory, encounters }: MemoryCardProps) {
  return (
    <article className="relative min-h-[360px] overflow-visible">
      <div className="absolute left-1/2 top-0 -translate-x-1/2">
        <div className="relative grid h-56 w-56 shrink-0 place-items-center md:h-72 md:w-72">
          <AbstractMemoryVisual
            composition={memory.composition}
            encounters={encounters.slice(
              0,
              Math.max(1, memory.totalEncounters),
            )}
            size={280}
            {...memory.visualization}
          />
          <SoundMemoryPlayer
            melody={memory.composition.voices.flatMap((voice) => voice.melody)}
            title="Play memory"
            variant="visualOverlay"
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

        <div className="mt-5 flex justify-between font-body text-sm leading-5 text-text-muted">
          <span>{memory.totalEncounters} encounters</span>
          <span>{echoTypeLabels[memory.dominantEchoType]}</span>
        </div>
      </div>
    </article>
  );
}
