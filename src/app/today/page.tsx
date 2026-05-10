import { AbstractMemoryVisual } from "@/components/AbstractMemoryVisual";
import { AppShell } from "@/components/AppShell";
import { SoundMemoryPlayer } from "@/components/SoundMemoryPlayer";
import { mockDailyMemory, mockEncounters } from "@/lib/mockData";
import { todayHero, todaySoundTitle } from "@/lib/uiPoetics";

export default function TodayPage() {
  return (
    <AppShell
      eyebrow={new Date(mockDailyMemory.date).toLocaleDateString("en", {
        weekday: "long",
        month: "long",
        day: "numeric",
      })}
      intro={todayHero.intro}
      title={todayHero.title}
    >
      <section className="relative isolate w-full overflow-visible pb-2">
        <div className="relative z-0 mx-auto mt-2 flex w-full max-w-[720px] justify-center">
          <AbstractMemoryVisual
            composition={mockDailyMemory.composition}
            encounters={mockEncounters}
            showMutation
            size={720}
            {...mockDailyMemory.visualization}
          />
        </div>

        {/* SVG overflow no longer covers controls; dock stays above imagery + bottom nav */}
        <div className="relative z-30 mx-auto flex w-full max-w-[720px] justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:pt-6">
          <div className="rounded-full border border-[#26231F]/[0.08] bg-white/95 px-4 py-2.5 shadow-[0_12px_48px_rgba(38,35,31,0.14)] backdrop-blur-md">
            <SoundMemoryPlayer
              melody={mockDailyMemory.composition.voices.flatMap(
                (voice) => voice.melody,
              )}
              title={todaySoundTitle}
              variant="controlRow"
            />
          </div>
        </div>
      </section>

      {/* <EncounterSoundArchive
        composition={mockDailyMemory.composition}
        encounters={mockEncounters}
        seed={mockDailyMemory.visualization.seed}
      /> */}
    </AppShell>
  );
}
