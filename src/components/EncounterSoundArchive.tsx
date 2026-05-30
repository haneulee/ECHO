import { echoTypeLabels } from "@/lib/echoTypeMeta";
import { encounterDisplayColor, encounterDisplayName } from "@/lib/encounterDisplay";
import type { DailyMemory, Encounter } from "@/lib/types";
import { encounterArchive, proximityWhisper } from "@/lib/uiPoetics";
import { AbstractMemoryVisual } from "./AbstractMemoryVisual";

type EncounterSoundArchiveProps = {
  encounters: Encounter[];
  composition: DailyMemory["composition"];
  seed: number;
};

export function EncounterSoundArchive({
  encounters,
  composition,
  seed,
}: EncounterSoundArchiveProps) {
  return (
    <section className="mt-20">
      <div className="mb-8 flex items-end justify-between gap-6">
        <div>
          <p className="font-body text-xs uppercase text-text-muted">
            {encounterArchive.eyebrow}
          </p>
          <h2 className="mt-3 font-display text-[40px] leading-[44px] tracking-[-0.03em] lg:text-[64px] lg:leading-[68px]">
            {encounterArchive.title}
          </h2>
        </div>
      </div>

      <div className="grid gap-x-10 gap-y-16 md:grid-cols-2 xl:grid-cols-4">
        {encounters.map((encounter, index) => {
          const voice =
            composition.voices.find(
              (item) => item.echoType === encounter.otherEchoType,
            ) ?? composition.voices[0];

          return (
            <article
              className="relative min-h-[360px] overflow-visible md:min-h-[420px]"
              key={encounter.id}
            >
              <div className="absolute left-1/2 top-8 -translate-x-1/2">
                <AbstractMemoryVisual
                  brightness={0.78}
                  composition={{
                    ...composition,
                    voices: [voice],
                  }}
                  density={0.42 + encounter.closenessAvg * 0.48}
                  encounters={[encounter]}
                  movement={0.2 + encounter.closenessAvg * 0.34}
                  seed={seed + index * 137}
                  showMutation={encounter.proximityZone === "very_close"}
                  size={320}
                />
              </div>

              <div className="relative z-10 flex min-h-[360px] flex-col justify-end pb-4 pt-60 md:min-h-[420px] md:pt-72">
                <div className="flex items-center gap-3">
                  <span
                    aria-hidden
                    className="h-4 w-4 rounded-full border border-text/10"
                    style={{ backgroundColor: encounterDisplayColor(encounter) }}
                  />
                  <p className="font-display text-[34px] leading-[38px] tracking-[-0.03em]">
                    {encounterDisplayName(encounter)}
                  </p>
                </div>
                <p className="mt-1 font-body text-xs uppercase text-text-muted">
                  {echoTypeLabels[encounter.otherEchoType]}
                </p>
                <p className="mt-3 max-w-56 font-body text-sm leading-5 text-text-muted">
                  {new Date(encounter.startedAt).toLocaleTimeString("en", {
                    hour: "numeric",
                    minute: "2-digit",
                  })}{" "}
                  · {proximityWhisper[encounter.proximityZone]} ·{" "}
                  {Math.round(encounter.durationSec / 60) === 0
                    ? "a thin minute"
                    : Math.round(encounter.durationSec / 60) === 1
                      ? "one minute held open"
                      : `${Math.round(encounter.durationSec / 60)} minutes held open`}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
