import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { EncounterSoundArchive } from "@/components/EncounterSoundArchive";
import { SoundMemoryPlayer } from "@/components/SoundMemoryPlayer";
import { mockDailyMemory, mockEncounters } from "@/lib/mockData";

export default function TodayPage() {
  return (
    <AppShell
      eyebrow={new Date(mockDailyMemory.date).toLocaleDateString("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      intro="The Station has turned nearby traces into a quiet daily sound memory. What was your day like?"
      title="Your day in sound"
    >
      <section className="relative isolate overflow-visible sm:min-h-[520px] lg:min-h-[660px]">
        <div className="relative z-0 mx-auto mt-2 w-full max-w-[720px] sm:absolute sm:left-1/2 sm:top-2 sm:mt-0 sm:-translate-x-1/2 lg:top-0">
          <div className="relative">
            <AbstractMemoryVisual
              composition={mockDailyMemory.composition}
              encounters={mockEncounters}
              showMutation
              size={720}
              {...mockDailyMemory.visualization}
            />
          </div>
        </div>
      </section>

      <div className="relative z-20 -mt-1 w-full sm:-mt-6 lg:-mt-10">
        <SoundMemoryPlayer
          melody={mockDailyMemory.composition.voices.flatMap(
            (voice) => voice.melody,
          )}
          title="Today"
          variant="controlRow"
        />
      </div>

      <EncounterSoundArchive
        composition={mockDailyMemory.composition}
        encounters={mockEncounters}
        seed={mockDailyMemory.visualization.seed}
      />
    </AppShell>
  );
}
