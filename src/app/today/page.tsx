import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { EncounterSoundArchive } from "@/components/EncounterSoundArchive";
import { mockDailyMemory, mockEncounters } from "@/lib/mockData";

export default function TodayPage() {
  return (
    <AppShell
      eyebrow={new Date(mockDailyMemory.date).toLocaleDateString("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      intro="The Station has turned nearby traces into a quiet daily sound memory."
      title="Today's ring."
    >
      <section className="relative min-h-[620px] overflow-visible lg:min-h-[760px]">
        <div className="absolute left-1/2 top-0 -z-0 w-[min(92vw,760px)] -translate-x-1/2 lg:top-[-40px]">
          <AbstractMemoryVisual
            composition={mockDailyMemory.composition}
            encounters={mockEncounters}
            showMutation
            size={760}
            {...mockDailyMemory.visualization}
          />
        </div>

        <div className="relative z-10 flex min-h-[620px] flex-col justify-end pb-10 lg:min-h-[760px] lg:pb-20">
          <p className="max-w-3xl font-display text-[48px] leading-[52px] tracking-[-0.04em] text-white mix-blend-difference sm:text-[64px] sm:leading-[68px] lg:text-[96px] lg:leading-[98px]">
            {mockDailyMemory.memoryPhrase}
          </p>
          <p className="mt-8 max-w-md font-body text-base leading-6 text-text-muted">
            {mockDailyMemory.composition.tempoBpm} BPM ·{" "}
            {mockDailyMemory.composition.scale}. The day is not counted here;
            it is held as pigment, closeness, and borrowed melody.
          </p>
        </div>
      </section>

      <EncounterSoundArchive
        composition={mockDailyMemory.composition}
        encounters={mockEncounters}
        seed={mockDailyMemory.visualization.seed}
      />
    </AppShell>
  );
}
